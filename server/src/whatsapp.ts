const { Client, MessageMedia } = require("whatsapp-web.js");
import { sendEvent, sendNotification } from "./ws";
import {
  EventType,
  NotificationType,
  WhatsAppContact,
} from "../../interfaces/api";

export function initWhatsApp(ws, session): void {
  const client = new Client({});

  client.on("qr", (qr) => {
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

function loadContacts(client: typeof Client): Array<WhatsAppContact> {
  var contacts: Array<WhatsAppContact> = [];

  client.getContacts().then((contacts) => {
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
    }
  });

  return contacts;
}
