import { Client, Contact, MessageMedia } from "whatsapp-web.js";
import makeWASocket, { ConnectionState } from "@whiskeysockets/baileys";

import { sendEvent } from "./ws";
import { Base64 } from "./types";
import { EventType } from "../../interfaces/api";
import { getFromCache } from "./cache";

const clientOptions = {
  puppeteer: {
    executablePath:
      process.env.RUNNING_IN_DOCKER === "true"
        ? "/usr/bin/chromium-browser"
        : undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  },
};

export function initWhatsApp(id: string): void {
  const waSock = makeWASocket({
    markOnlineOnConnect: false,
    syncFullHistory: false,
    // fireInitQueries: false,
    printQRInTerminal: true,  // TODO: Remove this test
  });


  waSock.ev.on("connection.update", (conState: Partial<ConnectionState>) => {
    const status = conState.connection;
    const ws = getFromCache(id, "ws");

    if (status === "open" || status === "connecting")
      // sendEvent(ws, EventType.WhatsAppQR, conState.qr);
      console.log(conState.qr);

    // if (status === "connecting") sendEvent(ws, EventType.WhatsAppConnecting);
    if (status === "connecting") console.log("Connecting to WhatsApp...");
    else if (status === "open") console.log("/gauth");
    // else if (status === "open") sendEvent(ws, EventType.Redirect, "/gauth");
    // client.on("auth_failure", (msg) => {});
  });

  waSock.ev.on("contacts.upsert", (contacts: Contact[]) => {

  });

  return waSock;
}

export async function loadContacts(
  client: Client
): Promise<Map<string, string>> {
  const contacts: Contact[] = await client.getContacts();

  const contactsMap: Map<string, string> = new Map();
  contacts.forEach((contact) => {
    if (contact.id.user && contact.id._serialized)
      contactsMap.set(contact.id.user, contact.id._serialized);
  });

  return contactsMap;
}

export async function downloadFile(
  client: Client,
  whatsappId: string
): Promise<Base64 | null> {
  const photoUrl = await client.getProfilePicUrl(whatsappId);
  if (!photoUrl) return null;

  const image = await MessageMedia.fromUrl(photoUrl);
  return image.data;
}
