# SITE-V1 professional site

Static professional site and reproducible private-V1 Software Development CV for Andrés Atencio,
`Software Developer · IT Teacher`. This repository is public on GitHub. Its code
and complete history are maintained as safe for public exposure. Repository
visibility does not publish or deploy the site.

Professional copy and required public structured data come from the local
`professional-public-projection/v1` produced in the separate, permanently
private source repository. The projection contains content, not approval
workflow. Build, test, preview and deploy remain self-contained and never
access the private repository.

## Requirements

- Node.js 24 LTS or a later compatible LTS release
- npm 11 or later
- Git

## Setup

```powershell
npm ci
```

## Commands

```powershell
npm run dev      # local development server
npm run check    # Astro and TypeScript diagnostics
npm run build    # static production build in dist/
npm run preview  # preview the production build
npm run cv:pdf   # regenerate public CV PDFs from current HTML
npm run layout:check  # rebuild, then verify Home identity and overflow at 390px and 320px
npm test         # public-projection boundary tests
```

The public site origin is `https://andresatencio.com`. Internal navigation uses same-origin paths (`/`, `/cv/`, `/cv/letter/`, and the PDF hrefs under `/cv/`). The CV document itself prints that public origin so a downloaded PDF still points back to the site. Do not present a `workers.dev` host as the public identity.

The downloadable files in `public/cv/` are real PDFs generated from the current printable CV HTML. `npm run cv:pdf` first validates the local projection, then rebuilds the HTML and prints both paper sizes. It needs a local Edge or Chrome executable; if the browser is not on a default path, set `EDGE_PATH` or `CHROME_PATH`. Chromium may embed generation timestamps, so an otherwise identical reprint can change the PDF bytes; run `cv:pdf` when the printable CV actually changes and keep the updated files and fingerprint together.

The build fingerprints the effective CV print inputs, not a guessed print-only CSS subset. That boundary is the built HTML for `/cv/` and `/cv/letter/` (including head, metadata, `@page` and `#cv-main`), the local stylesheets and local font/image assets those pages load, `Astro.site`, and the `Page.printToPDF` options for A4 and US Letter. Changes that cannot affect the PDF still may require a reprint; a stale PDF must not pass. `layout:check` rebuilds first, then confirms the Home document over HTTP and checks horizontal overflow at 390px and 320px. Deployment CI runs tests, `check`, and `layout:check`.

Astro is installed locally through this project. Do not install project tools
globally. `check` and `build` first validate the repository-local projection;
no private repository is accessed. See the [architecture](docs/architecture.md),
[public projection contract](docs/public-projection-contract.md), and
[DATA-BOUNDARY-001 decision](docs/decisions/001-private-source-public-projection.md).
