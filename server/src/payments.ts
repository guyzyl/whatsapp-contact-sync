import Redis from "ioredis";
import { isProd } from "../main";

const coffeeToken = process.env.COFFEE_TOKEN;
const expires = 60 * 60 * 24 * 31; // 31 Days
const emailRegex =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

let redisClient: Redis;
if (isProd || process.env.REDIS_URL)
  redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

async function queryPurchases() {
  const response = await fetch(
    "https://developers.buymeacoffee.com/api/v1/supporters",
    { headers: { Authorization: `Bearer ${coffeeToken}` } }
  );

  const json = await response.json();
  const ThreeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

  for (const purchase of json.data) {
    if (Date.parse(purchase.support_created_on) > ThreeDaysAgo) {
      await recordPurchase(purchase.payer_email, purchase.support_id);
    }
  }
}

async function recordPurchase(customerId: string, purhcaseId: string) {
  await redisClient.set(customerId, purhcaseId, "EX", expires);
}

export async function checkPurchase(customerId: string): Promise<boolean> {
  if (!emailRegex.test(customerId)) return false;
  await queryPurchases();
  const purchaseId = await redisClient.get(customerId);
  return purchaseId !== null;
}