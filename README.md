# Axiom Mods

A static site for a small Minecraft mods hub, plus an admin panel. Plain HTML, CSS and
vanilla JS — no build step, made for GitHub Pages.

| File | What it is |
|---|---|
| `index.html` | The site. Includes a static copy of the downloads as a fallback. |
| `style.css`, `script.js` | Look and behaviour (starfield, tabs, reveal, progress bar). |
| `site-data.json` | **All the content**: mods, announcement, Discord link, theme. |
| `site-theme.js` | Applies the colour theme before first paint. |
| `admin.html` | Admin panel that edits `site-data.json` through the GitHub API. |
| `terms.html` | Terms & disclaimer. |

## Put it online
1. Create a GitHub repo and upload all the files to the root of the `main` branch.
2. **Settings → Pages →** deploy from branch `main`, folder `/ (root)`.
3. The site is at `https://<you>.github.io/<repo>/` and the admin at `…/admin.html`.

## Using the admin
1. Create a fine-grained token: GitHub → Settings → Developer settings → Fine-grained tokens.
   Limit it to **this one repo**, permission **Contents: Read and write**, nothing else.
2. Open `admin.html`, paste the token, check the repo name, enter your name, log in.
3. **Mods** tab: edit anything, add, remove, reorder (↑ ↓). Each mod only needs a **download link**
   (there is no file upload). **Updating** hides the download and shows “Updating — back soon”.
4. **Site** tab: announcement bar, Discord link, theme.
5. **Publish** commits `site-data.json`. The commit message lists what changed and ends with
   ` — by YOUR NAME`; the **Activity** tab reads those back. Changes are live in about a minute.

The token is kept in this browser only (localStorage if you tick “keep me signed in”, otherwise
sessionStorage). It is sent only to `api.github.com`. Anyone can open `admin.html`, but nothing
can be changed without a valid token.

## Notes
- The site fetches `site-data.json` with `cache: 'no-store'`. If that fails (for example when
  opened from `file://`), it keeps the static copy inside `index.html`. That copy is a snapshot;
  re-copy the rendered cards into `index.html` if you want it to match after big edits.
- Test links: the five download URLs shipped in `site-data.json` are test links. Replace them in
  the admin when the real file host is ready.
- Preview a theme with `?theme=mint` (emerald, mint, moss, jade).
- Download pages on free hosts show ads, so each card carries an adblocker reminder and the
  page has a prominent warning. Keep those if you change the copy.
