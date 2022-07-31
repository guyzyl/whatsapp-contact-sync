// TODO: Convert all to imports;
const cors = require("cors");
const express = require("express");
import { Response } from "express";
const expressWs = require("express-ws");
import { WebSocket } from "ws";
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
import Semaphore from "semaphore-async-await";

import { Client } from "whatsapp-web.js";

const { initWhatsApp } = require("./whatsapp");
import { initSync } from "./sync";
import { SessionRequest } from "./types";

const dotenv = require("dotenv");
dotenv.config();

var ews = expressWs(express());
const app = ews.app;
const port = process.env.PORT || 8080;

// A request "rate limiter" to avoid 429 - Too Many Requests error from gapi.
// TODO: Check if this can be increased.
const gapiSemaphore = new Semaphore(3);

/*
  Setup the session and cookie parser.
  Based on - https://stackoverflow.com/a/55597997/1403643
*/
app.use(
  cors({
    origin: [process.env.ORIGIN], //frontend server localhost:8080
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // enable set cookie
  })
);

app.use(bodyParser.json());
app.use(cookieParser("helloworld"));
app.use(
  session({
    secret: "helloworld", // TODO: Replace
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: false,
      secure: false, // for normal http connection if https is there we have to set it to true
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

/*
  Session id to objects mapping (since they cant be stored in session directly).
  TODO: Have some kind of cleanup for this.
*/
var wsMap: { [id: string]: WebSocket } = {};
var whatsappClientMap: { [id: string]: Client } = {};

/*
  Setup the routes.
*/

app.ws("/ws", (ws: WebSocket, req: SessionRequest) => {
  console.log(req.sessionID); // TODO: Remove this
  const session = req.session;
  wsMap[req.sessionID] = ws;
});

// An "empty" route to make sure a session is created before opening the ws connection.
app.get("/init_session", (req: SessionRequest, res: Response) => {
  console.log(req.sessionID); // TODO: Remove this
  const session = req.session;
  session.exists = true;
  res.send("{}");
});

app.get("/init_whatsapp", (req: SessionRequest, res: Response) => {
  console.log(req.sessionID); // TODO: Remove this
  const client = initWhatsApp(wsMap[req.sessionID], req.session);
  whatsappClientMap[req.sessionID] = client;
  res.send("{}");
});

app.post("/init_sync", (req: SessionRequest, res: Response) => {
  console.log(req.sessionID); // TODO: Remove this
  var session = req.session;
  const token = req.body.token;
  // TODO: Add error checking;
  initSync(
    wsMap[req.sessionID],
    whatsappClientMap[req.sessionID],
    session,
    gapiSemaphore,
    token
  );
  res.send("{}");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
