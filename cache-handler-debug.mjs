import { CacheHandler } from "@fortedigital/nextjs-cache-handler";
import { createClient } from "redis";

// Helper function to check if a tag is implicit (similar to neshca's isImplicitTag)
function isImplicitTag(tag) {
  // Implicit tags typically start with special prefixes
  return (
    tag.startsWith("_N_") || tag.startsWith("_S_") || tag.startsWith("_T_")
  );
}

CacheHandler.onCreation(async () => {
  console.log("[CACHE-DEBUG] Starting cache handler creation...");
  console.log(
    "[CACHE-DEBUG] Next.js 15 compatible version with Buffer/String conversion",
  );

  // Configuration from environment variables
  const config = {
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    keyPrefix: process.env.CACHE_KEY_PREFIX || "ppr-debug-cache:",
    sharedTagsKey: process.env.CACHE_SHARED_TAGS_KEY || "_sharedTags_",
    timeoutMs: parseInt(process.env.CACHE_TIMEOUT_MS, 10) || 1000,
    querySize: parseInt(process.env.CACHE_QUERY_SIZE, 10) || 100,
  };

  console.log("[CACHE-DEBUG] Configuration:", config);

  // Always create a Redis client inside the `onCreation` callback.
  const client = createClient({
    url: config.redisUrl,
  });

  // Redis won't work without error handling. https://github.com/redis/node-redis?tab=readme-ov-file#events
  client.on("error", (error) => {
    console.error("[CACHE-DEBUG] Redis client error:", error);
  });

  console.log("[CACHE-DEBUG] Connecting to Redis...");
  await client.connect();
  console.log("[CACHE-DEBUG] Redis connected successfully");

  // Use config values
  const timeoutMs = config.timeoutMs;
  const keyPrefix = config.keyPrefix;
  const sharedTagsKey = config.sharedTagsKey;

  // Create an assert function to ensure that the client is ready before using it.
  // When you throw an error in any Handler method,
  // the CacheHandler will use the next available Handler listed in the `handlers` array.
  function assertClientIsReady() {
    if (!client.isReady) {
      console.error("[CACHE-DEBUG] Redis client is not ready!");
      throw new Error("Redis client is not ready yet or connection is lost.");
    }
  }

  const revalidatedTagsKey = `${keyPrefix}__revalidated_tags__`;

  // Create a custom Redis Handler
  const customRedisHandler = {
    // Give the handler a name.
    // It is useful for logging in debug mode.
    name: "redis-debug-handler",
    version: "1.0.0-next15",
    // We do not use try/catch blocks in the Handler methods.
    // CacheHandler will handle errors and use the next available Handler.
    async get(key, { implicitTags }) {
      console.log(`[CACHE-DEBUG:GET] Starting GET for key: ${key}`);
      console.log(`[CACHE-DEBUG:GET] Implicit tags:`, implicitTags);

      // Ensure that the client is ready before using it.
      // If the client is not ready, the CacheHandler will use the next available Handler.
      assertClientIsReady();

      // Get the value from Redis.
      // We use the key prefix to avoid key collisions with other data in Redis.
      const redisKey = keyPrefix + key;
      console.log(
        `[CACHE-DEBUG:GET] Fetching from Redis with key: ${redisKey}`,
      );

      // Use timeout with Promise.race for timeout handling
      const result = await Promise.race([
        client.get(redisKey),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Redis operation timeout")),
            timeoutMs,
          ),
        ),
      ]);

      // If the key does not exist, return null.
      if (!result) {
        console.log(`[CACHE-DEBUG:GET] Key not found in Redis: ${redisKey}`);
        return null;
      }

      console.log(
        `[CACHE-DEBUG:GET] Found value in Redis, length: ${result.length}`,
      );

      // Redis stores strings, so we need to parse the JSON.
      const cacheValue = JSON.parse(result);

      // If the cache value has no tags, return it early.
      if (!cacheValue) {
        console.log(`[CACHE-DEBUG:GET] Cache value is null/undefined`);
        return null;
      }

      console.log(`[CACHE-DEBUG:GET] Cache value metadata:`, {
        tags: cacheValue.tags,
        lastModified: cacheValue.lastModified,
        lifespan: cacheValue.lifespan,
        hasValue: !!cacheValue.value,
        valueType: typeof cacheValue.value,
        kind: cacheValue.value?.kind,
      });

      // Next.js 15 compatibility: Convert strings back to Buffers for specific fields
      if (cacheValue.value) {
        console.log(
          `[CACHE-DEBUG:GET] Cache value kind: ${cacheValue.value.kind || "unknown"}`,
        );

        if (cacheValue.value.kind === "APP_ROUTE") {
          console.log(
            `[CACHE-DEBUG:GET] APP_ROUTE - body type: ${typeof cacheValue.value.body}, length: ${cacheValue.value.body?.length || 0}`,
          );
          // Convert body string back to Buffer if needed
          if (
            cacheValue.value.body &&
            typeof cacheValue.value.body === "string"
          ) {
            console.log(
              `[CACHE-DEBUG:GET] Converting body from string to Buffer`,
            );
            cacheValue.value.body = Buffer.from(cacheValue.value.body);
          }
        } else if (cacheValue.value.kind === "APP_PAGE") {
          console.log(
            `[CACHE-DEBUG:GET] APP_PAGE - rscData type: ${typeof cacheValue.value.rscData}, segmentData keys: ${Object.keys(cacheValue.value.segmentData || {}).length}`,
          );
          // Convert rscData string back to Buffer if needed
          if (
            cacheValue.value.rscData &&
            typeof cacheValue.value.rscData === "string"
          ) {
            console.log(
              `[CACHE-DEBUG:GET] Converting rscData from string to Buffer`,
            );
            cacheValue.value.rscData = Buffer.from(cacheValue.value.rscData);
          }
        } else if (cacheValue.value.kind === "PAGE") {
          console.log(`[CACHE-DEBUG:GET] PAGE cache type detected`);
        } else if (cacheValue.value.kind === "FETCH") {
          console.log(`[CACHE-DEBUG:GET] FETCH cache type detected`);
        }
      }

      // Get the set of explicit and implicit tags.
      // implicitTags are available only on the `get` method.
      const combinedTags = new Set([...cacheValue.tags, ...implicitTags]);
      console.log(`[CACHE-DEBUG:GET] Combined tags:`, Array.from(combinedTags));

      // If there are no tags, return the cache value early.
      if (combinedTags.size === 0) {
        console.log(
          `[CACHE-DEBUG:GET] No tags, returning cache value directly`,
        );
        return cacheValue;
      }

      // Get the revalidation times for the tags.
      console.log(`[CACHE-DEBUG:GET] Checking revalidation times for tags...`);
      const revalidationTimes = await Promise.race([
        client.hmGet(revalidatedTagsKey, Array.from(combinedTags)),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Redis operation timeout")),
            timeoutMs,
          ),
        ),
      ]);

      // Iterate over all revalidation times.
      for (let i = 0; i < revalidationTimes.length; i++) {
        const timeString = revalidationTimes[i];
        const tag = Array.from(combinedTags)[i];

        if (timeString) {
          const revalidationTime = Number.parseInt(timeString, 10);
          console.log(
            `[CACHE-DEBUG:GET] Tag "${tag}" revalidated at ${revalidationTime}, cache last modified at ${cacheValue.lastModified}`,
          );

          // If the revalidation time is greater than the last modified time of the cache value,
          if (revalidationTime > cacheValue.lastModified) {
            console.log(
              `[CACHE-DEBUG:GET] Cache is stale! Deleting key and returning null`,
            );
            // Delete the key from Redis.
            await Promise.race([
              client.unlink(redisKey),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Redis operation timeout")),
                  timeoutMs,
                ),
              ),
            ]);

            // Return null to indicate cache miss.
            return null;
          }
        }
      }

      // Return the cache value.
      console.log(`[CACHE-DEBUG:GET] Cache is valid, returning value`);
      return cacheValue;
    },

    async set(key, cacheHandlerValue) {
      console.log(`[CACHE-DEBUG:SET] Starting SET for key: ${key}`);
      console.log(`[CACHE-DEBUG:SET] Cache value metadata:`, {
        tags: cacheHandlerValue.tags,
        lastModified: cacheHandlerValue.lastModified,
        lifespan: cacheHandlerValue.lifespan,
        hasValue: !!cacheHandlerValue.value,
        valueType: typeof cacheHandlerValue.value,
        kind: cacheHandlerValue.value?.kind,
        revalidate: cacheHandlerValue.revalidate,
      });

      // Next.js 15 compatibility: Convert Buffers to strings for Redis storage
      if (cacheHandlerValue.value) {
        console.log(
          `[CACHE-DEBUG:SET] Cache value kind: ${cacheHandlerValue.value.kind || "unknown"}`,
        );

        if (cacheHandlerValue.value.kind === "APP_ROUTE") {
          console.log(
            `[CACHE-DEBUG:SET] APP_ROUTE - body type: ${typeof cacheHandlerValue.value.body}, isBuffer: ${Buffer.isBuffer(cacheHandlerValue.value.body)}`,
          );
          // Convert Buffer to string for storage
          if (
            cacheHandlerValue.value.body &&
            Buffer.isBuffer(cacheHandlerValue.value.body)
          ) {
            console.log(
              `[CACHE-DEBUG:SET] Converting body from Buffer to string for storage`,
            );
            cacheHandlerValue.value.body =
              cacheHandlerValue.value.body.toString("utf-8");
          }
        } else if (cacheHandlerValue.value.kind === "APP_PAGE") {
          console.log(
            `[CACHE-DEBUG:SET] APP_PAGE - rscData type: ${typeof cacheHandlerValue.value.rscData}, isBuffer: ${Buffer.isBuffer(cacheHandlerValue.value.rscData)}`,
          );
          if (cacheHandlerValue.value.segmentData) {
            console.log(
              `[CACHE-DEBUG:SET] APP_PAGE - segmentData keys: ${Object.keys(cacheHandlerValue.value.segmentData).join(", ")}`,
            );
          }
          // Convert Buffer to string for storage
          if (
            cacheHandlerValue.value.rscData &&
            Buffer.isBuffer(cacheHandlerValue.value.rscData)
          ) {
            console.log(
              `[CACHE-DEBUG:SET] Converting rscData from Buffer to string for storage`,
            );
            cacheHandlerValue.value.rscData =
              cacheHandlerValue.value.rscData.toString("utf-8");
          }
        } else if (cacheHandlerValue.value.kind === "PAGE") {
          console.log(
            `[CACHE-DEBUG:SET] PAGE cache type - html length: ${cacheHandlerValue.value.html?.length || 0}`,
          );
        } else if (cacheHandlerValue.value.kind === "FETCH") {
          console.log(
            `[CACHE-DEBUG:SET] FETCH cache type - data type: ${typeof cacheHandlerValue.value.data}`,
          );
        }
      }

      // Ensure that the client is ready before using it.
      assertClientIsReady();

      const redisKey = keyPrefix + key;
      const serializedValue = JSON.stringify(cacheHandlerValue);

      console.log(
        `[CACHE-DEBUG:SET] Storing in Redis with key: ${redisKey}, size: ${serializedValue.length} bytes`,
      );

      // Redis stores strings, so we need to stringify the JSON.
      const setOperation = client.set(redisKey, serializedValue);

      // If the cacheHandlerValue has a lifespan, set the automatic expiration.
      // cacheHandlerValue.lifespan can be null if the value is the page from the Pages Router without getStaticPaths or with `fallback: false`
      // so, we need to check if it exists before using it
      let expireOperation;
      if (cacheHandlerValue.lifespan) {
        const ttlSeconds = Math.floor(
          (cacheHandlerValue.lifespan.expireAt - Date.now()) / 1000,
        );
        console.log(
          `[CACHE-DEBUG:SET] Setting expiration: ${cacheHandlerValue.lifespan.expireAt} (TTL: ${ttlSeconds}s)`,
        );
        expireOperation = client.expireAt(
          redisKey,
          cacheHandlerValue.lifespan.expireAt,
        );
      } else {
        console.log(`[CACHE-DEBUG:SET] No lifespan, key will not expire`);
      }

      // If the cache handler value has tags, set the tags.
      // We store them separately to save time to retrieve them in the `revalidateTag` method.
      let setTagsOperation;
      if (cacheHandlerValue.tags.length) {
        console.log(
          `[CACHE-DEBUG:SET] Storing tags separately: ${cacheHandlerValue.tags.join(", ")}`,
        );
        setTagsOperation = client.hSet(
          keyPrefix + sharedTagsKey,
          key,
          JSON.stringify(cacheHandlerValue.tags),
        );
      } else {
        console.log(`[CACHE-DEBUG:SET] No tags to store`);
      }

      // Wait for all operations to complete with timeout
      await Promise.race([
        Promise.all([setOperation, expireOperation, setTagsOperation]),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Redis operation timeout")),
            timeoutMs,
          ),
        ),
      ]);
      console.log(`[CACHE-DEBUG:SET] Successfully stored cache entry`);
    },

    async revalidateTag(tag) {
      console.log(
        `[CACHE-DEBUG:REVALIDATE] Starting revalidation for tag: ${tag}`,
      );

      // Ensure that the client is ready before using it.
      assertClientIsReady();

      // Check if the tag is implicit.
      // Implicit tags are not stored in the cached values.
      if (isImplicitTag(tag)) {
        console.log(
          `[CACHE-DEBUG:REVALIDATE] Tag is implicit, marking as revalidated`,
        );
        // Mark the tag as revalidated at the current time.
        await Promise.race([
          client.hSet(revalidatedTagsKey, tag, Date.now()),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Redis operation timeout")),
              timeoutMs,
            ),
          ),
        ]);
      }

      // Create a map to store the tags for each key.
      const tagsMap = new Map();

      // Cursor for the hScan operation.
      let cursor = 0;

      // Define a query size for the hScan operation.
      const hScanOptions = { COUNT: config.querySize };

      console.log(
        `[CACHE-DEBUG:REVALIDATE] Scanning for keys with tag: ${tag}`,
      );

      // Iterate over all keys in the shared tags.
      do {
        const remoteTagsPortion = await Promise.race([
          client.hScan(keyPrefix + sharedTagsKey, cursor, hScanOptions),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Redis operation timeout")),
              timeoutMs,
            ),
          ),
        ]);

        // Iterate over all keys in the portion.
        for (const { field, value } of remoteTagsPortion.tuples) {
          // Parse the tags from the value.
          tagsMap.set(field, JSON.parse(value));
        }

        // Update the cursor for the next iteration.
        cursor = remoteTagsPortion.cursor;

        // If the cursor is 0, we have reached the end.
      } while (cursor !== 0);

      console.log(
        `[CACHE-DEBUG:REVALIDATE] Found ${tagsMap.size} total keys in cache`,
      );

      // Create an array of keys to delete.
      const keysToDelete = [];

      // Create an array of tags to delete from the hash map.
      const tagsToDelete = [];

      // Iterate over all keys and tags.
      for (const [key, tags] of tagsMap) {
        // If the tags include the specified tag, add the key to the delete list.
        if (tags.includes(tag)) {
          // Key must be prefixed because we use the key prefix in the set method.
          keysToDelete.push(keyPrefix + key);
          // Set an empty string as the value for the revalidated tag.
          tagsToDelete.push(key);
        }
      }

      console.log(
        `[CACHE-DEBUG:REVALIDATE] Found ${keysToDelete.length} keys to invalidate`,
      );

      // If there are no keys to delete, return early.
      if (keysToDelete.length === 0) {
        console.log(`[CACHE-DEBUG:REVALIDATE] No keys to invalidate`);
        return;
      }

      console.log(`[CACHE-DEBUG:REVALIDATE] Deleting keys:`, keysToDelete);

      // Delete the keys from Redis.
      const deleteKeysOperation = client.unlink(keysToDelete);

      // Update the tags in Redis by deleting the revalidated tags.
      const updateTagsOperation = client.hDel(
        keyPrefix + sharedTagsKey,
        tagsToDelete,
      );

      // Wait for all operations to complete with timeout.
      await Promise.race([
        Promise.all([deleteKeysOperation, updateTagsOperation]),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Redis operation timeout")),
            timeoutMs,
          ),
        ),
      ]);
      console.log(`[CACHE-DEBUG:REVALIDATE] Revalidation complete`);
    },

    async delete(key) {
      console.log(`[CACHE-DEBUG:DELETE] Deleting key: ${key}`);

      assertClientIsReady();

      const redisKey = keyPrefix + key;

      // Delete the main key
      const deleteKeyOperation = client.unlink(redisKey);

      // Delete from shared tags
      const deleteTagsOperation = client.hDel(keyPrefix + sharedTagsKey, key);

      await Promise.race([
        Promise.all([deleteKeyOperation, deleteTagsOperation]),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Redis operation timeout")),
            timeoutMs,
          ),
        ),
      ]);
      console.log(`[CACHE-DEBUG:DELETE] Key deleted successfully`);
    },
  };

  console.log("[CACHE-DEBUG] Cache handler created successfully");
  console.log("[CACHE-DEBUG] Handler info:", {
    name: customRedisHandler.name,
    version: customRedisHandler.version,
    features: [
      "Next.js 15 Buffer/String conversion",
      "APP_ROUTE cache support",
      "APP_PAGE cache support",
      "PAGE cache support",
      "FETCH cache support",
      "Tag-based revalidation",
      "Configurable via environment variables",
      "Comprehensive debug logging",
    ],
  });

  return {
    // The order of the handlers is important.
    // The CacheHandler will run get methods in the order of the handlers array.
    // Other methods will be run in parallel.
    handlers: [customRedisHandler],
  };
});

export default CacheHandler;
