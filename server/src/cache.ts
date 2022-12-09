import LRU from "lru-cache";

export let sessionCache: LRU<string, object> = new LRU({
  max: 1024,
  ttl: 3 * 60 * 60 * 1000,
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
