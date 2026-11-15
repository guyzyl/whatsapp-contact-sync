import { test } from "node:test";
import assert from "node:assert/strict";

import { isTransientError, retryTransient } from "./retry";

function httpError(status: number, headers?: Record<string, string>): Error {
  return Object.assign(new Error(`HTTP ${status}`), {
    response: { status, headers },
  });
}

function networkError(code: string): Error {
  return Object.assign(new Error(code), { code });
}

test("returns immediately when the operation succeeds", async () => {
  let calls = 0;
  const result = await retryTransient(async () => {
    calls++;
    return "ok";
  });

  assert.equal(result, "ok");
  assert.equal(calls, 1);
});

test("retries 5xx and 429 responses", async () => {
  for (const status of [429, 500, 502, 503, 504]) {
    let calls = 0;
    await retryTransient(
      async () => {
        calls++;
        if (calls === 1) throw httpError(status);
        return "ok";
      },
      { sleep: async () => {} }
    );
    assert.equal(calls, 2, `expected a retry for HTTP ${status}`);
  }
});

test("retries connection-level errors", async () => {
  for (const code of ["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ENOTFOUND"]) {
    let calls = 0;
    await retryTransient(
      async () => {
        calls++;
        if (calls === 1) throw networkError(code);
        return "ok";
      },
      { sleep: async () => {} }
    );
    assert.equal(calls, 2, `expected a retry for ${code}`);
  }
});

test("does not retry non-transient failures", async () => {
  for (const error of [
    httpError(400),
    httpError(401),
    httpError(403),
    httpError(404),
    new Error("programming error"),
    Object.assign(new Error("bad request"), { code: "ERR_BAD_REQUEST" }),
  ]) {
    let calls = 0;
    await assert.rejects(
      retryTransient(
        async () => {
          calls++;
          throw error;
        },
        { sleep: async () => {} }
      ),
      error
    );
    assert.equal(calls, 1);
  }
});

test("gives up after the configured number of attempts", async () => {
  const error = httpError(500);
  let calls = 0;
  const retries: number[] = [];

  await assert.rejects(
    retryTransient(
      async () => {
        calls++;
        throw error;
      },
      {
        attempts: 4,
        sleep: async () => {},
        onRetry: (_error, attempt) => retries.push(attempt),
      }
    ),
    error
  );

  assert.equal(calls, 4);
  assert.deepEqual(retries, [1, 2, 3]);
});

test("backs off exponentially", async () => {
  const delays: number[] = [];

  await assert.rejects(
    retryTransient(
      async () => {
        throw httpError(503);
      },
      {
        attempts: 4,
        baseDelayMs: 100,
        maxDelayMs: 10000,
        sleep: async (ms) => {
          delays.push(ms);
        },
      }
    )
  );

  assert.deepEqual(delays, [100, 200, 400]);
});

test("honours a numeric Retry-After header", async () => {
  const delays: number[] = [];

  await assert.rejects(
    retryTransient(
      async () => {
        throw httpError(429, { "retry-after": "3" });
      },
      {
        attempts: 2,
        baseDelayMs: 100,
        sleep: async (ms) => {
          delays.push(ms);
        },
      }
    )
  );

  assert.deepEqual(delays, [3000]);
});

test("caps Retry-After delays", async () => {
  const delays: number[] = [];

  await assert.rejects(
    retryTransient(
      async () => {
        throw httpError(429, { "retry-after": "120" });
      },
      {
        attempts: 2,
        maxDelayMs: 8000,
        sleep: async (ms) => {
          delays.push(ms);
        },
      }
    )
  );

  assert.deepEqual(delays, [8000]);
});

test("isTransientError classifies errors", () => {
  assert.equal(isTransientError(httpError(429)), true);
  assert.equal(isTransientError(httpError(500)), true);
  assert.equal(isTransientError(httpError(400)), false);
  assert.equal(isTransientError(networkError("ECONNRESET")), true);
  assert.equal(isTransientError(new Error("boom")), false);
});
