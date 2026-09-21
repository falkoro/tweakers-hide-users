"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");

const css = fs.readFileSync(path.join(__dirname, "..", "content.css"), "utf8");
const compact = css.replace(/\s+/g, " ");

describe("FOUC hide CSS", () => {
  it("does not hide every div.message, so Tweakers DMs stay visible", () => {
    assert.doesNotMatch(
      compact,
      /html\.thu-on div\.message:not\(\.thu-ready\)/,
      "bare div.message FOUC rule hides DM bubbles that also use class=message"
    );
  });

  it("still hides unread forum posts until JS marks them ready", () => {
    assert.match(compact, /div\.message\[data-owner-id\]:not\(\.thu-ready\)/);
    assert.match(compact, /div\.message\[data-message-id\]:not\(\.thu-ready\)/);
  });

  it("does not apply FOUC hiding on DM pages (html.thu-dm)", () => {
    assert.match(compact, /html\.thu-on:not\(\.thu-dm\)/);
  });
});
