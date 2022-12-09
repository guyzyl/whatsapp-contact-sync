import express from "express";
import { Request, Response } from "express";
import { WebSocket } from "ws";
// @ts-ignore
import patch from "express-ws/lib/add-ws-method";

import { WAState } from "whatsapp-web.js";

import { SessionStatus, SyncOptions } from "../../interfaces/api";
import { initWhatsApp } from "../src/whatsapp";
import { initSync } from "../src/sync";
import { googleLogin } from "../src/gapi";
import { deleteFromCache, getFromCache, setInCache } from "../src/cache";

// Based on https://github.com/HenningM/express-ws/issues/86
patch(express.Router);
const router = express.Router({ mergeParams: true });

router.get("/", (req: Request, res: Response) => {
  res.send("{}");
});

router.ws("/ws", (ws: WebSocket, req: Request) => {
  setInCache(req.sessionID, "ws", ws);
});

// Used by route guard
router.get("/status", async (req: Request, res: Response) => {
  const status: SessionStatus = {
    whatsappConnected:
      (await getFromCache(req.sessionID, "whatsapp")?.getState()) ===
      WAState.CONNECTED,
    googleConnected: getFromCache(req.sessionID, "gauth") !== undefined,
  };

  res.send(status);
});

router.get("/init_whatsapp", async (req: Request, res: Response) => {
  if (getFromCache(req.sessionID, "whatsapp") !== undefined)
    try {
      const client = getFromCache(req.sessionID, "whatsapp");
      deleteFromCache(req.sessionID, "whatsapp");
      client.destroy();
    } catch (e) {
      console.error(e);
    }

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

export default router;
