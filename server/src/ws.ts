// TODO: Replace with WebHooks
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

  ws.send(JSON.stringify(event));
}
