import { WebSocket } from "ws";

import { Event, EventType } from "../../interfaces/api";

export function sendEvent(
  ws: WebSocket,
  eventType: EventType,
  data: any = null,
): void {
  const event: Event = {
    type: eventType,
    data: data,
  };

  if (!ws) return;
  ws.send(JSON.stringify(event));
}

export function sendMessageAndWait(ws: WebSocket, message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const handleMessage = (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed?.type === EventType.SyncPhotoConfirm) {
          ws.off('message', handleMessage);
          resolve(parsed.data);
        }
      } catch (e) {
        // Ignore parse errors
        console.error("Error parsing message while waiting for WS response", e);
      }
    };

    ws.on('message', handleMessage);

    sendEvent(ws, EventType.SyncConfirm, message);

    setTimeout(() => {
      ws.off('message', handleMessage);
      reject(new Error('Timeout waiting for WS response'));
    }, 30000);
  });
}
