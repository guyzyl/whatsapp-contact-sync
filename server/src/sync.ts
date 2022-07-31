import { WebSocket } from "ws";
import Semaphore from "semaphore-async-await";

import { EventType } from "../../interfaces/api";
import { ServerSession } from "./types";
import { googleLogin, listContacts, updateContactPhoto } from "./gapi";
import { downloadFile } from "./whatsapp";
import { sendEvent } from "./ws";
import { Client } from "whatsapp-web.js";

export async function initSync(
  ws: WebSocket,
  whatsappClient: Client,
  session: ServerSession,
  gapiSemaphore: Semaphore,
  token: object
) {
  const gAuth = googleLogin(token);

  sendEvent(ws, EventType.Redirect, "/sync");

  // Syncing the contacts off Google happens here and not directly in
  //  gapi.ts since we need the gAuth client again for updating the photos.
  const googleContacts = await listContacts(gAuth);
  const whatsappContacts = session.whatsappContacts;

  var i = 0; // TODO: Remove
  for (const googleContact of googleContacts) {
    for (const phoneNumber of googleContact.numbers) {
      const whatsappContact = whatsappContacts.find((contact) =>
        contact.numbers.includes(phoneNumber)
      );
      if (!whatsappContact) {
        continue;
      }

      console.log("Found a match!:", whatsappContact); // TODO: Remove
      downloadFile(whatsappClient, whatsappContact.id).then(async (photo) => {
        if (photo !== null) {
          await gapiSemaphore.wait();
          await updateContactPhoto(gAuth, googleContact.id, photo);
          gapiSemaphore.signal();
        }
      });

      // TODO: Remove
      i++;
      if (i > 5) {
        return;
      }

      break;
    }
  }
}
