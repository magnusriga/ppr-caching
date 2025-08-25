import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PokeAPI/sprites/**",
      },
    ],
  },

  cacheHandler: require.resolve("./cache-handler-forte.mjs"),

  experimental: {
    mdxRs: true,
    ppr: true,
    // useCache: true,

    /**
     * Enables: `ppr`, `use cache`, `cacheLife`, `cacheTag`.
     */
    // cacheComponents: true,

    /**
     * Setting for `use cache`.
     * Usage in file: `use cache: custom`.
     */
    // cacheHandlers: {
    //   custom: require.resolve("./cache-handler-forte.mjs"),
    //   default: require.resolve("./cache-handler-forte.mjs"),
    //   remote: require.resolve("./cache-handler-forte.mjs"),
    //   static: require.resolve("./cache-handler-forte.mjs"),
    //   // [handlerName: string]: string | undefined
    // },

    /**
     * Custom profiles for `cacheLife`.
     */
    // cacheLife: {
    //   frequent: {
    //     stale: 600,
    //     revalidate: 600, // Set higher than `stale`?
    //     expire: 86400, // 24 hours.
    //   },
    // },

    // serverComponentsHmrCache: true, // Cache fetch in Server Components, to reduce API calls.

    // staleTimes: {
    //   dynamic: 0, // TODO: Consider also caching dynamic pages, client side.
    //   static: 300, // Caches static page components for 5 minutes (60 * 5), just like layouts.
    // },
  },

  logging: {
    fetches: {
      /**
       * Log full URL of fetch requests to console, in development.
       */
      fullUrl: true,
      hmrRefreshes: true,
    },
  },

  output: "standalone",
};

export default nextConfig;
