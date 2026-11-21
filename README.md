# Tweakers Hide Users

Manifest V3 Edge/Chrome extension that hides Tweakers.net (Gathering of Tweakers) posts, quotes, Tracker rows, and notifications from people you choose.

There is no hardcoded block list. Hide is one click in the native Acties row. The list lives in your browser storage.

This extension is not affiliated with, endorsed by, or sponsored by Tweakers.net, Tweakers B.V., or Gathering of Tweakers. It is an independent third-party browser extension.

Current version: **1.4.1**

## What it does

- Adds **Hide** / **Unhide** next to a poster's name in the Acties row, styled like Tweakers' own action links
- Hides matching posts, quoted snippets, Tracker entries, and notification popup rows
- Leaves Direct Messages alone (the `/direct-messaging/` inbox and threads stay visible)
- Lets you peek a hidden post, then hide it again
- Popup: add/remove names, paste a list, export/import JSON
- Toolbar badge shows how many users you have hidden
- Runs at `document_start` so hidden posts do not flash during page load

It does **not** ban anyone on Tweakers. It only filters what you see locally.

## Load unpacked (Edge or Chrome)

1. Open `edge://extensions` or `chrome://extensions`
2. Turn on Developer mode
3. Load unpacked and pick this folder
4. Open a Tweakers thread and reload the tab (or click **Enable on this page** in the popup)

Stable unpacked ID (from the public `key` in `manifest.json`): `kdkfebaeaekpkbbmjhaichfiombonnkn`

To pick up file changes, click **Reload** on the extension card. Refreshing Tweakers alone is not enough.

## Chrome Web Store and Edge Add-ons

This repo is the source for store listing drafts. Do not submit, pay, or publish from a draft wave.

- Chrome Web Store: [docs/CHROME_WEB_STORE.md](docs/CHROME_WEB_STORE.md)
- Microsoft Edge Add-ons: [docs/EDGE_ADDONS.md](docs/EDGE_ADDONS.md)

Pack a zip without the unpacked `key` field (same zip for both stores):

```bash
bash scripts/pack-cws.sh
```

Windows:

```powershell
powershell -File .\scripts\pack-cws.ps1
```

That writes `dist/tweakers-hide-users.zip` and runs [scripts/check-package.ps1](scripts/check-package.ps1), which fails if `manifest.json` is not at the zip root or if the unpacked `key` field is still present.

## Privacy

Hide names stay in `chrome.storage` on your profile. See [PRIVACY.md](PRIVACY.md).

Contact and issues: [GitHub issues](https://github.com/falkoro/tweakers-hide-users/issues). Privacy policy: [PRIVACY.md](PRIVACY.md).

## License

MIT. See [LICENSE](LICENSE).
