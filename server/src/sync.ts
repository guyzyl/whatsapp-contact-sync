import { WebSocket } from "ws";

import { EventType } from "../../interfaces/api";

import { ServerSession } from "./types";
import { googleLogin, listContacts, updateContactPicture } from "./gapi";
import { downloadFile } from "./whatsapp";
import { sendEvent } from "./ws";
import { Client } from "whatsapp-web.js";

export async function initSync(
  ws: WebSocket,
  whatsappClient: Client,
  session: ServerSession,
  token: object
) {
  const gAuth = googleLogin(token);

  sendEvent(ws, EventType.Redirect, "/sync");

  // Syncing the contacts off Google happens here and not directly in
  //  gapi.ts since we need the gAuth client again for updating the photos.
  const googleContacts = await listContacts(gAuth);
  const whatsappContacts = session.whatsappContacts;

  for (const googleContact of googleContacts) {
    for (const phoneNumber of googleContact.numbers) {
      const whatsappContact = whatsappContacts.find((contact) =>
        contact.numbers.includes(phoneNumber)
      );
      if (!whatsappContact || !whatsappContact.whatsappPhotoUrl) {
        continue;
      }

      console.log("Found a match!:", whatsappContact.name);
      const picture = await downloadFile(whatsappClient, whatsappContact.id);
      updateContactPicture(gAuth, googleContact.id, picture);

      break;
    }
  }
}
