const cors = require("cors");
const express = require("express");
import { Response } from "express";
const expressWs = require("express-ws");
import { WebSocket } from "ws";
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { initWhatsApp } = require("./whatsapp");

import { SessionRequest } from "./types";

var ews = expressWs(express());
const app = ews.app;
const port = process.env.PORT || 8080;

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

app.use(cookieParser("helloworld"));
app.use(
  session({
    secret: "helloworld", // TODO: Replace
    cookie: {
      maxAge: 36000,
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
  Setup WebSockets store.
  Storing to object since they get destoryed when trying to save to the session.
  TODO: Have some kind of cleanup for this.
*/
var wss: { [id: string]: WebSocket } = {};

/*
  Setup the routes.
*/

app.ws("/ws", (ws: WebSocket, req: SessionRequest) => {
  const session = req.session;
  wss[req.sessionID] = ws;
});

app.get("/get_status", (req: SessionRequest, res: Response) => {
  res.send("{}");
});

// An "empty" route to make sure a session is created before opening the ws connection.
app.get("/init_session", (req: SessionRequest, res: Response) => {
  const session = req.session;
  session.exists = true;
  res.send("{}");
});

app.get("/init_whatsapp", (req: SessionRequest, res: Response) => {
  var session = req.session;
  initWhatsApp(wss[req.sessionID], session);
  res.send("{}");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
