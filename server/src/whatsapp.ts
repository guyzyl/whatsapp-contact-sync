import makeWASocket, {
  Browsers,
  Contact,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import axios from "axios";

import { sendEvent } from "./ws";
import { EventType } from "../../interfaces/api";
import { CacheType, getFromCache, setInCache } from "./cache";

const reconnectReasons = [
  DisconnectReason.restartRequired,
  DisconnectReason.connectionClosed,
  DisconnectReason.connectionLost,
  DisconnectReason.timedOut,
];

export async function initWhatsApp(id: string) {
  // TODO: Don't use file storage for auth state, and move outside of this function.
  const { state } = await useMultiFileAuthState("baileys_auth_info");
  const { version } = await fetchLatestBaileysVersion();
  const waSocketOptions = {
    version,
    auth: state,
    browsers: Browsers.windows("chrome"),
  };

  console.log("Got here!"); // TODO: Remove
  const waSock = makeWASocket(waSocketOptions);
  setInCache(id, CacheType.WASock, waSock);

  const store = makeInMemoryStore({});
  store.bind(waSock.ev);
  setInCache(id, CacheType.WAStore, store);

  waSock.ev.on("connection.update", (update) => {
    console.log("connection update", update); // TODO: Delete
    if (update.connection === "close") {
      const status = (update.lastDisconnect?.error as Boom)?.output?.statusCode;
      if (reconnectReasons.includes(status)) {
        console.log("Should reconnect!"); // TODO: Delete
        waSock.ev.removeAllListeners("connection.update");
        initWhatsApp(id);
      }
    } else if (update.connection === "open") {
      console.log("opened connection"); // TODO: Delete
      let ws = getFromCache(id, CacheType.WS);
      sendEvent(ws, EventType.Redirect, "/gauth");
    } else if (update.qr) {
      let ws = getFromCache(id, CacheType.WS);
      sendEvent(ws, EventType.WhatsAppQR, update.qr);
    }
  });

  waSock.ev.on("contacts.upsert", () => {
    console.log("got contacts", Object.values(store.contacts));
  });
}

export async function getContacts(id: string): Promise<Map<string, Contact>> {
  /*
    Get the contacts from the cache.
    We don't do this in the initWhatsApp function because it can take
      a few seconds for the contacts to pushed (contacts.upsert).
  */
  const store = getFromCache(id, CacheType.WAStore);
  return store.contacts;
}

export async function getProfilePic(id: string, waId: string) {
  const waSock: WASocket = getFromCache(id, CacheType.WASock);
  const picUrl = await waSock.profilePictureUrl(waId, "image");
  if (!picUrl) return null;

  const picture = await axios.get(picUrl);
  return picture;
}
