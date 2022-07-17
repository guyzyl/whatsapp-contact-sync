import { Request } from "express";
import { Session } from "express-session";
import { WhatsAppContact } from "../../interfaces/api";

export type ServerSession = Session & {
  exists: boolean;
  whatsappContacts: Array<WhatsAppContact>;
};

export type SessionRequest = Request & {
  session: ServerSession;
  sessionID: string;
};
