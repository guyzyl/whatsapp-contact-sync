import { Event, EventType } from "../../../interfaces/api";
import { HandlerFunction } from "../types";

export let WS: WebSocket;
let eventHandlers: { [eventType: string]: HandlerFunction } = {};

export async function initWs(): Promise<void> {
  if (WS && [WebSocket.OPEN, WebSocket.CONNECTING].includes(WS.readyState)) {
    return;
  }

  // An empty request is made to the server because without it on the first connection
  //  the websocket receives a different session id, causing the app to hang.
  await fetch("/api/", { credentials: "include" });
  const wsType = location.protocol === "https:" ? "wss" : "ws";
  WS = new WebSocket(`${wsType}://${location.host}/api/ws`);

  WS.onopen = (wsEvent) => {
    console.log(`WS connected to server - ${wsEvent}`);
  };

  WS.onmessage = messageHandler;
}

async function messageHandler(wsEvent: MessageEvent): Promise<void> {
  const event: Event = JSON.parse(wsEvent.data);

  if (event.type in eventHandlers) {
    const func: HandlerFunction = eventHandlers[event.type];
    func(event.data);
  } else {
    console.error(`No event handler for ${event.type}`);
  }
}

export function addHandler(eventType: EventType, func: HandlerFunction): void {
  const eventTypeString = eventType;
  eventHandlers[eventTypeString] = func;
}
