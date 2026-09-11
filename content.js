if (window.__thuInit) {
  document.dispatchEvent(new CustomEvent("thu-apply"));
} else {
window.__thuInit = true;
(() => {
  try {
    document.documentElement.classList.add("thu-on");
  } catch (_) {}

  const STORAGE_KEY = "bannedUsers";
  const IDS_KEY = "bannedUserIds";
  const MAP_KEY = "bannedIdByName";
  const SEED_FLAG = "thuSeededGjcvro";
  const UNSEED_FLAG = "thuUnseededGjcvro";

  let banned = [];
  let bannedIds = [];
  let idByName = {};
  let applying = false;

  const forumPostSelector = "div.message[data-owner-id], div.message[data-message-id], table.message";
  const commentSelector = ".reactieBody, article.reactie, div.reactie";

  function norm(name) {
    return String(name || "").replace(/\s+/g, " ").trim();
  }

  function keyName(name) {
    return norm(name).toLowerCase();
  }

  function galleryIdFromHref(href) {
    const m = String(href || "").match(/\/gallery\/(\d+)/i);
    return m ? m[1] : "";
  }

  function isBannedName(name) {
    const n = keyName(name);
    return !!n && banned.some((u) => keyName(u) === n);
  }

  function isBannedId(id) {
    const n = String(id || "").trim();
    return !!n && bannedIds.includes(n);
  }

  function isBannedEl(el) {
    if (!el) return false;
    if (isBannedName(firstLine(el.textContent))) return true;
    const href = el.getAttribute("href") || el.href || "";
    const id = galleryIdFromHref(href);
    if (isBannedId(id)) return true;
    const aria = el.getAttribute("aria-label") || "";
    if (isBannedName(aria)) return true;
    return false;
  }

  function firstLine(text) {
    return norm(String(text || "").split(/\r?\n/)[0]);
  }

  function isQuoteEl(el) {
    return !!(el && el.closest("blockquote, .quote, .messagecontent, .reactieContent, .thu-bar"));
  }

  function posterRoot(post) {
    return (
      post.querySelector(":scope > .poster") ||
      post.querySelector(".poster") ||
      post.querySelector(".userheader") ||
      post.querySelector(".reactionMeta") ||
      post.querySelector(".reactieHeader") ||
      post
    );
  }

  function usernameFromPost(post) {
    const root = posterRoot(post);
    const candidates = [
      root.querySelector("p.username a.user"),
      root.querySelector("p.username a"),
      root.querySelector("a.user"),
      root.querySelector("span.user"),
      root.querySelector("a.username"),
      root.querySelector("a[href*='/gallery/']"),
    ];
    for (const el of candidates) {
      if (!el || isQuoteEl(el)) continue;
      const text = firstLine(el.textContent);
      if (text && text.length < 80) return text;
    }
    return "";
  }

  function usernameAnchor(post) {
    const root = posterRoot(post);
    const candidates = [
      root.querySelector("p.username a.user"),
      root.querySelector("p.username a"),
      root.querySelector("a.user"),
      root.querySelector("a[href*='/gallery/']"),
    ];
    for (const el of candidates) {
      if (el && !isQuoteEl(el)) return el;
    }
    return null;
  }

  function ownerIdFromPost(post, username) {
    const attr = post.getAttribute("data-owner-id");
    if (attr) return String(attr);
    const anchor = usernameAnchor(post);
    const fromHref = galleryIdFromHref(anchor && (anchor.getAttribute("href") || anchor.href));
    if (fromHref) return fromHref;
    const mapped = idByName[keyName(username)];
    return mapped || "";
  }

  function persist() {
    chrome.storage.sync.set({
      [STORAGE_KEY]: banned,
      [IDS_KEY]: bannedIds,
      [MAP_KEY]: idByName,
    });
    chrome.storage.local.set({
      [STORAGE_KEY]: banned,
      [IDS_KEY]: bannedIds,
      [MAP_KEY]: idByName,
    });
  }

  function setState(names, ids, map) {
    banned = Array.from(new Set((names || []).map(norm).filter(Boolean)));
    idByName = map && typeof map === "object" ? { ...map } : {};
    const fromMap = Object.values(idByName).map(String).filter(Boolean);
    bannedIds = Array.from(new Set([...(ids || []).map(String).filter(Boolean), ...fromMap]));
  }

  function pruneIdsToNames() {
    const keep = {};
    banned.forEach((name) => {
      const k = keyName(name);
      if (idByName[k]) keep[k] = String(idByName[k]);
    });
    idByName = keep;
    bannedIds = Array.from(new Set(Object.values(idByName)));
  }

  function loadBanned() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEY, IDS_KEY, MAP_KEY, SEED_FLAG, UNSEED_FLAG], (syncData) => {
        const apply = (data) => {
          const names = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
          const ids = Array.isArray(data[IDS_KEY]) ? data[IDS_KEY] : [];
          const map = data[MAP_KEY] && typeof data[MAP_KEY] === "object" ? data[MAP_KEY] : {};
          setState(names, ids, map);
          pruneIdsToNames();
          updateDynamicCss();
          if (!data[UNSEED_FLAG]) {
            banned = banned.filter((u) => keyName(u) !== "gjcvro");
            delete idByName.gjcvro;
            pruneIdsToNames();
            chrome.storage.sync.set({ [UNSEED_FLAG]: true, [SEED_FLAG]: true });
            chrome.storage.local.set({ [UNSEED_FLAG]: true, [SEED_FLAG]: true });
            persist();
          }
          resolve(banned);
        };

        if (Array.isArray(syncData[STORAGE_KEY]) || syncData[SEED_FLAG]) {
          apply(syncData);
          return;
        }
        chrome.storage.local.get([STORAGE_KEY, IDS_KEY, MAP_KEY, SEED_FLAG, UNSEED_FLAG], (localData) => {
          apply(localData || {});
        });
      });
    });
  }

  function addUser(name, id) {
    const n = norm(name);
    if (!n) return;
    if (!isBannedName(n)) banned = [...banned, n];
    if (id) {
      idByName[keyName(n)] = String(id);
      if (!isBannedId(id)) bannedIds = [...bannedIds, String(id)];
    }
    persist();
    applyAll();
  }

  function removeUser(name) {
    const n = keyName(name);
    banned = banned.filter((u) => keyName(u) !== n);
    delete idByName[n];
    pruneIdsToNames();
    persist();
    applyAll();
  }

  function ensureBar(post, username) {
    let bar = post.querySelector(":scope > .thu-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "thu-bar";
      const label = document.createElement("span");
      label.className = "thu-bar-label";
      const showBtn = document.createElement("button");
      showBtn.type = "button";
      showBtn.className = "thu-show-btn";
      showBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        post.classList.toggle("thu-peek");
        showBtn.textContent = post.classList.contains("thu-peek") ? "collapse" : "show";
      });
      const unhideBtn = document.createElement("button");
      unhideBtn.type = "button";
      unhideBtn.className = "thu-bar-unhide";
      unhideBtn.textContent = "unhide";
      unhideBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const name = usernameFromPost(post) || username;
        removeUser(name);
      });
      bar.append(label, showBtn, unhideBtn);
      post.insertBefore(bar, post.firstChild);
    }
    const label = bar.querySelector(".thu-bar-label");
    if (label) label.textContent = "Hidden post by " + username;
    const showBtn = bar.querySelector(".thu-show-btn");
    if (showBtn) showBtn.textContent = post.classList.contains("thu-peek") ? "collapse" : "show";
  }

  function makeHideButton(post, username) {
    const btn = document.createElement("button");
    btn.type = "button";
    const hidden = isBannedName(username) || isBannedId(ownerIdFromPost(post, username));
    btn.className = hidden ? "thu-unhide-btn" : "thu-hide-btn";
    btn.textContent = hidden ? "Unhide" : "Hide";
    btn.title = hidden ? "Show this user again" : "Hide posts from " + username;
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (isBannedName(username) || isBannedId(ownerIdFromPost(post, username))) removeUser(username);
      else addUser(username, ownerIdFromPost(post, username));
    });
    return btn;
  }

  function ensureHideButton(post, username) {
    if (!username) return;
    if (post.querySelector(":scope .thu-hide-btn, :scope .thu-unhide-btn")) return;
    const btn = makeHideButton(post, username);
    const actions = post.querySelector(".message_actions ul.action_list") || post.querySelector("ul.action_list");
    if (actions) {
      const li = document.createElement("li");
      li.className = "thu-action";
      li.appendChild(btn);
      actions.appendChild(li);
      return;
    }
    const nameRow = post.querySelector("p.username");
    if (nameRow && nameRow.parentNode) {
      nameRow.insertAdjacentElement("afterend", btn);
      return;
    }
    const anchor = usernameAnchor(post);
    if (anchor && anchor.parentNode) {
      const host = anchor.closest("p.username") || anchor;
      host.insertAdjacentElement("afterend", btn);
    } else {
      post.prepend(btn);
    }
  }

  function hideQuotes(root) {
    const quotes = root.querySelectorAll("blockquote, .quote, .messagecontent .quote");
    quotes.forEach((q) => {
      if (q.closest(".thu-bar")) return;
      const header = q.querySelector(".quotemeta, .quote-header, cite, .date, a[href*='/gallery/'], a.messagelink");
      const headerText = norm((header && header.textContent) || q.textContent.slice(0, 160));
      const hitName = banned.find((u) => headerText.toLowerCase().includes(keyName(u) + " "));
      const hitId = [...q.querySelectorAll("a[href*='/gallery/']")].some((a) =>
        isBannedId(galleryIdFromHref(a.getAttribute("href") || a.href))
      );
      if (hitName || hitId) q.classList.add("thu-quote-hidden");
      else q.classList.remove("thu-quote-hidden");
    });
  }

  function closestNoteRow(el) {
    return el.closest(
      ".notification, .notificatie, twk-site-menu-user-notifications .listing-content > *, " +
        "twk-sidebar li, twk-sidebar tr, twk-sidebar .item, twk-sidebar article, " +
        ".listing-content > *, li, tr, article, .topic, .topicRow, .item, .card, " +
        "[data-notification], [class*='notific']"
    );
  }

  function updateDynamicCss() {
    let style = document.getElementById("thu-dynamic-css");
    if (!style) {
      style = document.createElement("style");
      style.id = "thu-dynamic-css";
      (document.head || document.documentElement).appendChild(style);
    }
    const rules = [];
    bannedIds.forEach((id) => {
      if (!/^\d+$/.test(id)) return;
      const href = 'a[href*="/gallery/' + id + '"]';
      const msg = 'div.message[data-owner-id="' + id + '"]:not(.thu-peek)';
      rules.push(
        msg + " > .poster",
        msg + " > .post",
        msg + " > .messageheader",
        msg + " > .clear",
        msg + " > .messagecontent",
        "blockquote:has(" + href + ")",
        "twk-sidebar li:has(" + href + ")",
        "twk-sidebar tr:has(" + href + ")",
        "twk-sidebar .item:has(" + href + ")",
        "twk-site-menu-user-notifications .notification:has(" + href + ")",
        "twk-site-menu-user-notifications .listing-content > *:has(" + href + ")",
        ".listing-content .notification:has(" + href + ")",
        "#userbar .listing-content > *:has(" + href + ")"
      );
    });
    style.textContent = rules.length ? rules.join(",") + "{display:none!important}" : "";
  }

  function hideNotifications() {
    updateDynamicCss();

    document.querySelectorAll(".notification, .notificatie").forEach((row) => {
      const hit = [...row.querySelectorAll("a[href*='/gallery/'], a.user, span.user")].some(isBannedEl);
      row.classList.toggle("thu-note-hidden", hit);
    });

    const links = document.querySelectorAll(
      "#userbar a.user, #userbar span.user, #userbar a[href*='/gallery/'], " +
        "twk-sidebar a.user, twk-sidebar span.user, twk-sidebar a[href*='/gallery/'], " +
        "twk-site-menu-pane a.user, twk-site-menu-pane span.user, twk-site-menu-pane a[href*='/gallery/'], " +
        "twk-site-menu-user-notifications a.user, twk-site-menu-user-notifications span.user, " +
        "twk-site-menu-user-notifications a[href*='/gallery/'], " +
        ".listing-content a.user, .listing-content span.user, .listing-content a[href*='/gallery/'], " +
        "[class*='notific'] a.user, [class*='notific'] span.user, [class*='notific'] a[href*='/gallery/'], " +
        "[id*='notific'] a.user, [id*='notific'] span.user, [id*='notific'] a[href*='/gallery/'], " +
        ".tracker a.user, .tracker span.user, .tracker a[href*='/gallery/']"
    );
    links.forEach((el) => {
      if (el.closest(".message, .reactieBody, article.reactie, .thu-bar, .thu-hide-btn, .thu-unhide-btn")) return;
      const row = closestNoteRow(el);
      if (!row || row.closest(".message, .reactieBody, article.reactie")) return;
      const hit = [...row.querySelectorAll("a.user, span.user, a[href*='/gallery/']")].some(isBannedEl);
      row.classList.toggle("thu-note-hidden", hit);
    });
  }

  function applyPost(post) {
    const username = usernameFromPost(post);
    if (!username) {
      post.classList.add("thu-ready");
      return;
    }
    ensureHideButton(post, username);
    const hidden = isBannedName(username) || isBannedId(ownerIdFromPost(post, username));
    post.classList.toggle("thu-hidden", hidden);
    post.classList.add("thu-ready");
    if (hidden) ensureBar(post, username);
    else {
      const bar = post.querySelector(":scope > .thu-bar");
      if (bar) bar.remove();
      post.classList.remove("thu-peek");
    }
    const btn = post.querySelector(".thu-hide-btn, .thu-unhide-btn");
    if (btn) {
      btn.className = hidden ? "thu-unhide-btn" : "thu-hide-btn";
      btn.textContent = hidden ? "Unhide" : "Hide";
    }
  }

  function applyAll() {
    if (applying) return;
    applying = true;
    try {
      document.querySelectorAll(forumPostSelector).forEach(applyPost);
      document.querySelectorAll(commentSelector).forEach(applyPost);
      hideQuotes(document);
      hideNotifications();
    } finally {
      applying = false;
    }
  }

  let timer = 0;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(applyAll, 80);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("thu-apply", applyAll);
  applyAll();

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync" && area !== "local") return;
      if (changes[STORAGE_KEY] || changes[IDS_KEY] || changes[MAP_KEY]) {
        if (changes[STORAGE_KEY]) {
          banned = Array.isArray(changes[STORAGE_KEY].newValue)
            ? changes[STORAGE_KEY].newValue.map(norm).filter(Boolean)
            : banned;
        }
        if (changes[MAP_KEY] && changes[MAP_KEY].newValue && typeof changes[MAP_KEY].newValue === "object") {
          idByName = changes[MAP_KEY].newValue;
        }
        if (changes[IDS_KEY] && Array.isArray(changes[IDS_KEY].newValue)) {
          bannedIds = changes[IDS_KEY].newValue.map(String);
        }
        pruneIdsToNames();
        applyAll();
      }
    });
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg && msg.action === "get-stats") {
        sendResponse({
          ready: true,
          hiddenPosts: document.querySelectorAll(".thu-hidden").length,
          hiddenUsers: banned.length,
        });
        return;
      }
      if (msg && msg.action === "update-settings") {
        loadBanned().then(applyAll);
      }
    });
    loadBanned().then(applyAll);
  } catch (_) {}

  setTimeout(() => {
    document.querySelectorAll(forumPostSelector + ", " + commentSelector).forEach((post) => {
      if (!post.classList.contains("thu-ready") && !post.classList.contains("thu-hidden")) {
        post.classList.add("thu-ready");
      }
    });
  }, 1200);
})();
}
