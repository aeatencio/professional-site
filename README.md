# SITE-V1 professional site

Static professional site and future reproducible CV for Andrés Atencio,
`Software Developer · IT Teacher`. The GitHub remote is currently private, but
the code and complete history are maintained as safe for possible future public
visibility. Opening the repository would not publish or deploy the site.

Visible professional data will be an approved public projection produced by the
separate, permanently private canonical source. Build, test, preview, and deploy
must remain self-contained and never access that private repository.

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
npm test         # public-projection boundary tests
```

Astro is installed locally through this project. Do not install project tools
globally. `check` and `build` first validate the repository-local projection;
no private repository is accessed. See the [architecture](docs/architecture.md),
[public projection contract](docs/public-projection-contract.md), and
[DATA-BOUNDARY-001 decision](docs/decisions/001-private-source-public-projection.md).
