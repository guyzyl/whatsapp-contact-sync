import { Event, EventType } from "../../../interfaces/api";

var WS;
var eventHandlers = {};

export function initWs(): void {
  fetch("/api/init_session", { credentials: "include" }).then(() => {
    WS = new WebSocket("ws://localhost:8080/ws");

    WS.onopen = (rawEvent) => {
      console.log(`WS connected to server - ${rawEvent}`);
    };

    WS.onmessage = messageHandler;
  });
}

async function messageHandler(rawEvent): void {
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

export default WS;
