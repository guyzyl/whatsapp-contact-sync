import { WebSocket } from "ws";
const { AuthClient } = require("googleapis");
import { Client } from "whatsapp-web.js";

import { EventType } from "../../interfaces/api";
import { listContacts, updateContactPhoto } from "./gapi";
import { downloadFile, loadContacts } from "./whatsapp";
import { sendEvent } from "./ws";

// Split into 2 API calls
export async function initSync(
  ws: WebSocket,
  whatsappClient: Client,
  gAuth: typeof AuthClient
) {
  // Syncing the contacts off Google happens here and not directly in
  //  gapi.ts since we need the gAuth client again for updating the photos.
  const googleContacts = await listContacts(gAuth);
  const whatsappContacts = await loadContacts(whatsappClient)!;

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
