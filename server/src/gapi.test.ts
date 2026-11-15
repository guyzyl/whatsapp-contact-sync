import { test } from "node:test";
import assert from "node:assert/strict";

type UpdatePhoto = () => Promise<unknown>;
type GapiModule = typeof import("./gapi");

function httpError(status: number, headers?: Record<string, string>): Error {
  return Object.assign(new Error(`HTTP ${status}`), {
    response: { status, headers },
  });
}

/**
 * Load `gapi` with a stubbed `googleapis` module. The retry helper is exercised
 * via real calls to `updateContactPhoto`; a `Retry-After: 0` header keeps the
 * transient cases instant.
 */
function loadGapiWith(updateContactPhoto: UpdatePhoto): GapiModule {
  const googleapisPath = require.resolve("googleapis");
  require.cache[googleapisPath] = {
    exports: {
      google: {
        people: () => ({ people: { updateContactPhoto } }),
      },
    },
  } as NodeModule;

  delete require.cache[require.resolve("./gapi")];
  return require("./gapi") as GapiModule;
}

test("updateContactPhoto retries transient Google failures", async (t) => {
  const googleapisPath = require.resolve("googleapis");
  const originalGoogleapis = require.cache[googleapisPath];

  try {
    await t.test("succeeds after a transient 503", async () => {
      let calls = 0;
      const { updateContactPhoto } = loadGapiWith(async () => {
        calls++;
        if (calls === 1) throw httpError(503, { "retry-after": "0" });
        return {};
      });

      await updateContactPhoto({} as any, "people/1", "cGhvdG8=");
      assert.equal(calls, 2);
    });

    await t.test("retries rate limiting (429)", async () => {
      let calls = 0;
      const { updateContactPhoto } = loadGapiWith(async () => {
        calls++;
        if (calls === 1) throw httpError(429, { "retry-after": "0" });
        return {};
      });

      await updateContactPhoto({} as any, "people/1", "cGhvdG8=");
      assert.equal(calls, 2);
    });

    await t.test("does not retry non-transient failures", async () => {
      const error = httpError(400);
      let calls = 0;
      const { updateContactPhoto } = loadGapiWith(async () => {
        calls++;
        throw error;
      });

      await assert.rejects(
        updateContactPhoto({} as any, "people/1", "cGhvdG8="),
        error
      );
      assert.equal(calls, 1);
    });

    await t.test("gives up after repeated transient failures", async () => {
      let calls = 0;
      const { updateContactPhoto } = loadGapiWith(async () => {
        calls++;
        throw httpError(503, { "retry-after": "0" });
      });

      await assert.rejects(updateContactPhoto({} as any, "people/1", "cGhvdG8="));
      assert.equal(calls, 5);
    });
  } finally {
    if (originalGoogleapis) {
      require.cache[googleapisPath] = originalGoogleapis;
    } else {
      delete require.cache[googleapisPath];
    }
    delete require.cache[require.resolve("./gapi")];
  }
});
