# daily-todo

Daily todo list app: single-screen, offline, device-only (React + TypeScript + Vite).

Requires Node 24 (`.nvmrc`) and npm.

## Install

```sh
npm ci
```

## Run (dev)

```sh
npm run dev   # http://localhost:5173
```

## Check

```sh
npm run lint
npm run typecheck
npm test
```

## Production build

The service worker only runs in the production build.

```sh
npm run build
npm run preview -- --host --port 4173   # http://127.0.0.1:4173
```

Load the page once, then go offline and reload: the app still loads.

Set `VITE_BASE` to serve under a sub-path (default `/`), e.g. `VITE_BASE=/daily-todo/ npm run build`.
