import { LRUCache } from "lru-cache";

export enum CacheType {
  WS = "ws",
  WASock = "waSock",
  WAStore = "waStore",
  GAuth = "gauth",
}

export let sessionCache: LRUCache<string, object> = new LRUCache({
  max: 4096,
  ttl: 60 * 60 * 1000,
});

export function getFromCache(id: string, key: string): any {
  return sessionCache.get(`${id}-${key}`);
}

export function setInCache(id: string, key: string, value: any): void {
  sessionCache.set(`${id}-${key}`, value);
}

export function deleteFromCache(id: string, key: string): void {
  sessionCache.delete(`${id}-${key}`);
}

export function isInCache(id: string, key: string): boolean {
  return sessionCache.has(`${id}-${key}`);
}
