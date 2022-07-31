export enum EventType {
  WhatsAppQR = "whatsapp_qr",
  Redirect = "redirect",
}

export interface Event {
  type: EventType;
  data: any;
}
