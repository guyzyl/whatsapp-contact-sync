import { WebSocket } from "ws";

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
  token: object
) {
  const gAuth = googleLogin(token);

  sendEvent(ws, EventType.Redirect, "/sync");

  // Syncing the contacts off Google happens here and not directly in
  //  gapi.ts since we need the gAuth client again for updating the photos.
  const googleContacts = await listContacts(gAuth);
  const whatsappContacts = session.whatsappContacts;

  var syncCount = 0;
  var photo: string | null = null;

  for (const [index, googleContact] of googleContacts.entries()) {
    for (const phoneNumber of googleContact.numbers) {
      const whatsappContact = whatsappContacts.find((contact) =>
        contact.numbers.includes(phoneNumber)
      );
      if (!whatsappContact) {
        continue;
      }

      /*
        This is done synchornously since Google API has a limit on 60 photo uploads
        per minute per user, and that's the easies way to enfore it.
      */
      photo = await downloadFile(whatsappClient, whatsappContact.id);
      if (photo === null) {
        break;
      }
      await updateContactPhoto(gAuth, googleContact.id, photo);
      syncCount++;

      break;
    }

    sendEvent(ws, EventType.SyncProgress, {
      progress: (index / googleContacts.length) * 100,
      syncCount: syncCount,
      image: photo,
    });
    photo = null;
  }

  sendEvent(ws, EventType.SyncProgress, {
    progress: 100,
    syncCount: syncCount,
  });
}
