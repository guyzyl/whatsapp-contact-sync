export enum EventType {
  WhatsAppQR = "whatsapp_qr",
  Notification = "notification",
  Redirect = "redirect",
}

export enum NotificationType {
  Info = "alert-info",
}

export interface Event {
  type: EventType;
  data: any;
}

export interface Notification {
  type: NotificationType;
  message: string;
}

// TODO: Move, doesn't belong here
export interface WhatsAppContact {
  whatsappId: object;
  number: BigInt;
  name: string;
  photoUrl: string;
}
