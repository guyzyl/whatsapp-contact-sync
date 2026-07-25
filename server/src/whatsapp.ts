import {
  Client,
  Contact,
  MessageMedia,
  RemoteWebCacheOptions,
} from "whatsapp-web.js";
import { RateLimiter } from "limiter";

import { sendEvent } from "./ws";
import { Base64 } from "./types";
import { EventType } from "../../interfaces/api";
import { deleteFromCache, getFromCache } from "./cache";
import { verifyPurchaseWAId } from "./payments";
import { toE164Digits } from "./phone";
import { logger } from "./logger";

const wwebVersion = "2.2407.3";
const clientOptions = {
  puppeteer: {
    executablePath:
      process.env.RUNNING_IN_DOCKER === "true"
        ? "/usr/bin/chromium-browser"
        : undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  },
  webVersionCache: {
    type: "remote",
    remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
  } as RemoteWebCacheOptions,
};

export function initWhatsApp(id: string): Client {
  const client = new Client(clientOptions);

  client.on("qr", (qr: string) => {
    let ws = getFromCache(id, "ws");
    sendEvent(ws, EventType.WhatsAppQR, qr);
  });

  client.on("loading_screen", async () => {
    let ws = getFromCache(id, "ws");
    sendEvent(ws, EventType.WhatsAppConnecting);
  });

  client.on("ready", async () => {
    let ws = getFromCache(id, "ws");
    const email = getFromCache(id, "email");

    if (await verifyPurchaseWAId(email, client.info.wid.user)) {
      sendEvent(ws, EventType.Redirect, "/gauth");
    } else {
      deleteFromCache(id, "whatsapp");
      deleteFromCache(id, "purchased");
      try {
        client.destroy();
      } catch (e) { }
      sendEvent(ws, EventType.Redirect, "/contribute?show_error=true");
    }
  });

  client.on("auth_failure", (msg) => { });

  client.initialize();
  return client;
}

export async function loadContacts(
  client: Client
): Promise<Map<string, string>> {
  const contacts: Contact[] = await client.getContacts();

  const contactsMap: Map<string, string> = new Map();
  contacts.forEach((contact) => {
    if (!contact.id.user || !contact.id._serialized) return;

    // Key by the raw WhatsApp user id (international digits, no `+`) and, when
    // parseable, its normalized E.164 form. Indexing both lets a legacy-format
    // WhatsApp number and a canonical Google number meet in the middle.
    contactsMap.set(contact.id.user, contact.id._serialized);
    const normalized = toE164Digits("+" + contact.id.user);
    if (normalized) contactsMap.set(normalized, contact.id._serialized);
  });

  logger.debug(`[sync] whatsapp: ${contacts.length} contacts, ${contactsMap.size} lookup keys`);

  return contactsMap;
}

// Outcome of resolving a contact's profile picture. `throttled` is kept
// distinct from `none` so the caller can back off and retry a rate-limit
// instead of silently dropping the contact as if it had no photo.
type ProfilePicResult =
  | { status: "ok"; url: string }
  | { status: "none" } // resolved: contact has no picture, or it's hidden by privacy
  | { status: "throttled"; code: number | null } // server pushed back; likely rate-limited
  | { status: "unresolved" }; // no strategy could produce an answer

/**
 * Resolve a contact's profile-picture URL.
 *
 * whatsapp-web.js's `client.getProfilePicUrl()` passes an internal *chat* to
 * WhatsApp's `requestProfilePicFromServer`. For a contact you have no open chat
 * with — the majority of an address book — that chat is `null`, and the bridge
 * throws while reading it, so the vast majority of contacts fail to resolve.
 *
 * Instead we resolve a proper Contact model (which every address-book contact
 * has) and pass that, falling back to a chat and finally the raw wid.
 *
 * WhatsApp answers a picture request with a `ServerStatusCodeError`. A 404/401/
 * 403 (or an unknown code) is a definitive "no picture / hidden", but at scale
 * the server starts refusing with a throttle/5xx status — those we surface as
 * `throttled` so the caller can retry rather than treat them as no-photo.
 */
