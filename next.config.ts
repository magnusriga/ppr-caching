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
  // cacheHandler: require.resolve("./cache-handler-simple.mjs"),

  experimental: {
    clientSegmentCache: true, // Needed to avoid links handing when cache entry missing.
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
    //   custom: require.resolve("./cache-handler-forte-new.mjs"),
    //   // default: require.resolve("./cache-handler-forte-new.mjs"),
    //   // remote: require.resolve("./cache-handler-forte-new.mjs"),
    //   // static: require.resolve("./cache-handler-forte-new.mjs"),
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

    /**
     * `staleTimes`:
     * - Changes Router Cache duration for `layout.tsx`,
     *   and enables Router Cache for `page.tsx`.
     * - Ensures `page.tsx` RSC payload + HTML is cached client-side, like `layout.tsx`.
     * - Ensures instant navigation.
     * - Applies to both `layout.tsx` and `page.tsx`.
     * - Default: Static components of `layout.tsx`, `300` (5m).
     * - Invalidate:
     *   - Server Action (*not* RH): `revalidateTag|Path()` | `cookies.set|delete()`.
     *   - `router.refresh()`.
     * - Does not affect browser back|forward caching, handled by browser's `bfcache`,
     *   to prevent layout shift and keep scroll position.
     */
    // staleTimes: {
    /**
     * - Ensures components with Dynamic API *also* cached, client-side.
     * - Avoids waiting for route to rerender on every navigation,
     *   to update Dynamic API component in `page.tsx`.
     * - Result: Instant navigation, no loading state.
     */
    // dynamic: 60,
    // static: 60,
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
