import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { access, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

export async function findBrowser() {
  const found = await findBrowserCandidates();
  if (!found.length) {
    throw new Error(
      'Could not find Edge or Chrome. Set EDGE_PATH or CHROME_PATH to a local browser executable.'
    );
  }
  return found[0];
}

async function findBrowserCandidates() {
  const candidates = [
    process.env.EDGE_PATH,
    process.env.CHROME_PATH,
    path.join(process.env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);

  const found = [];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      found.push(candidate);
    } catch {
      // try the next candidate
    }
  }
  return found;
}

export async function withHeadlessBrowser(rootDir, fn) {
  const server = await startStaticServer(rootDir);
  const browsers = await findBrowserCandidates();
  if (!browsers.length) {
    server.close();
    throw new Error(
      'Could not find Edge or Chrome. Set EDGE_PATH or CHROME_PATH to a local browser executable.'
    );
  }

  let lastError;
  try {
    for (const browserPath of browsers) {
      const profileDir = await mkdtemp(path.join(os.tmpdir(), 'cv-chrome-'));
      const browser = launchBrowser(browserPath, profileDir);
      try {
        const cdp = await connectCdp(profileDir, browser);
        try {
          return await fn({ cdp, origin: server.origin });
        } finally {
          await killBrowser(browser);
        }
      } catch (error) {
        lastError = error;
        await killBrowser(browser);
      } finally {
        await rm(profileDir, { recursive: true, force: true }).catch(() => {});
      }
    }
  } finally {
    server.close();
  }

  throw lastError;
}

export function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (request, response) => {
      try {
        const filePath = resolvePublicPath(rootDir, request.url ?? '/');
        if (!filePath) {
          response.writeHead(403).end('Forbidden');
          return;
        }
        const fileStat = await stat(filePath);
        if (!fileStat.isFile()) {
          response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
          return;
        }
        const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
        response.writeHead(200, { 'Content-Type': contentType });
        await pipeline(createReadStream(filePath), response);
      } catch (error) {
        if (response.headersSent) return;
        if (error && error.code === 'ENOENT') {
          response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
          return;
        }
        response.writeHead(500).end('Server error');
      }
    });

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        origin: `http://127.0.0.1:${address.port}`,
        close() {
          server.close();
        }
      });
    });
  });
}

export function createCdp(ws) {
  let nextId = 0;
  const pending = new Map();
  const eventWaiters = new Map();

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id != null && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message} (${message.error.code})`));
      else resolve(message.result);
      return;
    }

    if (message.method && eventWaiters.has(message.method)) {
      const waiters = eventWaiters.get(message.method);
      eventWaiters.delete(message.method);
      for (const resolve of waiters) resolve(message.params);
    }
  });

  return {
    send(method, params = {}, sessionId) {
      const id = ++nextId;
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      const result = new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
      ws.send(JSON.stringify(payload));
      return result;
    },
    waitEvent(method) {
      return new Promise((resolve) => {
        const waiters = eventWaiters.get(method) ?? [];
        waiters.push(resolve);
        eventWaiters.set(method, waiters);
      });
    }
  };
}

export async function openPage(cdp, url) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Page.enable', {}, sessionId);
  const loaded = cdp.waitEvent('Page.loadEventFired');
  await cdp.send('Page.navigate', { url }, sessionId);
  await Promise.race([
    loaded,
    sleep(20000).then(() => {
      throw new Error(`Timed out loading ${url}`);
    })
  ]);
  return { targetId, sessionId };
}

export async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  }, sessionId);
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime.evaluate failed');
  }
  return result.result.value;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function launchBrowser(browserPath, userDataDir) {
  const stderrChunks = [];
  const child = spawn(browserPath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-port=0',
    'about:blank'
  ], {
    stdio: ['ignore', 'ignore', 'pipe']
  });

  child.stderr.on('data', (chunk) => {
    stderrChunks.push(chunk);
  });
  child.on('error', (error) => {
    throw error;
  });
  child.stderrText = () => Buffer.concat(stderrChunks).toString('utf8').trim();
  return child;
}

async function connectCdp(userDataDir, browser) {
  const port = await waitForDevToolsPort(userDataDir, browser);
  const version = await fetch(`http://127.0.0.1:${port}/json/version`).then((response) => {
    if (!response.ok) throw new Error(`DevTools version probe failed (${response.status})`);
    return response.json();
  });
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve(), { once: true });
    ws.addEventListener('error', () => reject(new Error('WebSocket connection failed')), { once: true });
  });
  return createCdp(ws);
}

async function waitForDevToolsPort(userDataDir, browser) {
  const portFile = path.join(userDataDir, 'DevToolsActivePort');
  const deadline = Date.now() + 15000;

  while (Date.now() < deadline) {
    if (browser.exitCode != null) {
      const detail = browser.stderrText?.() ? ` ${browser.stderrText()}` : '';
      throw new Error(
        `Browser exited before exposing DevTools (code ${browser.exitCode}).${detail}`
      );
    }
    try {
      const [portLine] = (await readFile(portFile, 'utf8')).split(/\r?\n/);
      const port = Number(portLine);
      if (Number.isInteger(port) && port > 0) return port;
    } catch {
      // the browser is still starting
    }
    await sleep(100);
  }

  throw new Error('Timed out waiting for the browser DevTools port');
}

function killBrowser(child) {
  if (!child || child.exitCode != null) return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill();
      resolve();
    }, 2000);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill();
  });
}

function resolvePublicPath(rootDir, requestUrl) {
  const urlPath = decodeURIComponent((requestUrl.split('?')[0] || '/'));
  let relativePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
  if (relativePath.endsWith('/')) relativePath += 'index.html';
  const absolutePath = path.normalize(path.join(rootDir, relativePath));
  const relativeToRoot = path.relative(rootDir, absolutePath);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) return null;
  return absolutePath;
}
