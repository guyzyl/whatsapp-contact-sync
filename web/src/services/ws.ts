import { Event, EventType } from "../../../interfaces/api";

export var WS: WebSocket;
var eventHandlers: { [eventType: string]: Function } = {};

export function initWs(): void {
  fetch("/api/init_session", { credentials: "include" }).then(() => {
    const wsType = process.env.NODE_ENV === "prod" ? "wss" : "ws";
    WS = new WebSocket(wsType + "://" + location.host + "/api/ws");

    WS.onopen = (rawEvent) => {
      console.log(`WS connected to server - ${rawEvent}`);
    };

    WS.onmessage = messageHandler;
  });
}

async function messageHandler(rawEvent: MessageEvent): Promise<void> {
  const event: Event = JSON.parse(rawEvent.data);

  if (event.type in eventHandlers) {
    const func = eventHandlers[event.type];
    func(event.data);
  } else {
    console.error(`No event handler for ${event.type}`);
  }
}

export function addHandler(
  eventType: EventType,
  func: (data: any) => void
): void {
  const eventTypeString = eventType;
  eventHandlers[eventTypeString] = func;
}
