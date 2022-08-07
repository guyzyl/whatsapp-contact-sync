import { Request } from "express";
import { Session } from "express-session";

import { Client } from "whatsapp-web.js";

import { SimpleContact } from "./interfaces";

export type Base64 = string;

export type ServerSession = Session & {
  whatsappContacts: Array<SimpleContact>;
};

export type SessionRequest = Request & {
  session: ServerSession;
  sessionID: string;
};
