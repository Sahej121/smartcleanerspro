import { Redis } from "@upstash/redis";
import { env } from "./env";

let redis;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  // Mock redis for development if not configured
  redis = {
    get: async () => null,
    set: async () => null,
    del: async () => null,
  };
}

export { redis };
