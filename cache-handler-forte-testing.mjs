import { CacheHandler } from "@fortedigital/nextjs-cache-handler";
import createCompositeHandler from "@fortedigital/nextjs-cache-handler/composite";
import createLruHandler from "@fortedigital/nextjs-cache-handler/local-lru";
import createRedisHandler from "@fortedigital/nextjs-cache-handler/redis-strings";
import { PHASE_PRODUCTION_BUILD } from "next/constants.js";
import { createClient } from "redis";

const isSingleConnectionModeEnabled = !!process.env.REDIS_SINGLE_CONNECTION;

async function setupRedisClient() {
  if (PHASE_PRODUCTION_BUILD !== process.env.NEXT_PHASE) {
    try {
      const redisClient = createClient({
        url: process.env.REDIS_URL,
        pingInterval: 10000,
      });

      redisClient.on("error", (e) => {
        if (process.env.NEXT_PRIVATE_DEBUG_CACHE !== undefined) {
          console.warn("Redis error", e);
        }
        if (isSingleConnectionModeEnabled) {
          global.cacheHandlerConfig = null;
          global.cacheHandlerConfigPromise = null;
        }
      });

      console.info("Connecting Redis client...");
      await redisClient.connect();
      console.info("Redis client connected.");

      if (!redisClient.isReady) {
        console.error(
          "<---> WARNING: Failed to initialize caching layer. <--->",
        );
      }

      return redisClient;
    } catch (error) {
      console.warn("Failed to connect Redis client:", error);
      if (redisClient) {
        try {
          redisClient.destroy();
        } catch (e) {
          console.error(
            "Failed to quit the Redis client after failing to connect.",
            e,
          );
        }
      }
    }
  }

  return null;
}

async function createCacheConfig() {
  const redisClient = await setupRedisClient();
  const lruCache = createLruHandler();

  if (!redisClient) {
    console.error(
      "<---> WARNING: Failed to initialize Redis cache, falling back to LRU. <--->",
    );
    const config = { handlers: [lruCache] };
    if (isSingleConnectionModeEnabled) {
      global.cacheHandlerConfigPromise = null;
      global.cacheHandlerConfig = config;
    }
    return config;
  }

  const redisCacheHandler = createRedisHandler({
    client: redisClient,
    keyPrefix: "nextjs:",
  });

  const config = {
    handlers: [
      createCompositeHandler({
        handlers: [lruCache, redisCacheHandler],
        setStrategy: (ctx) => (ctx?.tags.includes("memory-cache") ? 0 : 1),
      }),
    ],
  };

  if (isSingleConnectionModeEnabled) {
    global.cacheHandlerConfigPromise = null;
    global.cacheHandlerConfig = config;
  }

  return config;
}

// Ultra-aggressive cache handler with comprehensive logging
function createRewriteAwareCacheHandler(baseHandler) {
  return {
    get: async (key, ctx) => {
      const timestamp = new Date().toISOString();
      console.log(`\n🔍 [${timestamp}] Cache GET: "${key}"`);
      console.log(`   📋 Context available: ${!!ctx}`);
      console.log(`   🌐 Headers available: ${!!ctx?.request?.headers}`);
      
      const headers = ctx?.request?.headers || {};
      const allHeaders = Object.fromEntries(Object.entries(headers).filter(([k]) => k.startsWith('x-')));
      console.log(`   📨 X-Headers:`, allHeaders);
      
      const originalSubdomain = headers['x-original-subdomain'];
      const originalPathname = headers['x-original-pathname'];
      const canonicalRoute = headers['x-canonical-route'];
      const actualSubdomain = headers['x-actual-subdomain'];
      
      console.log(`   🏷️  Original Subdomain: "${originalSubdomain}"`);
      console.log(`   📍 Original Pathname: "${originalPathname}"`);
      console.log(`   🎯 Canonical Route: "${canonicalRoute}"`);
      console.log(`   🔖 Actual Subdomain: "${actualSubdomain}"`);
      
      // Strategy: Since we're using canonical routing (/fooz), 
      // all subdomains will share the same cache entries
      // No key manipulation needed - just use the original key
      
      try {
        const result = await baseHandler.get(key, ctx);
        if (result) {
          console.log(`   ✅ CACHE HIT: "${key}"`);
          if (actualSubdomain && actualSubdomain !== 'fooz') {
            console.log(`   🎭 Serving ${actualSubdomain} content from canonical cache`);
          }
          return result;
        }
      } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
      }
      
      console.log(`   ❌ CACHE MISS: "${key}"\n`);
      return null;
    },
    
    set: async (key, data, ctx) => {
      const timestamp = new Date().toISOString();
      console.log(`\n💾 [${timestamp}] Cache SET: "${key}"`);
      console.log(`   📊 Data kind: ${data?.kind || 'unknown'}`);
      console.log(`   📏 Data size: ${JSON.stringify(data)?.length || 0} chars`);
      
      const headers = ctx?.request?.headers || {};
      const allHeaders = Object.fromEntries(Object.entries(headers).filter(([k]) => k.startsWith('x-')));
      console.log(`   📨 X-Headers:`, allHeaders);
      
      const originalSubdomain = headers['x-original-subdomain'];
      const canonicalRoute = headers['x-canonical-route'];
      const actualSubdomain = headers['x-actual-subdomain'];
      
      console.log(`   🏷️  Original Subdomain: "${originalSubdomain}"`);
      console.log(`   🎯 Canonical Route: "${canonicalRoute}"`);
      console.log(`   🔖 Actual Subdomain: "${actualSubdomain}"`);
      
      // Store with original key - canonical routing means cache is shared
      const result = await baseHandler.set(key, data, ctx);
      
      if (actualSubdomain && actualSubdomain !== 'fooz') {
        console.log(`   ✅ STORED: "${key}" (shared for all subdomains via canonical routing)`);
        console.log(`   🎭 Cache entry will serve: fooz, ${actualSubdomain}, and other subdomains`);
      } else {
        console.log(`   ✅ STORED: "${key}"`);
      }
      
      return result;
    },
    
    // Enhanced revalidate methods with logging
    revalidateTag: async (...args) => {
      console.log(`🔄 Cache revalidateTag called:`, args);
      if (baseHandler.revalidateTag) {
        return baseHandler.revalidateTag(...args);
      }
    },
    
    revalidate: async (...args) => {
      console.log(`🔄 Cache revalidate called:`, args);
      if (baseHandler.revalidate) {
        return baseHandler.revalidate(...args);
      }
    },
  };
}

CacheHandler.onCreation(() => {
  if (isSingleConnectionModeEnabled) {
    if (global.cacheHandlerConfig) {
      return global.cacheHandlerConfig;
    }
    if (global.cacheHandlerConfigPromise) {
      return global.cacheHandlerConfigPromise;
    }
  }

  if (process.env.NODE_ENV === "development") {
    const lruHandler = createLruHandler();
    const wrappedHandler = createRewriteAwareCacheHandler(lruHandler);
    const config = { handlers: [wrappedHandler] };
    if (isSingleConnectionModeEnabled) {
      global.cacheHandlerConfig = config;
    }
    return config;
  }

  const promise = createCacheConfig().then(config => {
    // Wrap the composite handler with rewrite-aware logic
    const wrappedHandlers = config.handlers.map(handler => 
      createRewriteAwareCacheHandler(handler)
    );
    return { ...config, handlers: wrappedHandlers };
  });
  
  if (isSingleConnectionModeEnabled) {
    global.cacheHandlerConfigPromise = promise;
  }
  return promise;
});

export default CacheHandler;
