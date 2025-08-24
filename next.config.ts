import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  cacheHandler: require.resolve("./cache-handler-forte.mjs"),
  // cacheMaxMemorySize: 0,

  // cacheHandler:
  //   process.env.NODE_ENV === "production"
  //     ? require.resolve("./cache-handler.mjs")
  //     : undefined,

  // cacheMaxMemorySize: process.env.NODE_ENV === "production" ? 0 : undefined,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PokeAPI/sprites/**",
      },
    ],
  },

  experimental: {
    mdxRs: true,
    ppr: true,
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

  /**
   * - Automatically create `standalone` folder with only necessary files
   *   for production deployment, including select files in `node_modules`.
   * - Creates `.next/standalone`, deployable without installing `node_modules`.
   * - Creates `server.js`, used instead of `next start`.
   * - Does NOT copy `public` | `.next/static` folders; these should use CDN.
   * - To listen to specific port and hostname:
   *   - `PORT=8080 HOSTNAME=0.0.0.0 node server.js`
   */
  output: "standalone",
};

export default nextConfig;
