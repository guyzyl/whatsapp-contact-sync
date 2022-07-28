// TODO: Replace with WebHooks
import { WebSocket } from "ws";

import {
  Event,
  EventType,
  Notification,
  NotificationType,
} from "../../interfaces/api";

export function sendEvent(
  ws: WebSocket,
  eventType: EventType,
  data: any
): void {
  const event: Event = {
    type: eventType,
    data: data,
  };

  ws.send(JSON.stringify(event));
}

export function sendNotification(
  ws: WebSocket,
  type: NotificationType,
  message: string
): void {
  const notification: Notification = {
    type: type,
    message: message,
  };

  sendEvent(ws, EventType.Notification, notification);
}
