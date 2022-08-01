import { WebSocket } from "ws";

import { Event, EventType } from "../../interfaces/api";

export function sendEvent(
  ws: WebSocket,
  eventType: EventType,
  data: any
): void {
  const event: Event = {
    type: eventType,
    data: data,
  };

  if (!ws) return;
  ws.send(JSON.stringify(event));
}
