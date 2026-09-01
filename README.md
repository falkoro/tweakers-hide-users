# Tweakers Hide Users

Manifest V3 Edge/Chrome extension that hides Tweakers.net (Gathering of Tweakers) posts, quotes, Tracker rows, and notifications from people you choose.

There is no hardcoded block list. Hide is one click in the native Acties row. The list lives in your browser storage.

Current version: **1.3.3**

## What it does

- Adds **Hide** / **Unhide** next to a poster's name in the Acties row, styled like Tweakers' own action links
- Hides matching posts, quoted snippets, Tracker entries, and notification popup rows
- Lets you peek a hidden post, then hide it again
- Popup: add/remove names, paste a list, export/import JSON
- Runs at `document_start` so hidden posts do not flash during page load

It does **not** ban anyone on Tweakers. It only filters what you see locally.

## Load unpacked (Edge or Chrome)

1. Open `edge://extensions` or `chrome://extensions`
2. Turn on Developer mode
3. Load unpacked and pick this folder
4. Open a Tweakers thread and reload the tab (or click **Enable on this page** in the popup)

Stable unpacked ID (from the public `key` in `manifest.json`): `kdkfebaeaekpkbbmjhaichfiombonnkn`

To pick up file changes, click **Reload** on the extension card. Refreshing Tweakers alone is not enough.

## Chrome Web Store

This repo is the source for a store listing. A Cursor/Grok Bot agent can follow [docs/CHROME_WEB_STORE.md](docs/CHROME_WEB_STORE.md).

Pack a zip without the unpacked `key` field:

```powershell
powershell -File .\scripts\pack-cws.ps1
```

## Privacy

Hide names stay in `chrome.storage` on your profile. See [PRIVACY.md](PRIVACY.md).

## License

MIT. See [LICENSE](LICENSE).
