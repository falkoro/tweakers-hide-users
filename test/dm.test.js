"use strict";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  isDirectMessagingUrl,
  isDirectMessagingContext,
  shouldFilterPage,
  shouldHidePost,
} = require("../thu-core.js");

describe("isDirectMessagingUrl", () => {
  it("treats Tweakers DM routes as DMs", () => {
    assert.equal(isDirectMessagingUrl("https://tweakers.net/direct-messaging/"), true);
    assert.equal(
      isDirectMessagingUrl("https://gathering.tweakers.net/direct-messaging/12345"),
      true
    );
    assert.equal(
      isDirectMessagingUrl("https://gathering.tweakers.net/forum/list_dmmessages/99"),
      true
    );
  });

  it("does not treat public forum threads as DMs", () => {
    assert.equal(
      isDirectMessagingUrl("https://gathering.tweakers.net/forum/list_messages/2261306"),
      false
    );
    assert.equal(isDirectMessagingUrl("https://tweakers.net/nieuws/252368/"), false);
  });
});

describe("shouldHidePost", () => {
  const banned = { names: ["AnnoyingUser"], ids: ["4242"] };

  it("hides a forum post from a hidden user", () => {
    assert.equal(
      shouldHidePost({
        username: "AnnoyingUser",
        ownerId: "4242",
        pageUrl: "https://gathering.tweakers.net/forum/list_messages/1",
        bannedNames: banned.names,
        bannedIds: banned.ids,
      }),
      true
    );
  });

  it("does not hide a DM from a hidden user", () => {
    assert.equal(
      shouldHidePost({
        username: "AnnoyingUser",
        ownerId: "4242",
        pageUrl: "https://tweakers.net/direct-messaging/",
        bannedNames: banned.names,
        bannedIds: banned.ids,
      }),
      false
    );
  });

  it("does not hide a message inside DM chrome on a forum page", () => {
    assert.equal(
      shouldHidePost({
        username: "AnnoyingUser",
        ownerId: "4242",
        pageUrl: "https://gathering.tweakers.net/forum/list_messages/1",
        inDirectMessageUi: true,
        bannedNames: banned.names,
        bannedIds: banned.ids,
      }),
      false
    );
  });
});

describe("shouldFilterPage", () => {
  it("skips filtering on the DM page", () => {
    assert.equal(shouldFilterPage("https://tweakers.net/direct-messaging/"), false);
    assert.equal(
      shouldFilterPage("https://gathering.tweakers.net/forum/list_messages/1"),
      true
    );
  });
});

describe("isDirectMessagingContext", () => {
  it("detects DM web components and class names", () => {
    assert.equal(
      isDirectMessagingContext({ closestTag: "twk-direct-messaging" }),
      true
    );
    assert.equal(isDirectMessagingContext({ closestClass: "direct-messaging" }), true);
    assert.equal(isDirectMessagingContext({ closestClass: "message" }), false);
  });
});
