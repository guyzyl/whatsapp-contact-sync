import { WebSocket } from "ws";

import { Client, MessageMedia } from "whatsapp-web.js";

import { sendEvent, sendNotification } from "./ws";
import { ServerSession, Base64 } from "./types";
import { SimpleContact } from "./interfaces";
import { EventType, NotificationType } from "../../interfaces/api";

export function initWhatsApp(ws: WebSocket, session: ServerSession): Client {
  const client = new Client({});

  client.on("qr", (qr: string) => {
    sendEvent(ws, EventType.WhatsAppQR, qr);
  });

  client.on("ready", async () => {
    sendNotification(
      ws,
      NotificationType.Info,
      "WhatsApp connected successfully"
    );

    const contacts = await loadContacts(client);
    session.whatsappContacts = contacts;
    session.save();

    sendEvent(ws, EventType.Redirect, "/gauth");
  });

  client.on("auth_failure", (msg) => {});

  client.initialize();
  return client;
}

async function loadContacts(client: Client): Promise<Array<SimpleContact>> {
  var simpleContacts: Array<SimpleContact> = [];

  const contacts = await client.getContacts();

  for (const contact of contacts) {
    if (
      // For some reason the isMyContact property wasn't working during testing, so removed it.
      contact.isMe === true ||
      contact.isGroup === true ||
      contact.number === null
    ) {
      continue;
    }

    const simpleContact: SimpleContact = {
      id: contact.id._serialized,
      numbers: [contact.number],
      name: contact.name,
      // whatsappPhotoUrl: photoUrl,
    };

    simpleContacts.push(simpleContact);
  }

  return simpleContacts;
}

export async function downloadFile(
  client: Client,
  whatsappId: string
): Promise<Base64 | null> {
  const photoUrl = await client.getProfilePicUrl(whatsappId);
  if (!photoUrl) {
    console.debug("No photo found for", whatsappId);
    return null;
  }

  const image = await MessageMedia.fromUrl(photoUrl);
  return image.data;
}
