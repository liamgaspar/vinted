# Vinted Manga Tracker

A small, fast web app to track and score second‑hand manga lots (e.g. from Vinted) so you
can spot the best deals at a glance. It scores each listing from 0 to 100, surfaces
buy/negotiation tips, and keeps a running budget — all in the browser, with no account and
no server‑side storage.

> The UI is bilingual (English / French).

## Features

- **Automatic deal scoring (0–100)** based on price per volume, ratio vs. retail, lot size,
  condition, rarity and listing age.
- **Smart recommendations** — buy‑now alerts, negotiation suggestions, overpricing warnings,
  duplicate detection, shipping estimates.
- **Budget tracking** — total spend, shipping, retail value and estimated savings.
- **Filtering & sorting** by status, score range, price per volume and search.
- **Deal comparison** side by side.
- **Undo / redo** with keyboard shortcuts.
- **100% client‑side** — your data lives in your browser's `localStorage`. Nothing is sent
  to a server.

## Tech stack

React 19 · TypeScript · Vite · Zustand · Tailwind CSS · i18next

## Getting started

```bash
cd client
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
cd client
npm run build    # outputs static files to client/dist/
npm run preview  # preview the production build locally
```

## Deployment

This is a fully static site — the `client/dist/` folder can be served by any static web
server (nginx, Caddy, Netlify, GitHub Pages, …). No backend is required.

**Hosting on a sub‑path** (e.g. `https://example.com/vinted-tracker/`): set the matching
`base` in `client/vite.config.ts` before building:

```ts
export default defineConfig({
  base: '/vinted-tracker/',
  // ...
})
```

Then serve `client/dist/` from that path. Example nginx location:

```nginx
location /vinted-tracker/ {
    alias /path/to/vinted-tracker/client/dist/;
    try_files $uri $uri/ /vinted-tracker/index.html;
}
```

If you host at the domain root, set `base: '/'` (the default).

A helper script [`deploy.sh`](./deploy.sh) is included for a pull‑and‑build flow on a server.

## Project structure

```
client/    React app (Vite)
shared/    Types and scoring logic shared across the app
```

## License

[GPL‑3.0](./LICENSE)