async function resolveProfilePicUrl(
  client: Client,
  contactId: string
): Promise<ProfilePicResult> {
  return await (client as any).pupPage.evaluate(async (contactId: string) => {
    const req = (globalThis as any).require;
    const bridge = req("WAWebContactProfilePicThumbBridge");
    const collections = req("WAWebCollections");
    const wid = req("WAWebWidFactory").createWid(contactId);

    // A `skip` result means the strategy was unusable — try the next target.
    const attempt = async (target: any) => {
      if (!target) return { status: "skip" };
      try {
        const pic = await bridge.requestProfilePicFromServer(target);
        return pic && pic.eurl
          ? { status: "ok", url: pic.eurl }
          : { status: "none" };
      } catch (e: any) {
        if (e && e.name === "ServerStatusCodeError") {
          const code =
            typeof e.status === "number"
              ? e.status
              : typeof e.code === "number"
              ? e.code
              : null;
          // Only a positive throttle/server-error signal is retryable. Everything
          // else (404/401/403, or an unknown code) means "no picture available",
          // so we never retry-storm genuine no-photo contacts.
          if (code === 429 || code === 408 || (code !== null && code >= 500))
            return { status: "throttled", code };
          return { status: "none" };
        }
        return { status: "skip" }; // unusable target — fall through to the next strategy
      }
    };

    let result = await attempt(collections.Contact.get(wid));
    if (result.status === "skip") result = await attempt(collections.Chat.get(wid));
    if (result.status === "skip") result = await attempt(wid);
    return result.status === "skip" ? { status: "unresolved" } : result;
  }, contactId);
}

const MAX_PROFILE_PIC_RETRIES = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch a contact's profile picture as base64, pacing each request through the
 * caller's `limiter` and backing off on a server-side throttle.
 *
 * WhatsApp rate-limits picture requests: after a burst of successful fetches it
 * starts refusing the rest, which is why a large address book historically only
 * pulled ~150 photos per run. Pacing the requests and retrying a throttle with
 * exponential backoff lets far more contacts through before the run finishes.
 */
export async function downloadFile(
  client: Client,
  whatsappId: string,
  limiter: RateLimiter
): Promise<Base64 | null> {
  let photoUrl: string | null = null;

  for (let attempt = 0; attempt <= MAX_PROFILE_PIC_RETRIES; attempt++) {
    await limiter.removeTokens(1);

    let result: ProfilePicResult;
    try {
      result = await resolveProfilePicUrl(client, whatsappId);
    } catch (e) {
      logger.error(`Failed to resolve profile picture for ${whatsappId}: ${(e as Error)?.message}`);
      return null;
    }

    if (result.status === "ok") {
      photoUrl = result.url;
      break;
    }
    if (result.status === "throttled" && attempt < MAX_PROFILE_PIC_RETRIES) {
      const backoff = 1000 * 2 ** attempt; // 1s, 2s, 4s
      logger.debug(`[sync] profile-pic throttled for ${whatsappId} (code=${result.code}); backing off ${backoff}ms`);
      await sleep(backoff);
      continue;
    }
    if (result.status === "throttled")
      logger.debug(`[sync] profile-pic still throttled for ${whatsappId} after ${MAX_PROFILE_PIC_RETRIES} retries; skipping`);
    return null; // none / unresolved / throttle that outlasted our retries
  }

  if (!photoUrl) return null;

  // Guard the download: a single malformed/expired URL must not throw out of
  // the un-awaited initSync and abort the whole run.
  try {
    const image = await MessageMedia.fromUrl(photoUrl);
    return image.data;
  } catch (e) {
    logger.error(`Failed to download profile picture for ${whatsappId}: ${(e as Error)?.message}`);
    return null;
  }
}
