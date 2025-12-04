import express from "express";
import { Request, Response } from "express";
import WebSocket from "ws";
// @ts-ignore
import patch from "express-ws/lib/add-ws-method";

import { WAState } from "whatsapp-web.js";

import { SessionStatus, SyncOptions } from "../../interfaces/api";
import { initWhatsApp } from "../src/whatsapp";
import { initSync } from "../src/sync";
import { googleLogin } from "../src/gapi";
import { deleteFromCache, getFromCache, setInCache } from "../src/cache";
import { enforcePayments } from "../main";
import { checkPurchase } from "../src/payments";

// Based on https://github.com/HenningM/express-ws/issues/86
patch(express.Router);
const router = express.Router({ mergeParams: true });

function cleanup(sessionID: string) {
  /*
    Cleanup the session and client objects.
    This is done with a timeout to prevent cleanup on websocket disconnect
      and re-connect (for example, during a page refresh).
  */
  const timeout = setTimeout(async () => {
    if (getFromCache(sessionID, "whatsapp") !== undefined) {
      try {
        const client = getFromCache(sessionID, "whatsapp");
        deleteFromCache(sessionID, "whatsapp");
        client.destroy();
      } catch (e) {}
    }

    deleteFromCache(sessionID, "gauth");
    deleteFromCache(sessionID, "ws");
  }, 5 * 60 * 1000); // 5 minutes.

  setInCache(sessionID, "cleanup", timeout);
}

router.get("/", (req: Request, res: Response) => {
  res.send("{}");
});

router.ws("/ws", (ws: WebSocket, req: Request) => {
  if (getFromCache(req.sessionID, "cleanup") !== undefined) {
    clearTimeout(getFromCache(req.sessionID, "cleanup"));
    deleteFromCache(req.sessionID, "cleanup");
  }

  ws.addEventListener("close", () => cleanup(req.sessionID));
  setInCache(req.sessionID, "ws", ws);
});

// Used by route guard
router.get("/status", async (req: Request, res: Response) => {
  let whatsappConnected = false;
  try {
    whatsappConnected =
      (await getFromCache(req.sessionID, "whatsapp")?.getState()) ===
      WAState.CONNECTED;
  } catch {}

  const status: SessionStatus = {
    whatsappConnected,
    googleConnected: getFromCache(req.sessionID, "gauth") !== undefined,
    enforcePayments,
    purchased: enforcePayments
      ? getFromCache(req.sessionID, "purchased")
      : true,
  };

  res.send(status);
});

router.get("/init_whatsapp", async (req: Request, res: Response) => {
  if (getFromCache(req.sessionID, "whatsapp") !== undefined)
    try {
      const client = getFromCache(req.sessionID, "whatsapp");
      deleteFromCache(req.sessionID, "whatsapp");
      client.destroy();
    } catch (e) {}

  const client = initWhatsApp(req.sessionID);
  setInCache(req.sessionID, "whatsapp", client);
  res.send("{}");
});

router.post("/init_gapi", (req: Request, res: Response) => {
  const token = req.body.token;
  const gAuth = googleLogin(token);
  setInCache(req.sessionID, "gauth", gAuth);
  res.redirect("/options");
});

router.get("/init_sync", (req: Request, res: Response) => {
  initSync(req.sessionID, req.query as SyncOptions);
  res.send("{}");
});

router.post("/check_purchase", async (req: Request, res: Response) => {
  const email = req.body.email;
  const purchased = await checkPurchase(email);
  setInCache(req.sessionID, "purchased", purchased);
  setInCache(req.sessionID, "email", email);
  res.send({ purchased });
});

export default router;
