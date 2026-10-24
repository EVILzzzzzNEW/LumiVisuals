# LumiVisuals website — deploy (free, no card)

Backend: **Supabase** free tier (Auth + Postgres + 1 GB Storage, no credit card).
Hosting: **Vercel** (or Netlify / Cloudflare Pages) free `*.vercel.app` subdomain.
No host is literally "forever", but this combo stays free while active.

## 1. Supabase project (5 min)
1. https://supabase.com → New project (free plan, any region).
2. Authentication → Sign-in / Providers → enable **Email**.
3. Storage → New bucket → name `avatars`, set **Public**.
4. SQL Editor → paste + run `supabase-schema.sql` (creates `profiles`, `launcher_codes` + RLS).
5. Project Settings → API → copy `Project URL` + `anon public` key.

## 2. Wire config
Paste them into `website/supabase-config.js`. Until then the site runs in
local demo mode (accounts in `localStorage`, persist after refresh).

## 3. Deploy (Vercel, free subdomain)
```powershell
npm i -g vercel
cd LumiVisuals/website
vercel --prod
# you get https://lumivisuals.vercel.app — free HTTPS
```
Alternatives: drag this folder into Netlify Drop, or `npx wrangler pages deploy .`
for Cloudflare Pages. Point `lumivisuals.pro` at it later if you buy it.

## 4. Launcher hookup (Phase 2)
- Launcher opens `https://YOUR.vercel.app/?launcher=1`.
- User logs in → **Approve launcher login** → `LUMI-XXXXXX` code (row in
  `launcher_codes` + local copy). Launcher reads the code, fetches the profile,
  stores it at `%APPDATA%/LumiVisuals/launcher.json` (survives restarts), counts
  game hours into `profiles.hours`.

## Files
- `index.html / styles.css / app.js` — Liquid Glass UI, white/black accents.
  Versions: Minimal (menu Right Shift), Classic (menu 0). Never mention other clients.
- `../mods/` ships `LumiVisuals-Minimal-3.0.jar` + `LumiVisuals-Classic-3.2.0.jar`.
