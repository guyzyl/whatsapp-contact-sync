import { Event, EventType } from "../../../interfaces/api";
import { HandlerFunction } from "../types";
import { Deferred } from "../deferred";

const errorTimeout = 3 * 1000;

export let WS: WebSocket;
export const isWsReady: Deferred<boolean> = new Deferred();
let eventHandlers: { [eventType: string]: HandlerFunction } = {};

export async function initWs(): Promise<void> {
  if (WS && WS.readyState) {
    return;
  }

  // An empty request is made to the server because without it on the first connection
  //  the websocket receives a different session id, causing the app to hang.
  await fetch("/api/", { credentials: "include" });
  const wsType = location.protocol === "https:" ? "wss" : "ws";
  WS = new WebSocket(`${wsType}://${location.host}/api/ws`);

  WS.onopen = (wsEvent) => {
    isWsReady.resolve(true);
  };

  WS.onerror = (wsEvent) => {
    console.error(`[WEB] WS error:`, wsEvent);
    setTimeout(() => {
      initWs();
    }, errorTimeout);
  };

  WS.onmessage = messageHandler;
}

async function messageHandler(wsEvent: MessageEvent): Promise<void> {
  const event: Event = JSON.parse(wsEvent.data);

  if (event.type in eventHandlers) {
    const func: HandlerFunction = eventHandlers[event.type];
    func(event.data);
  } else {
    console.error(`[WEB] No event handler for ${event.type}`, event.type);
  }
}

export function addHandler(eventType: EventType, func: HandlerFunction): void {
  const eventTypeString = eventType;
  eventHandlers[eventTypeString] = func;
}

export function sendEvent(eventType: EventType, data: any = null): void {
  const event: Event = { type: eventType, data };

  if (!WS) return;

  WS.send(JSON.stringify(event));
}
