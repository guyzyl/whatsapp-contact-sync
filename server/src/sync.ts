import { WebSocket } from "ws";
import { Auth } from "googleapis";
import { RateLimiter } from "limiter";
import { Client } from "whatsapp-web.js";

import { EventType, SyncOptions } from "../../interfaces/api";
import { listContacts, updateContactPhoto } from "./gapi";
import { downloadFile, loadContacts } from "./whatsapp";
import { sendEvent } from "./ws";
import { SimpleContact } from "./interfaces";
import { getFromCache } from "./cache";

export async function initSync(id: string, syncOptions: SyncOptions) {
  // The limiter is implemented due to Google API's limit of 60 photo uploads per minute per user
  const limiter = new RateLimiter({ tokensPerInterval: 1, interval: 1500 });

  const ws: WebSocket = getFromCache(id, "ws");
  const whatsappClient: Client = getFromCache(id, "whatsapp");
  const gAuth: Auth.OAuth2Client = getFromCache(id, "gauth");

  const googleContacts: SimpleContact[] = await listContacts(gAuth);
  const whatsappContacts: Map<string, string> = await loadContacts(
    whatsappClient
  );

  let syncCount: number = 0;
  let photo: string | null = null;

  // For some reason all of the contacts that don't have a photo are at the beggining of the array.
  // This causes the sync to feel slow since no photos show up on the UI.
  // To "fix" this, we shuffle the array so that the contacts without photos are spread out.
  const shuffledGoogleContacts = googleContacts.sort(() => Math.random() - 0.5);

  for (const [index, googleContact] of shuffledGoogleContacts.entries()) {
    if (ws.readyState !== WebSocket.OPEN) return; // Stop sync if user disconnected.

    if (syncOptions.overwrite_photos === "false" && googleContact.hasPhoto)
      continue;

    for (const phoneNumber of googleContact.numbers) {
      const whatsappContactId = whatsappContacts.get(phoneNumber);
      if (!whatsappContactId) continue;

      photo = await downloadFile(whatsappClient, whatsappContactId);
      if (photo === null) break;

      await limiter.removeTokens(1);
      await updateContactPhoto(gAuth, googleContact.id, photo);
      syncCount++;

      break;
    }

    sendEvent(ws, EventType.SyncProgress, {
      progress: (index / googleContacts.length) * 100,
      syncCount: syncCount,
      totalContacts: googleContacts.length,
      image: photo,
    });
    photo = null;
  }

  sendEvent(ws, EventType.SyncProgress, {
    progress: 100,
    syncCount: syncCount,
  });

  ws.close();
}
