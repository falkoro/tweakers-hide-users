const URLS = ["https://tweakers.net/*", "https://*.tweakers.net/*"];

function isTweakers(url) {
  return typeof url === "string" && /https:\/\/([^.]+\.)?tweakers\.net\//i.test(url);
}

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

chrome.runtime.onInstalled.addListener(injectOpenTabs);
chrome.runtime.onStartup.addListener(injectOpenTabs);

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
