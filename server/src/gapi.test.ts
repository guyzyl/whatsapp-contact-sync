import assert from "node:assert/strict";
import test from "node:test";

import { isAuthorizationError } from "./gapi";

test("isAuthorizationError recognises rejected credentials", () => {
  assert.equal(isAuthorizationError({ code: 401 }), true);
  assert.equal(isAuthorizationError(new Error("invalid_grant")), true);
  assert.equal(
    isAuthorizationError(new Error("Token has been expired or revoked.")),
    true
  );
  assert.equal(
    isAuthorizationError({
      response: { data: { error_description: "invalid_token" } },
    }),
    true
  );
});

test("isAuthorizationError does not treat transient failures as sign-outs", () => {
  assert.equal(isAuthorizationError({ code: 500 }), false);
  assert.equal(isAuthorizationError({ response: { status: 429 } }), false);
  assert.equal(isAuthorizationError(new Error("socket hang up")), false);
  assert.equal(isAuthorizationError(undefined), false);
});
