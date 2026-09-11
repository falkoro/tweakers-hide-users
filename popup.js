const STORAGE_KEY = "bannedUsers";
const IDS_KEY = "bannedUserIds";
const MAP_KEY = "bannedIdByName";
const SEED_FLAG = "thuSeededGjcvro";
const UNSEED_FLAG = "thuUnseededGjcvro";
const listEl = document.getElementById("user-list");
const emptyEl = document.getElementById("empty");
const inputEl = document.getElementById("new-user");
const addBtn = document.getElementById("add-user");
const filterEl = document.getElementById("filter");
const configEl = document.getElementById("config");
const saveBtn = document.getElementById("save-config");
const exportBtn = document.getElementById("export-json");
const importEl = document.getElementById("import-json");
const statusEl = document.getElementById("page-status");
const enableBtn = document.getElementById("enable-page");
const pageCountEl = document.getElementById("page-count");

let cachedUsers = [];

function norm(name) {
  return String(name || "").replace(/\s+/g, " ").trim();
}

function parseList(text) {
  return Array.from(
    new Set(
      String(text || "")
        .split(/[\n,;]+/)
        .map(norm)
        .filter(Boolean)
    )
  );
}

function notifyTabs() {
  chrome.tabs.query({ url: ["https://tweakers.net/*", "https://*.tweakers.net/*"] }, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] }).catch(() => {});
        chrome.tabs.sendMessage(tab.id, { action: "update-settings" }).catch(() => {});
      }
    }
  });
}

function setStatus(text, showEnable) {
  statusEl.textContent = text;
  enableBtn.hidden = !showEnable;
}

function showPageCount(n) {
  if (!n) {
    pageCountEl.hidden = true;
    pageCountEl.textContent = "";
    return;
  }
  pageCountEl.hidden = false;
  pageCountEl.textContent = n + (n === 1 ? " post hidden on this page" : " posts hidden on this page");
}

function probeCurrentTab(autoInject) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) {
      setStatus("No active tab.", false);
      showPageCount(0);
      return;
    }
    if (!/tweakers\.net/i.test(tab.url || "")) {
      setStatus("Open a Tweakers page to hide users.", false);
      showPageCount(0);
      return;
    }
    chrome.tabs.sendMessage(tab.id, { action: "get-stats" }, (res) => {
      if (chrome.runtime.lastError || !res || !res.ready) {
        if (autoInject) {
          injectCurrentTab();
          return;
        }
        setStatus("Not active on this tab yet.", true);
        showPageCount(0);
        return;
      }
      setStatus("Active on this page", false);
      showPageCount(res.hiddenPosts || 0);
    });
  });
}

function injectCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) {
      setStatus("No active tab.", false);
      return;
    }
    if (!/tweakers\.net/i.test(tab.url || "")) {
      setStatus("Open gathering.tweakers.net, then click Enable on this page.", false);
      return;
    }
    chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["content.css"] }).catch(() => {});
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] }, () => {
      if (chrome.runtime.lastError) {
        setStatus("Could not enable. Reload the Tweakers tab and try again.", true);
        return;
      }
      setTimeout(() => probeCurrentTab(false), 150);
    });
  });
}

enableBtn.addEventListener("click", injectCurrentTab);
probeCurrentTab(true);

function saveUsers(users) {
  const next = parseList(users.join("\n"));
  chrome.storage.sync.set({ [STORAGE_KEY]: next }, () => {
    chrome.storage.local.set({ [STORAGE_KEY]: next }, () => {
      render(next);
      notifyTabs();
    });
  });
}

function loadUsers(cb) {
  chrome.storage.sync.get([STORAGE_KEY, IDS_KEY, MAP_KEY, SEED_FLAG, UNSEED_FLAG], (syncData) => {
    const finish = (data) => {
      let users = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY].map(norm).filter(Boolean) : [];
      if (!data[UNSEED_FLAG]) {
        users = users.filter((u) => u.toLowerCase() !== "gjcvro");
        const ids = (Array.isArray(data[IDS_KEY]) ? data[IDS_KEY] : []).map(String).filter((id) => id !== "1047387");
        const map = data[MAP_KEY] && typeof data[MAP_KEY] === "object" ? { ...data[MAP_KEY] } : {};
        delete map.gjcvro;
        chrome.storage.sync.set({
          [STORAGE_KEY]: users,
          [IDS_KEY]: ids,
          [MAP_KEY]: map,
          [SEED_FLAG]: true,
          [UNSEED_FLAG]: true,
        });
        chrome.storage.local.set({
          [STORAGE_KEY]: users,
          [IDS_KEY]: ids,
          [MAP_KEY]: map,
          [SEED_FLAG]: true,
          [UNSEED_FLAG]: true,
        });
        notifyTabs();
      }
      cb(users);
    };
    if (Array.isArray(syncData[STORAGE_KEY]) || syncData[SEED_FLAG] || syncData[UNSEED_FLAG]) {
      finish(syncData);
      return;
    }
    chrome.storage.local.get([STORAGE_KEY, IDS_KEY, MAP_KEY, SEED_FLAG, UNSEED_FLAG], (localData) => {
      finish(localData || {});
    });
  });
}

function render(users) {
  cachedUsers = users;
  const q = norm(filterEl.value).toLowerCase();
  const shown = q ? users.filter((u) => u.toLowerCase().includes(q)) : users;
  listEl.replaceChildren();
  emptyEl.hidden = users.length > 0;
  filterEl.hidden = users.length < 8;
  users.forEach((name) => {
    if (q && !name.toLowerCase().includes(q)) return;
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = name;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Remove";
    btn.addEventListener("click", () => {
      saveUsers(users.filter((u) => u.toLowerCase() !== name.toLowerCase()));
    });
    li.append(span, btn);
    listEl.appendChild(li);
  });
  if (users.length && !shown.length) {
    const li = document.createElement("li");
    li.textContent = "No matches.";
    listEl.appendChild(li);
  }
  configEl.value = users.join("\n");
}

filterEl.addEventListener("input", () => render(cachedUsers));

function addFromInput() {
  const name = norm(inputEl.value);
  if (!name) return;
  loadUsers((users) => {
    if (!users.some((u) => u.toLowerCase() === name.toLowerCase())) users.push(name);
    inputEl.value = "";
    saveUsers(users);
  });
}

addBtn.addEventListener("click", addFromInput);
inputEl.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") {
    ev.preventDefault();
    addFromInput();
  }
});

saveBtn.addEventListener("click", () => {
  saveUsers(parseList(configEl.value));
});

exportBtn.addEventListener("click", () => {
  loadUsers((users) => {
    const blob = new Blob([JSON.stringify({ bannedUsers: users }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tweakers-hidden-users.json";
    a.click();
    URL.revokeObjectURL(url);
  });
});

importEl.addEventListener("change", () => {
  const file = importEl.files && importEl.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      let users;
      try {
        const parsed = JSON.parse(text);
        users = Array.isArray(parsed) ? parsed : parsed.bannedUsers || parsed.users || [];
      } catch {
        users = parseList(text);
      }
      saveUsers(users);
    } catch (err) {
      console.error(err);
    }
    importEl.value = "";
  };
  reader.readAsText(file);
});

loadUsers(render);
