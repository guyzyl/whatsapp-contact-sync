import { LRUCache } from "lru-cache";

export let sessionCache: LRUCache<string, object> = new LRUCache({
  max: 4096,
  ttl: 60 * 60 * 1000,
  // Slide the expiry window on every read, so sessions that are actively in
  // use don't get dropped after an hour of continuous syncing.
  updateAgeOnGet: true,
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
