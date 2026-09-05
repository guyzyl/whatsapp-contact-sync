import { test } from "node:test";
import assert from "node:assert/strict";

test("purchase verification and WhatsApp account binding", async (t) => {
  const redisPath = require.resolve("ioredis");
  const originalRedis = require.cache[redisPath];
  const originalFetch = globalThis.fetch;
  const originalEnforce = process.env.ENFORCE_PAYMENTS;
  const records = new Map([["existing@example.com", ""]]);
  const ttls = new Map<string, number>();
  let expireBeforeSet = false;
  let connections = 0;
  let upstreamRequests = 0;
  class FakeRedis {
    constructor() { connections++; }
    async get(email: string) { return records.get(email) ?? null; }
    async ttl(email: string) { return records.has(email) ? ttls.get(email) ?? -1 : -2; }
    async set(email: string, value: string, ...options: (string | number)[]) {
      if (expireBeforeSet) {
        records.delete(email);
        ttls.delete(email);
        expireBeforeSet = false;
      }
      if (options.includes("XX") && !records.has(email)) return null;
      const exIndex = options.indexOf("EX");
      if (exIndex !== -1) {
        const ttl = Number(options[exIndex + 1]);
        if (ttl <= 0) throw new Error("ERR invalid expire time");
        ttls.set(email, ttl);
      } else if (!options.includes("KEEPTTL")) {
        ttls.delete(email);
      }
      records.set(email, value);
      return "OK";
    }
  }

  process.env.ENFORCE_PAYMENTS = "true";
  require.cache[redisPath] = { exports: FakeRedis } as NodeModule;
  globalThis.fetch = async () => {
    upstreamRequests++;
    return Response.json({ data: [{
        payer_email: "new@example.com",
        support_created_on: new Date().toISOString(),
      }] });
  };

  try {
    const { checkPurchase, verifyPurchaseWAId } = require("./payments") as typeof import("./payments");
    assert.equal(connections, 1);
    assert.equal(await checkPurchase("existing@example.com"), true);
    assert.equal(upstreamRequests, 0);
    assert.equal(await checkPurchase("new@example.com"), true);
    assert.equal(upstreamRequests, 1);
    assert.equal(await checkPurchase("missing@example.com"), false);
    assert.equal(await checkPurchase("invalid"), false);

    await t.test("a permanent purchase stays permanent after binding", async () => {
      assert.equal(await verifyPurchaseWAId("existing@example.com", "account-1"), true);
      assert.equal(records.get("existing@example.com"), "account-1");
      assert.equal(ttls.has("existing@example.com"), false);
      assert.equal(await verifyPurchaseWAId("existing@example.com", "account-2"), false);
    });

    await t.test("binding preserves the remaining expiration", async () => {
      records.set("expiring@example.com", "");
      ttls.set("expiring@example.com", 120);
      assert.equal(await verifyPurchaseWAId("expiring@example.com", "account-1"), true);
      assert.equal(ttls.get("expiring@example.com"), 120);
    });

    await t.test("a purchase expiring during binding is not recreated", async () => {
      records.set("expired@example.com", "");
      expireBeforeSet = true;
      assert.equal(await verifyPurchaseWAId("expired@example.com", "account-1"), false);
      assert.equal(records.has("expired@example.com"), false);
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalRedis) require.cache[redisPath] = originalRedis;
    else delete require.cache[redisPath];
    if (originalEnforce === undefined) delete process.env.ENFORCE_PAYMENTS;
    else process.env.ENFORCE_PAYMENTS = originalEnforce;
    delete require.cache[require.resolve("./payments")];
    delete require.cache[require.resolve("./config")];
  }
});
