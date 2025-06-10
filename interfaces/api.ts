export enum EventType {
  WhatsAppQR = "whatsapp_qr",
  WhatsAppConnecting = "whatsapp_connecting",
  Redirect = "redirect",
  SyncProgress = "sync_progress",
  SyncConfirm = "sync_confirm",
  SyncPhotoConfirm = "sync_photo_confirm",
}

export interface Event {
  type: EventType;
  data: any;
}

export interface SyncProgress {
  progress: number;
  syncCount: number;
  totalContacts?: number;
  image?: string;
  error?: string;
  isManualSync?: boolean;
}

export interface SessionStatus {
  whatsappConnected: boolean;
  googleConnected: boolean;
  enforcePayments: boolean;
  purchased: boolean;
}

export interface SyncOptions {
  overwrite_photos?: string; // "true" or "false" (since converted to string via query params)
  manual_sync?: string; // "true" or "false" (since converted to string via query params)
}
