# Productive Time Tracker

A client-side web app for managing one person's time entries against the
[Productive](https://www.productive.io/) API — log in with an API token and
Organization ID, then view, add, edit, and delete time entries for a
selected day. No backend of its own: the browser talks to Productive's API
directly.

## Prerequisites

- **Node.js 20+**
- **pnpm** (the project is set up as a pnpm workspace) — install with
  `corepack enable` or `npm install -g pnpm` if you don't have it
- A **Productive account** with an API token and an Organization ID (see
  [Getting API credentials](#getting-api-credentials) below)

## Setup

```bash
git clone <this-repository-url>
cd productive-time-tracker
pnpm install
```

## Run locally

```bash
pnpm dev
```

Starts a Vite dev server (default [http://localhost:5173](http://localhost:5173)) with hot reload.
Open it in a browser and sign in with your API token and Organization ID.

## Other scripts

| Command             | What it does                                                                        |
| ------------------- | ----------------------------------------------------------------------------------- |
| `pnpm build`        | Produces a production build in `dist/`                                              |
| `pnpm preview`      | Serves the production build in `dist/` locally, to sanity-check it before deploying |
| `pnpm typecheck`    | Type-checks without emitting or building                                            |
| `pnpm test`         | Runs the test suite (Vitest)                                                        |
| `pnpm lint`         | Runs ESLint                                                                         |
| `pnpm lint:fix`     | Runs ESLint with `--fix`                                                            |
| `pnpm format`       | Formats the codebase with Prettier                                                  |
| `pnpm format:check` | Checks formatting without writing changes                                           |

A pre-commit hook (Husky + lint-staged) formats and lints staged files
automatically.

## Getting API credentials

1. Register or sign in to a Productive account.
2. In the app, go to your organization's settings → **API integrations**.
3. There you'll find your **API token** and **Organization ID** — enter both
   on this app's login screen. Credentials are stored in your browser's
   `localStorage` (not sent anywhere but Productive's API) and cleared on
   logout.

## Technical specification

Architecture, main UI components, API communication, and implementation
decisions are in
[`docs/technical-specification.md`](docs/technical-specification.md).
