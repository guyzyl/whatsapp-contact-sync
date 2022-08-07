import express from "express";
import { Request, Response } from "express";
import { WebSocket } from "ws";
// @ts-ignore
import patch from "express-ws/lib/add-ws-method";

import { Auth } from "googleapis";
import { Client, WAState } from "whatsapp-web.js";

import { SessionStatus } from "../../interfaces/api";
import { initWhatsApp } from "../src/whatsapp";
import { initSync } from "../src/sync";
import { googleLogin } from "../src/gapi";

// Based on https://github.com/HenningM/express-ws/issues/86
patch(express.Router);
const router = express.Router({ mergeParams: true });

/*
  Session id to objects mapping (since they cant be stored in session directly).
*/
let wsMap: { [id: string]: WebSocket } = {};
let whatsappClientMap: { [id: string]: Client } = {};
let googleAuthMap: { [id: string]: Auth.OAuth2Client } = {};
let cleanupMap: { [id: string]: ReturnType<typeof setTimeout> } = {};

function cleanup(sessionID: string) {
  /*
    Cleanup the session and client objects.
    This is done with a timeout to prevent cleanup on websocket disconnect
      and re-connect (for example, during a page refresh).
  */
  const timeout = setTimeout(async () => {
    if (whatsappClientMap[sessionID] !== undefined) {
      try {
        await whatsappClientMap[sessionID].logout();
        await whatsappClientMap[sessionID].destroy();
      } catch (e) {}
    }

    delete whatsappClientMap[sessionID];
    delete googleAuthMap[sessionID];
    delete wsMap[sessionID];
  }, 30 * 1000);

  cleanupMap[sessionID] = timeout;
}

router.get("/", (req: Request, res: Response) => {
  res.send("{}");
});

router.ws("/ws", (ws: WebSocket, req: Request) => {
  if (cleanupMap[req.sessionID] !== undefined) {
    clearTimeout(cleanupMap[req.sessionID]);
    delete cleanupMap[req.sessionID];
  }

  ws.addEventListener("close", () => cleanup(req.sessionID));
  wsMap[req.sessionID] = ws;
});

// Used by route guard
router.get("/status", async (req: Request, res: Response) => {
  const status: SessionStatus = {
    whatsappConnected:
      whatsappClientMap[req.sessionID] !== undefined &&
      (await whatsappClientMap[req.sessionID].getState()) === WAState.CONNECTED,
    googleConnected: googleAuthMap[req.sessionID] !== undefined,
  };

  res.send(status);
});

router.get("/init_whatsapp", async (req: Request, res: Response) => {
  if (whatsappClientMap[req.sessionID] !== undefined)
    try {
      await whatsappClientMap[req.sessionID].destroy();
    } catch (e) {}

  const client = initWhatsApp(wsMap[req.sessionID]);
  whatsappClientMap[req.sessionID] = client;
  res.send("{}");
});

router.post("/init_gapi", (req: Request, res: Response) => {
  const token = req.body.token;
  const gAuth = googleLogin(token);
  googleAuthMap[req.sessionID] = gAuth;
  res.redirect("/sync");
});

router.get("/init_sync", (req: Request, res: Response) => {
  initSync(
    wsMap[req.sessionID],
    whatsappClientMap[req.sessionID],
    googleAuthMap[req.sessionID]
  );
  res.send("{}");
});

export default router;
