# Axiom Mods

A short list of tested Fabric mods for Minecraft 1.21.11.

## Putting it online (GitHub Pages)

1. Make a new GitHub repository (for example `axiom-mods`). Public is fine.
2. Upload **all** of these files to the root of the repo, together:
   `index.html`, `style.css`, `script.js`, `admin.html`, `terms.html`,
   `site-data.json`, `favicon.svg`, `unlock.html`, `README.md`
3. Go to the repo's **Settings → Pages**. Under "Build and deployment" pick
   **Deploy from a branch**, branch **main**, folder **/ (root)**, and press Save.
4. After a minute your site is live at `https://YOUR-NAME.github.io/axiom-mods/`.

Always upload `index.html`, `style.css` and `script.js` as a set. If one is newer
than the others the page can look broken.

## The admin panel

Open `https://YOUR-NAME.github.io/axiom-mods/admin.html`.

**First time:** you need a GitHub token.

1. Go to https://github.com/settings/personal-access-tokens/new
2. Name it **Axiom admin**, pick an expiry.
3. Repository access: **Only select repositories** → pick your site's repo.
4. Permissions → Repository → **Contents: Read and write**.
5. Press **Generate token** and copy it.

On the admin sign-in page, type your GitHub name, the repo name, paste the token,
and put your name in "Your name for the activity log".

### Changing a download link

1. Open **Mods** and click the mod.
2. Paste the new link into **Download link**.
3. Press **Test link** — it should start downloading the file.
4. Press **Publish** at the bottom. The site updates in about a minute.

### Everything else you can do

- **Updating** switch — hides a mod's download and shows "Updating — back soon".
- **Open source** switch — adds the open-source line to the card.
- **New** switch — puts the mod in the "Just added" tab.
- **Featured** switch — gives the mod the big card at the top.
- **Category** — decides which tab the mod sits under. Pick "New category…" to make one;
  the tab appears automatically.
- Add, remove and reorder mods; change icons and colours.
- **Announcement** — the bar at the top of the site, with a live preview.
- **Needs another mod** — e.g. set Glazed to need Meteor Client. When someone downloads
  Glazed, the site offers them the Meteor Client download too.
- **Last updated** — shows "Updated 3 days ago" on the card. It's set to today
  automatically whenever you change a mod's download link.
- **Links** — the Discord invite used by every button, plus the **member / online
  numbers**. Press **Get from Discord** to fill them in, then Publish. The site
  always shows these saved numbers and swaps in live ones when Discord answers.
- **Support** — your staff list. Flip someone **Online** and the site shows them under
  the Discord box as "staff online that can help". Also holds the **ticket webhook**
  (the Discord channel tickets arrive in), a switch to turn website tickets off, and a
  **Send test ticket** button.
- **Links** also has your **YouTube channel** (the red button appears once it's set) and
  the **suggested launcher** link (Modrinth App's download page).
- **Activity** — every change, who made it, and when.

Nothing changes on the live site until you press **Publish**.

## Subscribe to unlock

In **Mods**, open a mod and switch on **Subscribe to unlock**. Its Download button turns
into a red **Subscribe to unlock** button that goes to `unlock.html`. There, the visitor
opens your YouTube channel, a 20 second "checking" countdown runs, then the download
appears. It's remembered on their browser, so they only do it once per mod.

It uses your channel from **Links → YouTube channel**, or a different one you type on
that mod. The countdown is a timer — it can't really see who subscribed.

## Tickets

The "Make a ticket" form asks for the visitor's Discord username, what it's about, which
mod, the issue, and an optional screenshot (they can paste it with Ctrl+V). It lands in
your Discord channel with the username to add. Each visitor can send 1 ticket every 10
minutes and 3 a day, and @everyone pings are blocked.

The webhook link is visible in the site's code, so a determined person could still spam
it. If that happens: in Discord delete the webhook, make a new one, paste it in
**Support** and Publish. The old link stops working straight away.

## Terms pop-up

The first time someone visits, they have to tick "I agree" before they can download.
It's remembered on their browser after that.

## Testing it on your computer

You can double-click `index.html` to look at it before uploading — everything,
including the Discord numbers, shows up. The admin panel only works once the site
is on GitHub.

## Sharing one mod

Every card has a share button. It copies a link like
`https://YOUR-NAME.github.io/axiom-mods/#mod/meteor-client` that jumps straight to
that mod and makes it glow.

## About the download links

The five mods ship with **test links** (Dropbox) so the site works straight away.
Swap them for your real file host's links in the admin panel when you're ready.

## Files

| File | What it is |
|---|---|
| `index.html` | The site. Also holds a built-in copy of the mods, used if `site-data.json` can't load. |
| `style.css` | All styling, for the site and the admin panel. |
| `script.js` | The starfield, download tabs, cards, FAQ and everything else that moves. |
| `admin.html` | The admin panel. |
| `site-data.json` | Mods, categories, announcement and links. Edited by the admin panel. |
| `unlock.html` | The subscribe-to-unlock page. |
| `terms.html` | Terms of service — bans and anything that happens to your PC aren't on us. |
| `favicon.svg` | The diamond logo. |

Made by k35c.
