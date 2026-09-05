import {
  Client,
  Contact,
  MessageMedia,
  RemoteWebCacheOptions,
} from "whatsapp-web.js";

import { sendEvent } from "./ws";
import { Base64 } from "./types";
import { EventType } from "../../interfaces/api";
import { deleteFromCache, getFromCache } from "./cache";
import { verifyPurchaseWAId } from "./payments";
import { toE164Digits } from "./phone";

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

    let verified: boolean;
    try {
      verified = await verifyPurchaseWAId(email, client.info.wid.user);
    } catch (e) {
      console.error("Purchase verification failed during WhatsApp authorization:",
        e instanceof Error ? e.message : "Unknown error");
      deleteFromCache(id, "whatsapp");
      deleteFromCache(id, "purchased");
      await client.destroy().catch(() => {});
      sendEvent(ws, EventType.Redirect, "/contribute?show_error=verification");
      return;
    }

    if (verified) {
      sendEvent(ws, EventType.Redirect, "/gauth");
    } else {
      deleteFromCache(id, "whatsapp");
      deleteFromCache(id, "purchased");
      try {
        await client.destroy();
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

  return contactsMap;
}

/**
 * Resolve a contact's profile-picture URL.
 *
 * whatsapp-web.js's `client.getProfilePicUrl()` passes an internal *chat* to
 * WhatsApp's `requestProfilePicFromServer`. For a contact you have no open chat
 * with — the majority of an address book — that chat is `null`, and the bridge
 * throws while reading it, so the vast majority of contacts fail to resolve.
 *
 * Instead we resolve a proper Contact model (which every address-book contact
 * has) and pass that, falling back to a chat and finally the raw wid. Returns
 * the URL, `null` when the contact has no picture (or it's hidden by privacy),
 * or `null` if none of the strategies could resolve it.
 */
async function resolveProfilePicUrl(
  client: Client,
  contactId: string
): Promise<string | null> {
  return await (client as any).pupPage.evaluate(async (contactId: string) => {
    const req = (globalThis as any).require;
    const bridge = req("WAWebContactProfilePicThumbBridge");
    const collections = req("WAWebCollections");
    const wid = req("WAWebWidFactory").createWid(contactId);

    // undefined => strategy unusable, try the next one.
    // null       => resolved, but there is no picture (stop).
    // string     => the picture URL (stop).
    const attempt = async (target: any): Promise<string | null | undefined> => {
      if (!target) return undefined;
      try {
        const pic = await bridge.requestProfilePicFromServer(target);
        return pic && pic.eurl ? pic.eurl : null;
      } catch (e: any) {
        if (e && e.name === "ServerStatusCodeError") return null; // no picture / hidden
        return undefined; // unusable target — fall through to the next strategy
      }
    };

    let result = await attempt(collections.Contact.get(wid));
    if (result === undefined) result = await attempt(collections.Chat.get(wid));
    if (result === undefined) result = await attempt(wid);
    return result ?? null;
  }, contactId);
}

export async function downloadFile(
  client: Client,
  whatsappId: string
): Promise<Base64 | null> {
  let photoUrl: string | null;
  try {
    photoUrl = await resolveProfilePicUrl(client, whatsappId);
  } catch (e) {
    console.error(`Failed to resolve profile picture for ${whatsappId}:`, (e as Error)?.message);
    return null;
  }
  if (!photoUrl) return null;

  // Guard the download: a single malformed/expired URL must not throw out of
  // the un-awaited initSync and abort the whole run.
  try {
    const image = await MessageMedia.fromUrl(photoUrl);
    return image.data;
  } catch (e) {
    console.error(`Failed to download profile picture for ${whatsappId}:`, (e as Error)?.message);
    return null;
  }
}
