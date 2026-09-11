# Microsoft Edge Add-ons listing draft

Draft **Tweakers Hide Users** for Microsoft Edge Add-ons (Partner Center). Do **not** register a paid account on the user's behalf, do **not** submit, and do **not** publish. Hide/content/background/popup behavior is unchanged.

Use the **same zip** as Chrome Web Store: `dist/tweakers-hide-users.zip` from `scripts/pack-cws.ps1`.

## Partner Center notes

- Dashboard: https://partner.microsoft.com/dashboard/microsoftedge
- Registration: [Register as a Microsoft Edge extension developer](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/create-dev-account)
- **There is no registration fee** for the Microsoft Edge program (unlike the Chrome Web Store $5 one-time fee)
- Sign-in requires a Microsoft account (MSA: Outlook/Live/Hotmail). Work/school accounts are not used as the Primary Owner
- Account type: Individual is enough for this extension
- Visibility default: Public (do not change visibility; do not submit)
- Markets: leave default (all markets) unless the publisher says otherwise
- Language: English (en-US) listing. Product works on a Dutch site
- Website: https://cursor.com/codebase/spot-cloud/tweakers-hide-users
- Support contact: https://cursor.com/codebase/spot-cloud/tweakers-hide-users
- Mature content: no

This wave stops after packing the zip and writing this draft. A human submits later.

## Package

From the repo root:

```powershell
powershell -File .\scripts\pack-cws.ps1
```

Output: `dist/tweakers-hide-users.zip`.

- Zip root must contain `manifest.json` (no wrapping folder)
- Unpacked `key` field must be stripped (`scripts/check-package.ps1` fails the pack if it is still present)
- Partner Center reads **name** and **short description** from the uploaded manifest; those fields are read-only on the store listing page
- Manifest `description` is the Edge **short description**
- Do not upload `.pem` private keys

## Listing copy (English)

**Name:** Tweakers Hide Users

**Summary / short description (from manifest):** Hide posts, quotes, tracker rows, and notifications from specific Tweakers users. Click Hide next to a name, or manage the list in the popup.

**Category:** Social. If Social is unavailable, Productivity.

**Description (EN, 250–10,000 characters):**

```
Tweakers Hide Users hides posts and related UI from Tweakers.net users you pick. It does not report, mute, or ban anyone on the site. Filtering is local to your browser.

How to use
• Open a Gathering of Tweakers thread.
• In the Acties row under a post, click Hide. That user is added to your list.
• Hidden posts collapse to a short bar. Click Show to peek, Hide again to collapse.
• Quotes, Tracker rows, and notification popup rows from hidden users are also removed.
• Manage the list from the toolbar popup: add a name, paste one name per line, or export/import JSON.

Notes
• This extension is not affiliated with, endorsed by, or sponsored by Tweakers.net, Tweakers B.V., or Gathering of Tweakers. Independent third-party browser extension.
• There is no built-in block list. Nobody is hidden until you hide them.
• The list is stored in your browser (chrome.storage). It is not sent to the developer.
• After you update the unpacked/dev copy, click Reload on the extension card. Refreshing Tweakers is not enough.
• This is a Manifest V3 extension. The same package is used for Chrome Web Store and Microsoft Edge Add-ons.
```

**Search terms (optional, max 7 terms / 21 words):** Tweakers, hide users, Gathering of Tweakers, GoT, forum filter, mute posters, Tweakers.net

**Extension logo:** `images/icon-128.png` (1:1; 128×128 meets the minimum; 300×300 preferred if you upscale later). Do not block a later submit on a 48px icon.

**Screenshots (optional for draft, required for a strong listing):** 640×480 or 1280×800 PNG. Capture a Tweakers thread with Hide in the Acties row, plus the popup hide list. From https://gathering.tweakers.net (cookie wall may appear). Do not include other people's private data beyond public forum posts.

## Privacy (Partner Center Privacy page)

Must match [PRIVACY.md](../PRIVACY.md) and `manifest.json`.

**Single purpose:** Hide posts, quotes, Tracker items, and notifications from Tweakers.net users the extension user adds to a local hide list.

**Are you using remote code?** No.

**Data usage:** The only stored data is the hide list the user creates (Tweakers usernames and optional gallery/owner IDs) in `chrome.storage` on the device / browser sync. It is not sent to developer servers. Do not certify collection of browsing history, location, or financial data. Do not sell data or use it for ads.

**Privacy policy URL:** https://cursor.com/codebase/spot-cloud/tweakers-hide-users

`PRIVACY.md` is at the repository root on that page. Origin has **no public unauthenticated raw HTTPS URL** for that file. Edge Add-ons reviewers may reject a URL that requires a Cursor login. Use the Origin codebase URL anyway. If Partner Center rejects it, host the same `PRIVACY.md` text on a public HTTPS page the publisher controls. Do not point stores at GitHub.

Developer policies ask the privacy policy to refer primarily to Microsoft Edge. `PRIVACY.md` already covers Chrome and Edge (`chrome.storage` is the same API in both). If review insists on Edge-only wording, keep the facts identical and mention Microsoft Edge first.

### Permission justifications

- `storage` — persist the user-created hide list
- `scripting` — inject the hide UI and CSS on Tweakers tabs, including Enable on this page
- `activeTab` — act on the current Tweakers tab from the popup
- `tabs` — find open Tweakers tabs so a list change applies without a full reinstall
- host `https://tweakers.net/*` and `https://*.tweakers.net/*` — read public post author markup and hide matching nodes. No other sites.

## Notes for certification (do not submit)

If a human later submits, testers can use:

1. Install the uploaded build in Microsoft Edge.
2. Open https://gathering.tweakers.net/forum/list_message/86038100#86038100 or any public GoT thread.
3. Confirm a Hide control in the Acties row (text link, not a red chip).
4. Click Hide on any account you control or a throwaway; the post collapses and quotes/tracker/notifications for that name disappear.
5. Unhide from the bar or popup; content returns.
6. Confirm no network calls except Tweakers itself and Edge sync.

There is no built-in block list and no test account is required.

## Do not

- Submit, pay, or publish this item
- Restart the user's Edge while they may have a meeting
- Add default hidden users
- Broaden host permissions
- Check in Partner Center credentials, API tokens, or a `.pem` signing key
- Promise a review outcome or a date
- Add github.com URLs
