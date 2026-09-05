# Andrés Atencio — Professional Site

Professional website and print-ready CV for Andrés Atencio, **Software Developer · IT Teacher**.

**[Visit andresatencio.com](https://andresatencio.com)**

Built with Astro and TypeScript. This repository contains the public site, its print-ready A4 and US Letter CVs, and the tooling used to build, validate and regenerate them.

## About this project

The site is static, versioned and reproducible. Its public origin is `https://andresatencio.com`.

Internal navigation uses same-origin paths, including `/`, `/cv/`, `/cv/letter/` and the downloadable PDF files under `/cv/`. `/cv/` is the canonical web view of the Software Development CV: a first-class, responsive page of `andresatencio.com` that uses the global header and footer. `/cv/letter/` remains a functional route for US Letter print and PDF generation; its screen presentation matches `/cv/`. A4 and US Letter are download and print formats, not alternate web layouts. Print and PDF output exclude the site shell and on-page download actions; they contain only the document. The CV itself prints the public site origin so a downloaded copy still points back to the site.

This repository is public on GitHub. Its code and complete history are maintained as safe for public exposure.

## Local development

### Requirements

- Node.js 24 LTS or a later compatible LTS release
- npm 11 or later
- Git

### Setup

```powershell
npm ci
```

### Commands

```powershell
npm run dev           # local development server
npm run check         # Astro and TypeScript diagnostics
npm run build         # static production build in dist/
npm run preview       # preview the production build
npm run cv:pdf        # regenerate public CV PDFs from current HTML
npm run layout:check  # rebuild, then verify Home navigation, anchors and responsive layout
npm test              # public-projection boundary tests
```

Astro is installed locally through this project. Do not install project tools globally.

## CV generation and validation

The downloadable files in `public/cv/` are real PDFs generated from the current printable CV HTML.

`npm run cv:pdf` first validates the local projection, then rebuilds the HTML and prints both paper sizes. It needs a local Edge or Chrome executable; if the browser is not on a default path, set `EDGE_PATH` or `CHROME_PATH`.

Chromium may embed generation timestamps, so an otherwise identical reprint can change the PDF bytes. Run `cv:pdf` when the printable CV actually changes and keep the updated files and fingerprint together.

The build fingerprints the effective CV print inputs rather than a guessed print-only CSS subset. That boundary includes:

- the built HTML for `/cv/` and `/cv/letter/`, including head, metadata, `@page` and `#cv-main`;
- the local stylesheets and local font/image assets those pages load;
- `Astro.site`;
- the `Page.printToPDF` options for A4 and US Letter.

Changes that cannot affect the PDF may still require a reprint; a stale PDF must not pass.

`layout:check` rebuilds first, then verifies Home navigation, CV site-page composition, sticky anchor offsets, horizontal overflow, and the native mobile fallback with JavaScript disabled before page load. Deployment CI runs tests, `check` and `layout:check`.

## Architecture and public data boundary

Professional copy and required public structured data come from the local `professional-public-projection/v1`, produced in a separate, permanently private source repository.

The projection contains content, not approval workflow. Build, test, preview and deploy remain self-contained and never access the private repository.

`check` and `build` first validate the repository-local projection; no private repository is accessed.

For more detail, see:

- [Architecture](docs/architecture.md)
- [Public projection contract](docs/public-projection-contract.md)
- [DATA-BOUNDARY-001 decision](docs/decisions/001-private-source-public-projection.md)
