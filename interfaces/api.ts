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

export interface SessionStatus {
  whatsappConnected: boolean;
  googleConnected: boolean;
}

export interface SyncOptions {
  overwrite_photos?: string; // "true" or "false" (since converted to string via query params)
}
