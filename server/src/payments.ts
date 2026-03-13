import Redis from "ioredis";
import { enforcePayments } from "../main";

const coffeeToken = process.env.COFFEE_TOKEN;
const expires = 60 * 60 * 24 * 31; // 31 Days
const emailRegex =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

let redisClient: Redis;
if (enforcePayments || process.env.REDIS_URL)
  redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
let customerCache: Map<string, string> = new Map();

async function queryCoffeePurchases() {
  const response = await fetch(
    "https://developers.buymeacoffee.com/api/v1/supporters",
    { headers: { Authorization: `Bearer ${coffeeToken}` } },
  );

  let json: any;
  try {
    json = await response.json();
  } catch (e) {
    console.error("[SERVER]", e);
    return;
  }

  const ThreeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  for (const purchase of json.data) {
    if (Date.parse(purchase.support_created_on) > ThreeDaysAgo) {
      await recordPurchase(purchase.payer_email);
    }
  }
}

async function recordPurchase(email: string) {
  if (await queryPurchase(email)) return;

  try {
    await redisClient.set(email, "", "EX", expires);
    customerCache.set(email, "");
  } catch (e) {
    console.error("[SERVER]", e);
  }
}

async function queryPurchase(email: string): Promise<boolean> {
  if (customerCache.has(email)) return true;

  try {
    const WAId = await redisClient.get(email);
    if (WAId !== null) {
      customerCache.set(email, WAId);
      return true;
    }
  } catch (e) {
    console.error("[SERVER]", e);
  }

  return false;
}

export async function verifyPurchaseWAId(email: string, whatsappId: string) {
  if (!enforcePayments) return true;

  if (customerCache.has(email)) {
    const cachedWAId = customerCache.get(email);
    if (cachedWAId !== "") return cachedWAId === whatsappId;
  }

  const queriedWAId = await redisClient.get(email);
  if (queriedWAId === "") {
    const ttl = await redisClient.ttl(email);
    await redisClient.set(email, whatsappId, "EX", ttl);
    customerCache.set(email, whatsappId);
    return true;
  }

  return queriedWAId === whatsappId;
}

export async function checkPurchase(email: string): Promise<boolean> {
  if (!emailRegex.test(email)) return false;
  await queryCoffeePurchases();
  return await queryPurchase(email);
}
