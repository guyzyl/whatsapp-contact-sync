import { ContactId } from "whatsapp-web.js";

export interface WhatsAppContact {
  whatsappId: ContactId;
  number: string;
  name?: string;
  photoUrl?: string;
}
