import { test } from "node:test";
import assert from "node:assert/strict";

test("purchase checks initialize Redis and accept existing records without the upstream API", async () => {
  const redisPath = require.resolve("ioredis");
  const originalRedis = require.cache[redisPath];
  const originalFetch = globalThis.fetch;
  const originalEnforce = process.env.ENFORCE_PAYMENTS;
  const records = new Map([["existing@example.com", ""]]);
  let connections = 0;
  let upstreamRequests = 0;
  class FakeRedis {
    constructor() { connections++; }
    async get(email: string) { return records.get(email) ?? null; }
    async set(email: string, value: string) { records.set(email, value); }
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
    const { checkPurchase } = require("./payments") as typeof import("./payments");
    assert.equal(connections, 1);
    assert.equal(await checkPurchase("existing@example.com"), true);
    assert.equal(upstreamRequests, 0);
    assert.equal(await checkPurchase("new@example.com"), true);
    assert.equal(upstreamRequests, 1);
    assert.equal(await checkPurchase("missing@example.com"), false);
    assert.equal(await checkPurchase("invalid"), false);
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
