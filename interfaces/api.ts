export enum EventType {
  WhatsAppQR = "whatsapp_qr",
  Redirect = "redirect",
  SyncProgress = "sync_progress",
}

export interface Event {
  type: EventType;
  data: any;
}

export interface SyncProgress {
  progress: number;
  syncCount: number;
  image?: string;
}
