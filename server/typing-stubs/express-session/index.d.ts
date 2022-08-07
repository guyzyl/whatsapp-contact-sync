import session from "express-session";

import { SimpleContact } from "./src/interfaces";

declare module "express-session" {
  export interface SessionData {
    whatsappContacts: Array<SimpleContact>;
  }
}
