import cors from "cors";
const express = require("express");
import { Response } from "express";
const expressWs = require("express-ws");
import { WebSocket } from "ws";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";

import { Client } from "whatsapp-web.js";

import { initWhatsApp } from "./whatsapp";
import { initSync } from "./sync";
import { SessionRequest } from "./types";

import dotenv from "dotenv";
dotenv.config();

var ews = expressWs(express());
const app = ews.app;
const port = process.env.PORT || 8080;

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
      secure: process.env.NODE_ENV == "prod" ? true : false,
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

if (process.env.NODE_ENV == "prod") {
  app.set("trust proxy", 1);
}

/*
  Session id to objects mapping (since they cant be stored in session directly).
*/
var wsMap: { [id: string]: WebSocket } = {};
var whatsappClientMap: { [id: string]: Client } = {};

/*
  Setup the routes.
*/

app.ws("/ws", (ws: WebSocket, req: SessionRequest) => {
  const session = req.session;
  wsMap[req.sessionID] = ws;
});

// An "empty" route to make sure a session is created before opening the ws connection.
app.get("/init_session", (req: SessionRequest, res: Response) => {
  const session = req.session;
  session.exists = true;
  res.send("{}");
});

app.get("/init_whatsapp", (req: SessionRequest, res: Response) => {
  const client = initWhatsApp(wsMap[req.sessionID], req.session);
  whatsappClientMap[req.sessionID] = client;
  res.send("{}");
});

app.post("/init_sync", (req: SessionRequest, res: Response) => {
  var session = req.session;
  const token = req.body.token;
  initSync(
    wsMap[req.sessionID],
    whatsappClientMap[req.sessionID],
    session,
    token
  );
  res.send("{}");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
