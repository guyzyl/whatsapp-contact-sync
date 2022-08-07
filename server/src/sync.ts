import { WebSocket } from "ws";
const { AuthClient } = require("googleapis");
import { RateLimiter } from "limiter";
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
  // The limiter is implemented due to Google API's limit of 60 photo uploads per minute per user
  const limiter = new RateLimiter({ tokensPerInterval: 1, interval: 1000 });

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

      photo = await downloadFile(whatsappClient, whatsappContact.id);
      if (photo === null) {
        break;
      }

      await limiter.removeTokens(1);
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
