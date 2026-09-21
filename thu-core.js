(function (root) {
  const DM_PATH = /\/direct-messaging(?:\/|$)/i;
  const DM_LEGACY_PATH = /\/list_dmmessages(?:\/|$)/i;
  const DM_UI_SELECTOR = [
    "twk-direct-messaging",
    "twk-direct-messages",
    ".direct-messaging",
    "#direct-messaging",
    '[class*="direct-messag"]',
    '[class*="DirectMessag"]',
    '[id*="direct-messag"]',
    '[id*="DirectMessag"]',
    "[data-direct-message]",
  ].join(", ");

  function pathnameOf(url) {
    const raw = String(url || "");
    try {
      return new URL(raw, "https://tweakers.net").pathname;
    } catch (_) {
      return raw;
    }
  }

  function isDirectMessagingUrl(url) {
    const path = pathnameOf(url);
    return DM_PATH.test(path) || DM_LEGACY_PATH.test(path);
  }

  function shouldFilterPage(url) {
    return !isDirectMessagingUrl(url);
  }

  function isDirectMessagingContext(el) {
    if (!el) return false;
    if (typeof el.closest === "function") {
      try {
        return !!el.closest(DM_UI_SELECTOR);
      } catch (_) {
        return false;
      }
    }
    const hay = [el.closestTag, el.closestClass, el.closestId].filter(Boolean).join(" ");
    return /direct-messag/i.test(hay);
  }

  function keyName(name) {
    return String(name || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function shouldHidePost(opts) {
    const o = opts || {};
    if (o.inDirectMessageUi) return false;
    if (!shouldFilterPage(o.pageUrl)) return false;
    const n = keyName(o.username);
    if (n && (o.bannedNames || []).some((u) => keyName(u) === n)) return true;
    const id = String(o.ownerId || "").trim();
    if (id && (o.bannedIds || []).map(String).includes(id)) return true;
    return false;
  }

  const api = {
    DM_UI_SELECTOR,
    isDirectMessagingUrl,
    isDirectMessagingContext,
    shouldFilterPage,
    shouldHidePost,
  };

  root.ThuCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
