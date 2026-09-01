# Privacy policy — Tweakers Hide Users

Last updated: 2026-09-01

Tweakers Hide Users is a browser extension that hides posts, quotes, Tracker rows, and notifications from Tweakers.net users you choose.

## What the extension stores

The extension stores only the hide list you create:

- Tweakers usernames you hide
- matching Tweakers gallery / owner IDs when those can be read from the page

This list is stored in your browser with `chrome.storage.sync` (and a local copy with `chrome.storage.local`). If Chrome/Edge sync is on, the list can follow your browser profile. It is not sent to the extension author.

## What the extension does not collect

The extension does not:

- create an account
- send usernames, posts, cookies, or browsing history to a server
- use analytics, ads, or third-party trackers
- sell or share user data

## What it reads on Tweakers.net

On `tweakers.net` pages it reads public page markup (post author names, gallery links, quote attribution, Tracker/notification text) so it can hide matching items in your browser. That processing stays on your device.

## Permissions

- `storage` — save and load your hide list
- `scripting`, `activeTab`, `tabs` — attach Hide/Unhide to Tweakers pages and apply the list after you change it
- host access to `https://tweakers.net/*` and `https://*.tweakers.net/*` — the only sites the extension runs on

## How to delete your data

Remove a name with Unhide, clear the list in the popup, or uninstall the extension. Uninstalling removes the stored list from that browser profile.

## Contact

Open an issue on the GitHub repository that hosts this extension.
