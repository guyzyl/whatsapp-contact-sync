import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createTokenStore } from "./gtoken";

test("a saved token survives a restart", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "google-token-"));
  const file = path.join(dir, "google-token.json");

  const first = createTokenStore(file);
  first.save({
    access_token: "access-1",
    refresh_token: "refresh-1",
    expiry_date: 1234567890,
    scope: "contacts",
    token_type: "Bearer",
  });

  // A second instance stands in for the next process start.
  const second = createTokenStore(file);
  const loaded = second.load();

  assert.equal(loaded?.refresh_token, "refresh-1");
  assert.equal(loaded?.access_token, "access-1");
  assert.equal(loaded?.expiry_date, 1234567890);

  fs.rmSync(dir, { recursive: true, force: true });
});

test("undefined fields are not written as null", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "google-token-"));
  const file = path.join(dir, "google-token.json");

  createTokenStore(file).save({ access_token: "a", refresh_token: "r" });

  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.deepEqual(Object.keys(raw).sort(), ["access_token", "refresh_token"]);

  fs.rmSync(dir, { recursive: true, force: true });
});

test("a missing token file is simply 'not signed in'", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "google-token-"));
  assert.equal(createTokenStore(path.join(dir, "nope.json")).load(), null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("a corrupt token file does not throw", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "google-token-"));
  const file = path.join(dir, "google-token.json");
  fs.writeFileSync(file, "{ this is not json");

  assert.equal(createTokenStore(file).load(), null);

  fs.rmSync(dir, { recursive: true, force: true });
});

test("clear removes the file so the next start asks for a sign-in", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "google-token-"));
  const file = path.join(dir, "google-token.json");

  const store = createTokenStore(file);
  store.save({ refresh_token: "r" });
  store.clear();

  assert.equal(fs.existsSync(file), false);
  assert.equal(store.load(), null);

  fs.rmSync(dir, { recursive: true, force: true });
});

test("a null path keeps the token in memory only", () => {
  const store = createTokenStore(null);
  store.save({ refresh_token: "r" });
  assert.equal(store.load()?.refresh_token, "r");

  store.clear();
  assert.equal(store.load(), null);
});
