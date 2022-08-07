import cors from "cors";
const express = require("express");
import { Response } from "express";
const expressWs = require("express-ws");
import { WebSocket } from "ws";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";

const { AuthClient } = require("googleapis");
import { Client } from "whatsapp-web.js";

const winston = require("winston");
const expressWinston = require("express-winston");

import { initWhatsApp } from "./whatsapp";
import { initSync } from "./sync";
import { SessionRequest } from "./types";
import { googleLogin } from "./gapi";

import dotenv from "dotenv";
dotenv.config();

var ews = expressWs(express());
const app = ews.app;
var router = express.Router({ mergeParams: true });
const port = process.env.SERVER_PORT || 8080;

/*
  Setup the session and cookie parser.
  Based on - https://stackoverflow.com/a/55597997/1403643
*/
app.use(
  cors({
    origin: [process.env.ORIGIN || "http://localhost:8080"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // enable set cookie
  })
);

const secret = process.env.SESSION_SECRET || "secret";
app.use(bodyParser.json());
app.use(cookieParser(secret));
app.use(
  session({
    secret: secret,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: false,
      secure: process.env.NODE_ENV == "production" ? true : false,
    },
    resave: false,
    saveUninitialized: true,
  })
);

app.use(function (req: SessionRequest, res: Response, next: CallableFunction) {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-   Type, Accept, Authorization"
  );
  next();
});

if (process.env.NODE_ENV == "production") {
  app.set("trust proxy", 1);
}

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    ),
    expressFormat: true,
    colorize: false,
  })
);

// To fix 304 responses.
app.disable("etag");

/*
  Session id to objects mapping (since they cant be stored in session directly).
*/
var wsMap: { [id: string]: WebSocket } = {};
var whatsappClientMap: { [id: string]: Client } = {};
var googleAuthMap: { [id: string]: typeof AuthClient } = {};
var cleanupMap: { [id: string]: ReturnType<typeof setTimeout> } = {};

function cleanup(sessionID: string) {
  /*
    Cleanup the session and client objects.
    This is done with a timeout to prevent cleanup on websocket disconnect
      and re-connect (for example, during a page refresh).
  */
  const timeout = setTimeout(async () => {
    if (whatsappClientMap[sessionID] !== undefined) {
      await whatsappClientMap[sessionID].logout();
      await whatsappClientMap[sessionID].destroy();
    }

    delete whatsappClientMap[sessionID];
    delete googleAuthMap[sessionID];
    delete wsMap[sessionID];
  }, 30 * 1000);

  cleanupMap[sessionID] = timeout;
}

/*
  Setup the routes.
*/

router.ws("/ws", (ws: WebSocket, req: SessionRequest) => {
  if (cleanupMap[req.sessionID] !== undefined) {
    clearTimeout(cleanupMap[req.sessionID]);
    delete cleanupMap[req.sessionID];
  }

  ws.addEventListener("close", () => cleanup(req.sessionID));
  wsMap[req.sessionID] = ws;
});

// This can possibly be removed.
router.get("/init_session", (req: SessionRequest, res: Response) => {
  const session = req.session;
  session.exists = true;
  res.send("{}");
});

router.get("/init_whatsapp", (req: SessionRequest, res: Response) => {
  const client = initWhatsApp(wsMap[req.sessionID]);
  whatsappClientMap[req.sessionID] = client;
  res.send("{}");
});

router.post("/init_gapi", (req: SessionRequest, res: Response) => {
  const token = req.body.token;
  const gAuth = googleLogin(token);
  googleAuthMap[req.sessionID] = gAuth;
  res.redirect("/sync");
});

router.get("/init_sync", (req: SessionRequest, res: Response) => {
  initSync(
    wsMap[req.sessionID],
    whatsappClientMap[req.sessionID],
    googleAuthMap[req.sessionID]
  );
  res.send("{}");
});

const routePrefix = process.env.ROUTE_PREFIX || "";
app.use(routePrefix, router);
app.listen(port, "localhost", () => {
  console.log(`Listening on port ${port}`);
});
