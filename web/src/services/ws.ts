import { Event, EventType } from "../../../interfaces/api";

export var WS: WebSocket;
var eventHandlers: { [eventType: string]: Function } = {};

export function initWs(): void {
  fetch("/api/init_session", { credentials: "include" }).then(() => {
    const wsType = location.protocol === "https:" ? "wss" : "ws";
    WS = new WebSocket(`${wsType}://${location.host}/api/ws`);

    WS.onopen = (wsEvent) => {
      console.log(`WS connected to server - ${wsEvent}`);
    };

    WS.onmessage = messageHandler;
  });
}

async function messageHandler(wsEvent: MessageEvent): Promise<void> {
  const event: Event = JSON.parse(wsEvent.data);

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
