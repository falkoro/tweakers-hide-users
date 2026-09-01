const STORAGE_KEY = "bannedUsers";
const IDS_KEY = "bannedUserIds";
const MAP_KEY = "bannedIdByName";
const SEED_FLAG = "thuSeededGjcvro";
const UNSEED_FLAG = "thuUnseededGjcvro";
const listEl = document.getElementById("user-list");
const emptyEl = document.getElementById("empty");
const inputEl = document.getElementById("new-user");
const addBtn = document.getElementById("add-user");
const configEl = document.getElementById("config");
const saveBtn = document.getElementById("save-config");
const exportBtn = document.getElementById("export-json");
const importEl = document.getElementById("import-json");

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

function injectCurrentTab() {
  const status = document.getElementById("page-status");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) {
      status.textContent = "No active tab.";
      return;
    }
    if (!/tweakers\.net/i.test(tab.url || "")) {
      status.textContent = "Open gathering.tweakers.net, then click Enable on this page.";
      return;
    }
    chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["content.css"] }).catch(() => {});
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] }, () => {
      if (chrome.runtime.lastError) {
        status.textContent = "Could not enable on this page. Reload the Tweakers tab and try again.";
        return;
      }
      status.textContent = "Enabled on this page. Hide is in each post's Acties row.";
    });
  });
}

document.getElementById("enable-page").addEventListener("click", injectCurrentTab);
injectCurrentTab();

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
  listEl.replaceChildren();
  emptyEl.hidden = users.length > 0;
  users.forEach((name) => {
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
  configEl.value = users.join("\n");
}

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
