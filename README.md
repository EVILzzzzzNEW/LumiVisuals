# LumiVisuals site — push to GitHub + turn on free `*.github.io` hosting

This folder is ready to push as-is. `index.html` is at the root, logo in `public/`.

## Push
```powershell
cd lumivisuals-github
git init
git add .
git commit -m "LumiVisuals site"
git branch -M main
git remote add origin https://github.com/YOU/lumivisuals.git
git push -u origin main
```

## Turn on free hosting
1. GitHub repo → **Settings → Pages**.
2. Source: **Deploy from a branch**, Branch: `main`, folder: `/ (root)`. Save.
3. You get `https://YOU.github.io/lumivisuals/` — free, no card.

Supabase stays as-is (keys already in `supabase-config.js`). If the logo ever
404s, keep the `public/logo.png` path — `index.html` already points there.
