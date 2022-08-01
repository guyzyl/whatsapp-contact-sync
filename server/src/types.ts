import { Request } from "express";
import { Session } from "express-session";

import { Client } from "whatsapp-web.js";

import { SimpleContact } from "./interfaces";

export type Base64 = string;

export type ServerSession = Session & {
  exists: boolean;
  whatsappContacts: Array<SimpleContact>;
  whatsappClient: Client;
};

export type SessionRequest = Request & {
  session: ServerSession;
  sessionID: string;
};
