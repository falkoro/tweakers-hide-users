const URLS = ["https://tweakers.net/*", "https://*.tweakers.net/*"];
const STORAGE_KEY = "bannedUsers";

function isTweakers(url) {
  return typeof url === "string" && /https:\/\/([^.]+\.)?tweakers\.net\//i.test(url);
}

function updateBadge() {
  chrome.storage.sync.get(STORAGE_KEY, (data) => {
    const apply = (users) => {
      const n = Array.isArray(users) ? users.length : 0;
      chrome.action.setBadgeText({ text: n ? String(n) : "" });
      chrome.action.setBadgeBackgroundColor({ color: "#8f1635" });
    };
    if (Array.isArray(data[STORAGE_KEY])) {
      apply(data[STORAGE_KEY]);
      return;
    }
    chrome.storage.local.get(STORAGE_KEY, (localData) => apply(localData[STORAGE_KEY]));
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if ((area === "sync" || area === "local") && changes[STORAGE_KEY]) updateBadge();
});

async function inject(tabId) {
  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["content.css"] });
  } catch (_) {}
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
  } catch (_) {}
}

function injectTab(tab) {
  if (tab && tab.id && isTweakers(tab.url)) inject(tab.id);
}

function injectOpenTabs() {
  chrome.tabs.query({ url: URLS }, (tabs) => {
    (tabs || []).forEach(injectTab);
  });
}

chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
  injectOpenTabs();
});
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
  injectOpenTabs();
});
updateBadge();

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === "complete" || info.url) injectTab(tab);
});

chrome.tabs.onActivated.addListener(async (active) => {
  try {
    const tab = await chrome.tabs.get(active.tabId);
    injectTab(tab);
  } catch (_) {}
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === "inject-tab") {
    const id = msg.tabId || (sender.tab && sender.tab.id);
    if (id) {
      inject(id).then(() => sendResponse({ ok: true })).catch((err) => sendResponse({ ok: false, err: String(err) }));
      return true;
    }
    sendResponse({ ok: false });
  }
  return false;
});
