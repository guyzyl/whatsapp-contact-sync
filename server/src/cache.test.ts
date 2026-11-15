import { test } from "node:test";
import assert from "node:assert/strict";

import {
  deleteFromCache,
  getFromCache,
  sessionCache,
  setInCache,
} from "./cache";

test("reading a session slides its TTL", async () => {
  const id = `cache-test-${Date.now()}-${Math.random()}`;
  setInCache(id, "value", { ok: true });

  // Let some time pass, then read the entry. With updateAgeOnGet the read
  // resets the age, so almost the full TTL should remain afterwards.
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.deepEqual(getFromCache(id, "value"), { ok: true });

  const ttl = sessionCache.ttl!;
  const remaining = sessionCache.getRemainingTTL(`${id}-value`);
  assert.ok(
    remaining > ttl - 50,
    `expected a refreshed TTL close to ${ttl}ms, got ${remaining}ms`
  );

  deleteFromCache(id, "value");
});
