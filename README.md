# SITE-V1 professional site

Static professional site and future reproducible CV for Andrés Atencio,
`Software Developer · IT Teacher`. R1.0 contains only the repository's technical
foundation and preliminary professional-source contract.

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
```

Astro is installed locally through this project. Do not install project tools
globally. See [`docs/architecture.md`](docs/architecture.md) for the current
scope and [`docs/professional-source-contract.md`](docs/professional-source-contract.md)
for the data contract.
