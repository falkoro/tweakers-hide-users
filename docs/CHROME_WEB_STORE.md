# Chrome Web Store publish brief

This file is the handoff for Grok Bot / a Cursor cloud agent. Publish **Tweakers Hide Users** from this repo. Do not rewrite the hide logic unless review requires a store-policy fix.

## Why GitHub, not Cursor Origin

As of 2026-08-29, Cursor staff (deanrie, forum thread 169684) said Grok Bot cannot access Cursor Origin repos yet. Cloud agents need the repo on GitHub, connected at cursor.com > Dashboard > Integrations > GitHub. Origin hosting is optional and not required for this publish.

## What this extension is

- Name: Tweakers Hide Users
- Manifest V3, version in `manifest.json` (currently 1.4.1)
- Single purpose: let the user hide Tweakers.net users in their own browser
- Sites: `https://tweakers.net/*` and `https://*.tweakers.net/*` only
- No hardcoded usernames. Do **not** seed MartijnA3, gjcvro, Bobmeister, or anyone else
- Hide list keys: `bannedUsers`, `bannedUserIds`, `bannedIdByName` in `chrome.storage.sync` / `local`
- Unpacked public `key` in `manifest.json` keeps the local Edge ID stable. **Strip `key` from the store zip** (CWS assigns its own item ID)

## Account requirements (human must already have these)

The agent cannot invent a Google login. Stop and ask if any of these are missing:

1. Chrome Web Store developer account at https://chrome.google.com/webstore/devconsole
2. One-time $5 registration paid
3. 2-Step Verification on that Google account (required to publish)
4. Publisher still has a free extension slot (default cap is **two** published extensions as of 2026-08-20)
5. A way to sign in (browser session, or CWS API refresh token the user provides). Never print secrets.

First-time item **create** is dashboard upload or Chrome Web Store API **v1** `Items.insert`. API v2 cannot create a new item.

## Package

From the repo root:

```bash
bash scripts/pack-cws.sh
```

The zip root must contain `manifest.json` (no wrapping folder). Include `background.js`, `boot.js`, `thu-core.js`, `content.js`, `content.css`, `popup.html`, `popup.js`, `popup.css`, `images/icon-16.png`, `images/icon-48.png`, `images/icon-128.png`. Exclude `.git`, docs, scripts, LICENSE if you want a smaller zip; including README/PRIVACY in the zip is fine but not required.

Do not upload `.pem` private keys. This repo should not contain one.

## Store listing copy

**Name:** Tweakers Hide Users

**Summary (132 chars max):** Hide Tweakers.net posts, quotes, Tracker rows, and notifications from users you choose. One-click Hide in the Acties row.

**Category:** Social / Communication, or Productivity if Social is unavailable.

**Language:** English (listing). Product works on a Dutch site.

**Description:**

```
Tweakers Hide Users hides posts and related UI from Tweakers.net users you pick. It does not report, mute, or ban anyone on the site. Filtering is local to your browser.

How to use
• Open a Gathering of Tweakers thread.
• In the Acties row under a post, click Hide. That user is added to your list.
• Hidden posts collapse to a short bar. Click Show to peek, Hide again to collapse.
• Quotes, Tracker rows, and notification popup rows from hidden users are also removed.
• Manage the list from the toolbar popup: add a name, paste one name per line, or export/import JSON.

Notes
• There is no built-in block list. Nobody is hidden until you hide them.
• The list is stored in your browser (chrome.storage). It is not sent to the developer.
• After you update the unpacked/dev copy, click Reload on the extension card. Refreshing Tweakers is not enough.
```

**Single purpose (Privacy tab):** Hide posts, quotes, Tracker items, and notifications from Tweakers.net users the extension user adds to a local hide list.

## Privacy practices (must match PRIVACY.md and the manifest)

Remote code: no.
User data sold / used for ads: no.
Data collection: only the hide list the user creates (usernames and optional Tweakers gallery/owner IDs), stored in `chrome.storage` on the device / browser sync. Not transmitted to developer servers.

Permission justifications:

- `storage` — persist the user-created hide list
- `scripting` — inject the hide UI and CSS on Tweakers tabs, including Enable on this page
- `activeTab` — act on the current Tweakers tab from the popup
- `tabs` — find open Tweakers tabs so a list change applies without a full reinstall
- host `tweakers.net` / `*.tweakers.net` — read public post author markup and hide matching nodes. No other sites.

Privacy policy URL: use the GitHub file URL for `PRIVACY.md` on `main` (HTTPS). Example after this repo exists:

`https://github.com/falkoro/tweakers-hide-users/blob/main/PRIVACY.md`

If CWS rejects a blob URL, put the same text on a GitHub Pages URL or another HTTPS page the user controls.

## Assets

- Icons: `images/icon-128.png` (store), `images/icon-48.png`, `images/icon-16.png` (toolbar).
- Screenshots: use the 1280x800 PNGs in `docs/store/` (page only, no extra browser tabs). Replace store media with those files. Capture from https://gathering.tweakers.net if you reshoot. Do not include other people's private data beyond public forum posts. Do not photograph a Chrome window with a pile of unrelated tabs.
- Small promo tile optional.

## Review test notes

1. Install the uploaded build.
2. Open https://gathering.tweakers.net/forum/list_message/86038100#86038100 or any public GoT thread.
3. Confirm a Hide control in the Acties row (text link, not a red chip).
4. Click Hide on any account you control or a throwaway; the post collapses and quotes/tracker/notifications for that name disappear.
5. Unhide from the bar or popup; content returns.
6. Confirm no network calls except Tweakers itself and Chrome/Edge sync.

## Do not

- Restart the user's Edge while they may have a meeting
- Add default hidden users
- Broaden host permissions
- Check in Google credentials, CWS API tokens, or a `.pem` signing key
- Promise a review outcome or a date

## If credentials are missing

Create the zip, keep listing copy in this file, and tell the user the exact dashboard URL and which fields are filled vs blocked. Do not pretend the item is live.
