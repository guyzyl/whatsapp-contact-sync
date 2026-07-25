import { test } from "node:test";
import assert from "node:assert/strict";

import {
  inferRegion,
  toE164Digits,
  legacyVariants,
  matchCandidates,
} from "./phone";

/**
 * The invariant we care about: a Google-side number and the way WhatsApp stores
 * the same contact must resolve to a shared key. Each case below asserts that
 * the WhatsApp `id.user` string appears among the candidates generated from the
 * Google number (optionally with a region inferred from the syncing user).
 */

const matches = (
  googleNumber: string,
  whatsappUser: string,
  region?: Parameters<typeof matchCandidates>[1]
) => matchCandidates(googleNumber, region).includes(whatsappUser);

test("Italy (+39) mobile in E.164 form matches WhatsApp digits", () => {
  assert.ok(matches("+393401234567", "393401234567"));
});

test("Italy (+39) number saved locally matches when region is inferred", () => {
  const region = inferRegion("393401112222"); // syncing user's own IT number
  assert.equal(region, "IT");
  assert.ok(matches("340 1234567", "393401234567", region));
});

test("Mexico (+52) canonical matches WhatsApp's inserted mobile '1'", () => {
  // Google gives 12 digits, WhatsApp stores 13 with a '1' after 52.
  assert.ok(matches("+525512345678", "5215512345678"));
});

test("Mexico (+52) also matches when WhatsApp stores the canonical form", () => {
  assert.ok(matches("+525512345678", "525512345678"));
});

test("Brazil (+55) matches both with and without the extra '9'", () => {
  // Guards the behavior of the original inline Brazil fix.
  assert.ok(matches("+551151234567", "5511951234567")); // 12 -> add 9
  assert.ok(matches("+5511951234567", "551151234567")); // 13 -> drop 9
});

test("Argentina (+54) matches WhatsApp's mobile '9'", () => {
  assert.ok(matches("+541112345678", "5491112345678"));
});

test("Israel (+972) matches directly", () => {
  assert.ok(matches("+972541234567", "972541234567"));
});

test("US (+1) matches directly", () => {
  assert.ok(matches("+12025551234", "12025551234"));
});

test("toE164Digits strips formatting and the leading +", () => {
  assert.equal(toE164Digits("+39 340 123 4567"), "393401234567");
});

test("toE164Digits returns undefined for unparseable input", () => {
  assert.equal(toE164Digits("not a phone"), undefined);
  assert.equal(toE164Digits(""), undefined);
});

test("legacyVariants only fires for known extra-digit countries", () => {
  assert.deepEqual(legacyVariants("972541234567"), []); // Israel: none
  assert.deepEqual(legacyVariants("12025551234"), []); // US: none
  assert.ok(legacyVariants("525512345678").includes("5215512345678")); // Mexico
});
