import { RedisStringsHandler } from "@trieb.work/nextjs-turbo-redis-cache";

let cachedHandler;

export default class CustomizedCacheHandler {
  constructor() {
    if (!cachedHandler) {
      cachedHandler = new RedisStringsHandler({
        redisUrl: process.env.REDIS_URL,
        socketOptions: {
          tls: true,
          rejectUnauthorized: false, // Only use this if you want to skip certificate validation
        },
      });
    }
  }

  get(...args) {
    return cachedHandler.get(...args);
  }

  set(...args) {
    return cachedHandler.set(...args);
  }

  revalidateTag(...args) {
    return cachedHandler.revalidateTag(...args);
  }

  resetRequestCache(...args) {
    return cachedHandler.resetRequestCache(...args);
  }
}
