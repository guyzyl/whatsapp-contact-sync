import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

/**
 * All phone-number normalization lives here so the Google side
 * (gapi.ts), the WhatsApp side (whatsapp.ts) and the matching loop
 * (sync.ts) agree on a single canonical representation.
 *
 * WhatsApp identifies contacts by their number in international digits with no
 * leading `+` (e.g. `393401234567`). Google's People API gives us either an
 * E.164 `canonicalForm` (`+393401234567`) or a raw, locally-formatted `value`
 * (`340 1234567`). We reduce both to the same "E.164 digits" string.
 */

/** Strip a leading `+` and every non-digit character. */
function toDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Infer the syncing user's country from their own WhatsApp number so that
 * contacts saved in a local format (without a `+CC` prefix) can still be
 * parsed. `ownNumber` is WhatsApp's `client.info.wid.user` (digits, no `+`).
 */
export function inferRegion(ownNumber?: string): CountryCode | undefined {
  if (!ownNumber) return undefined;
  return parsePhoneNumberFromString("+" + toDigits(ownNumber))?.country;
}

/**
 * Normalize an arbitrary phone string to E.164 digits (no `+`), e.g.
 * `+39 340 1234567` -> `393401234567`. `defaultCountry` is used only when the
 * input has no country code of its own. Returns `undefined` when the input
 * cannot be parsed into a plausible number.
 */
export function toE164Digits(
  input: string,
  defaultCountry?: CountryCode
): string | undefined {
  if (!input) return undefined;
  const parsed = parsePhoneNumberFromString(input, defaultCountry);
  if (!parsed || !parsed.isPossible()) return undefined;
  return toDigits(parsed.number);
}

/**
 * Some countries store a different digit count on WhatsApp than the E.164
 * canonical form Google returns, because of a mobile-indicator digit that is
 * inserted or dropped between the country code and the subscriber number.
 *
 * Given a canonical (Google-side) digit string, generate the alternative
 * WhatsApp-style spellings to also try. This generalizes the original inline
 * Brazil-only fix and guarantees matching for these countries regardless of
 * how the phone library canonicalizes the legacy forms.
 */
export function legacyVariants(digits: string): string[] {
  const variants = new Set<string>();

  const add = (value: string) => {
    if (value !== digits) variants.add(value);
  };

  // Brazil (+55): mobile numbers carry a leading `9` on the subscriber part
  // (13 digits: 55 + 2-digit area + 9 + 8 digits). Older entries omit it.
  if (digits.startsWith("55")) {
    if (digits.length === 13 && digits[4] === "9") {
      add(digits.slice(0, 4) + digits.slice(5)); // drop the extra 9
    } else if (digits.length === 12) {
      add(digits.slice(0, 4) + "9" + digits.slice(4)); // add the 9
    }
  }

  // Mexico (+52): WhatsApp historically inserts a `1` after the country code
  // for mobiles (13 digits) while E.164 canonical is 12 digits.
  if (digits.startsWith("52")) {
    if (digits.length === 12) {
      add("521" + digits.slice(2)); // add the mobile 1
    } else if (digits.length === 13 && digits[2] === "1") {
      add("52" + digits.slice(3)); // drop the mobile 1
    }
  }

  // Argentina (+54): mobiles carry a `9` after the country code on WhatsApp.
  if (digits.startsWith("54")) {
    if (digits[2] !== "9") {
      add("549" + digits.slice(2)); // add the mobile 9
    } else {
      add("54" + digits.slice(3)); // drop the mobile 9
    }
  }

  return [...variants];
}

/**
 * Build the ordered list of keys to probe against the WhatsApp contact map for
 * a given raw Google number: the normalized E.164 digits first, then its
 * country-specific legacy spellings, then a last-resort bare-digits form.
 */
export function matchCandidates(
  rawNumber: string,
  defaultCountry?: CountryCode
): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();
  const push = (value?: string) => {
    if (value && !seen.has(value)) {
      seen.add(value);
      candidates.push(value);
    }
  };

  const e164 = toE164Digits(rawNumber, defaultCountry);
  push(e164);
  if (e164) legacyVariants(e164).forEach(push);
  push(toDigits(rawNumber));

  return candidates;
}
