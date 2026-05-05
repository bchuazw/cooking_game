# DEPLOY.md

Deployment is GitHub Pages, served from the `gh-pages` GitHub-Actions
artifact pipeline. `vite.config.ts` sets `base = '/cooking_game/'`; the
deploy workflow exports `VITE_BASE=/cooking_game/` to make this explicit.

## One-time setup (operator)

1. On GitHub: `Settings → Pages → Build and deployment → Source = "GitHub Actions"`.
2. The workflow at `.github/workflows/deploy.yml` runs on every push to
   `main` and the active feature branch and publishes to Pages.
3. Once enabled, the public URL is `https://bchuazw.github.io/cooking_game/`.

## Local dev

```bash
npm install
npm run dev    # http://localhost:5173, base="/" works in dev
npm run build  # outputs dist/, base="/cooking_game/" by default
npm run preview
```

## Custom-domain or alternate-target migration

To migrate to a custom subdomain, set:

```
VITE_BASE=/   # if served at the apex
```

…and add a `CNAME` file at `public/CNAME`. To migrate to Cloudflare Pages /
Netlify, point at the `dist` directory; no other config changes required.
