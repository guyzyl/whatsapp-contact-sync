import { WebSocket } from "ws";

import { Client, Contact, MessageMedia } from "whatsapp-web.js";

import { sendEvent, sendNotification } from "./ws";
import { ServerSession } from "./types";
import { WhatsAppContact } from "./interfaces";
import { EventType, NotificationType } from "../../interfaces/api";

export function initWhatsApp(ws: WebSocket, session: ServerSession): void {
  const client = new Client({});

  client.on("qr", (qr: string) => {
    sendEvent(ws, EventType.WhatsAppQR, qr);
  });

  client.on("ready", () => {
    sendNotification(
      ws,
      NotificationType.Info,
      "WhatsApp connected successfully"
    );

    const contacts = loadContacts(client);
    session.whatsappContacts = contacts;

    sendEvent(ws, EventType.Redirect, "/gauth");
  });

  client.on("auth_failure", (msg) => {});

  client.initialize();
}

function loadContacts(client: Client): Array<WhatsAppContact> {
  var simpleContacts: Array<WhatsAppContact> = [];

  client.getContacts().then((contacts: Array<Contact>) => {
    for (const contact of contacts) {
      if (
        contact.isMe === true ||
        contact.isGroup === true ||
        contact.isMyContact === false ||
        contact.number === null
      ) {
        continue;
      }

      var photoUrl;
      client.getProfilePicUrl(contact.id._serialized).then((url) => {
        photoUrl = url;
      });

      const simpleContact: WhatsAppContact = {
        whatsappId: contact.id,
        number: contact.number,
        name: contact.name,
        photoUrl: photoUrl,
      };

      simpleContacts.push(simpleContact);
    }
  });

  return simpleContacts;
}
