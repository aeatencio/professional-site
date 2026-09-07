import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

export const CV_PDF = {
  a4: {
    format: 'a4',
    href: '/cv/andres-atencio-cv-a4.pdf',
    download: 'Andres-Atencio-CV-A4.pdf',
    publicPath: 'public/cv/andres-atencio-cv-a4.pdf',
    distPath: 'dist/cv/andres-atencio-cv-a4.pdf',
    route: '/cv/',
    paper: {
      widthMm: 210,
      heightMm: 297,
      widthIn: 210 / 25.4,
      heightIn: 297 / 25.4
    }
  },
  letter: {
    format: 'letter',
    href: '/cv/andres-atencio-cv-letter.pdf',
    download: 'Andres-Atencio-CV-US-Letter.pdf',
    publicPath: 'public/cv/andres-atencio-cv-letter.pdf',
    distPath: 'dist/cv/andres-atencio-cv-letter.pdf',
    route: '/cv/letter/',
    paper: {
      widthMm: 215.9,
      heightMm: 279.4,
      widthIn: 8.5,
      heightIn: 11
    }
  }
};

/**
 * Decorative miniature of the printed A4 CV shown on Home.
 *
 * It is a screenshot of the same document `/cv/` prints, captured under print
 * media at `viewport` CSS pixels and `scale`, so the picture cannot drift from
 * the PDFs. It carries no accessible content: Home links to `/cv/` and to both
 * PDFs in HTML.
 */
export const CV_PREVIEW = {
  format: 'a4',
  route: '/cv/',
  href: '/cv/andres-atencio-cv-a4-preview.png',
  publicPath: 'public/cv/andres-atencio-cv-a4-preview.png',
  distPath: 'dist/cv/andres-atencio-cv-a4-preview.png',
  viewport: { width: 794, height: 1123 },
  scale: 2,
  width: 1588,
  height: 2246
};

export const CV_PDF_FINGERPRINT_PATH = 'scripts/cv-pdf-fingerprint.json';
export const PUBLIC_SITE_ORIGIN = 'https://andresatencio.com';

export const CV_PRINT_TO_PDF_BASE = {
  landscape: false,
  displayHeaderFooter: false,
  printBackground: true,
  preferCSSPageSize: true,
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0
};

export function printToPdfParams(pdf) {
  return {
    ...CV_PRINT_TO_PDF_BASE,
    paperWidth: pdf.paper.widthIn,
    paperHeight: pdf.paper.heightIn
  };
}

const POINT_TOLERANCE = 3;
const MM_TO_PT = 72 / 25.4;

export function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function inspectPdf(buffer) {
  if (buffer.byteLength < 8 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('File is not a PDF');
  }

  const latin1 = buffer.toString('latin1');
  return {
    bytes: buffer.byteLength,
    pageCount: readPdfPageCount(latin1),
    mediaBox: readPdfMediaBox(latin1)
  };
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function inspectPng(buffer) {
  if (buffer.byteLength < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('File is not a PNG');
  }
  if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error('PNG is missing its IHDR header');
  }

  return {
    bytes: buffer.byteLength,
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

export async function verifyCvPreview({ dist = false } = {}) {
  const fingerprint = JSON.parse(await readFile(repoPath(CV_PDF_FINGERPRINT_PATH), 'utf8'));
  const recorded = fingerprint.files[CV_PREVIEW.publicPath];
  if (!recorded) {
    throw new Error(`Fingerprint is missing ${CV_PREVIEW.publicPath}`);
  }

  await verifyPreviewFile(CV_PREVIEW.publicPath, recorded);

  if (dist) {
    await verifyPreviewFile(CV_PREVIEW.distPath, recorded);
  }
}

async function verifyPreviewFile(relativePath, recorded) {
  const buffer = await readFile(repoPath(relativePath));
  const digest = sha256(buffer);
  if (digest !== recorded.sha256 || buffer.byteLength !== recorded.bytes) {
    throw new Error(
      `${relativePath} does not match the recorded CV preview fingerprint. Run \`npm run cv:pdf\`.`
    );
  }

  const inspection = inspectPng(buffer);
  if (inspection.width !== CV_PREVIEW.width || inspection.height !== CV_PREVIEW.height) {
    throw new Error(
      `${relativePath} is ${inspection.width}x${inspection.height}px, expected ${CV_PREVIEW.width}x${CV_PREVIEW.height}px`
    );
  }
}

export async function verifyCvPdfs({ dist = false } = {}) {
  const fingerprint = JSON.parse(await readFile(repoPath(CV_PDF_FINGERPRINT_PATH), 'utf8'));

  for (const pdf of Object.values(CV_PDF)) {
    const recorded = fingerprint.files[pdf.publicPath];
    if (!recorded) {
      throw new Error(`Fingerprint is missing ${pdf.publicPath}`);
    }

    await verifyPdfFile(pdf, pdf.publicPath, recorded);

    if (dist) {
      await verifyPdfFile(pdf, pdf.distPath, recorded);
    }
  }
}

async function verifyPdfFile(pdf, relativePath, recorded) {
  const buffer = await readFile(repoPath(relativePath));
  const digest = sha256(buffer);
  if (digest !== recorded.sha256 || buffer.byteLength !== recorded.bytes) {
    throw new Error(
      `${relativePath} does not match the recorded CV PDF fingerprint. Run \`npm run cv:pdf\`.`
    );
  }

  const inspection = inspectPdf(buffer);
  if (inspection.pageCount !== 1) {
    throw new Error(`${relativePath} must be one page, found ${inspection.pageCount}`);
  }

  const expectedWidth = pdf.paper.widthMm * MM_TO_PT;
  const expectedHeight = pdf.paper.heightMm * MM_TO_PT;
  if (Math.abs(inspection.mediaBox.width - expectedWidth) > POINT_TOLERANCE
    || Math.abs(inspection.mediaBox.height - expectedHeight) > POINT_TOLERANCE) {
    throw new Error(
      `${relativePath} MediaBox is ${inspection.mediaBox.width.toFixed(2)}x${inspection.mediaBox.height.toFixed(2)}pt, expected ${expectedWidth.toFixed(2)}x${expectedHeight.toFixed(2)}pt`
    );
  }
}

function readPdfPageCount(latin1) {
  const counts = [
    ...latin1.matchAll(/\/Type\s*\/Pages\b[^>]*\/Count\s+(\d+)/g)
  ].map((match) => Number(match[1]));

  if (!counts.length) {
    counts.push(
      ...[...latin1.matchAll(/\/Count\s+(\d+)[^>]*\/Type\s*\/Pages\b/g)].map((match) => Number(match[1]))
    );
  }

  if (!counts.length) {
    throw new Error('Could not read PDF page count');
  }

  return Math.max(...counts);
}

function readPdfMediaBox(latin1) {
  const match = latin1.match(
    /\/(?:MediaBox|CropBox)\s*\[\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\]/
  );
  if (!match) {
    throw new Error('Could not read PDF MediaBox');
  }

  const [, x0, y0, x1, y1] = match.map(Number);
  return {
    width: x1 - x0,
    height: y1 - y0
  };
}
