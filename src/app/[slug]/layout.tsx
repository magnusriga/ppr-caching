import { Suspense } from "react";
import Nav from "./nav";

/**
 * ===========================
 * FLOW
 * ===========================
 * 1. Build: Static routes | components (if PPR), are saved to DISK: `.next/cache`.
 * 2. Start:
 *    - `instrumentation.ts` prepopulates Redis, from DISK cache.
 *    - FAILS to populate fetch cache, becasue `fetch-data` NOT written to DISK build time.
 *    - If not using custom `cacheHandler`, `fetch-data` IS written to DISK, build time.
 *    - From there, it should be manually copied to `standalone/.next/cahce`.
 * 3. Visit: Prerendered path
 *    - Page served form Redis cache.
 *    - NO re-render of ANY component (unless PPR > dynamic components)
 *    - FAST: < 250ms to DOMContentLoaded.
 * 3. Visit: NOT prerendered path
 *    - NORMALLY: Page is cached in Redis, on first visit.
 *    - BUT: `rewrite()` prevents runtime caching.
 *    - Thus, page re-renders all components (unless PPR and some pre-rendered).
 *    - Fetch gets data from cahce, so NO re-fetch.
 *    - SLOW: > 600ms to DOMContentLoaded.
 * 4. Visit again after rebuild
 *    - Pages are updated in cache.
 *    - Despite key not having build prefix.
 * - IMPORTANT 1
 *   - TODO|: Need `rewrite()` to write cache, or switch to redirect.
 *   - Otherwise, clients' apps will NOT be cached.
 * - IMPORTANT 2
 *   - Wrap dynamic components in `<Suspense>`. <-- Clean up `<Suspense>`.
 *   - Use PPR.
 *   - Check: PPR also caches individual components of dynamic segments at runtime?
 * - IMPORTANT 3
 *   - With `cacheHandler`, `fetch-data` NOT written to DISK build time.
 *   - TODO|: FIND FIX > update copy in Dockerfile and `package.json` scripts.
 * - IMPORTANT 4
 *   - `instrumentations.ts` is unable to prepopulate pages from DISK,
 *     as they are suffixed `prefetch.rsc`, and not `.rsc`, when `ppr: true`.
 *   - TODO|: FIND FIX > `fortedigital/nextjs-cache-handler` issue?
 * - IMPORTANT 5
 *   - Build prefix in cache key, so staging does not overwrite production cache entries?
 *   - TODO|: IMPLEMENT.
 *   - But we use same version number of app for both staging and production.
 *   - Not sure if that is different from build prefix.
 *   - See: Nesha/nextjs-cache-handler#15
 * - IMPORTANT 6
 *   - Find way to update revalidate and staleTime of pages, defaulting to 10 min (600s)?
 *   - TODO|: FIX > staleTimes in `next.config.ts`?
 *
 * ===========================
 * IMPORTANT
 * ===========================
 * - CANNOT USE `cacheComponents: true` | `use cache`.
 *   - `use cache` uses in-memory cache, and not `cacheHandler`.
 *   - Instead, use `fetch` cache, and `unstable_cache` for non-fetch data,
 *     both use `cacheHandler`.
 * - Dynamic paths
 *   - Visiting dynamic paths, i.e. not in `generateStaticParams`: CACHED runtime.
 *   - Works for fully static routes, AND for partially static routes with holes for
 *     dynamic content (when using PPR).
 *   - UNLESS `rewrite()` in `middleware.ts`: BREAKS runtime caching of dynamic paths.
 *   - Visible page loads as fast for staticalliy generated paths (`generateStaticParams`),
 *     as for dynamic paths.
 *   - DIFFERENCES:
 *     - Static paths:
 *       - RSC payload cached in CDN and browser.
 *       - Headers: `s-maxage=31536000`.
 *     - Dynamic paths:
 *       - RSC payload NOT cached in CDN | browser.
 *       - Headers: `private, no-cache, no-store, max-age=0, must-revalidate`.
 *     - NOTE|:
 *       - Document never cached in CDN | browser.
 * - `rewrite()`
 *   - `rewrite()` in `middleware.ts`: Only build-time pre-rendered paths placed in CACHE.
 *   - Runtime caching of dynamic paths BROKEN by `rewrite()`.
 *   - TODO|: FIX, either via headers or just using `redirect()`.
 * - PPR
 *   - Caches entire routes, with placeholders for dynamic components.
 *   - Both static routes, from `generateStaticParams()`, and dynamic routes.
 *   - Dynamic routes are cached runtime, when visited.
 *   - Just like fully static routes, just with placeholders for dynamic components.
 *   - Thus, not caching individual components, but entire routes, with placeholders.
 *   - WORKS REALLY WELL.
 * - PPR: These lead to dynamic rendering, and MUST be in `<Suspense>`:
 *   - `await searchParams` <-- `params` is OK.
 *   - `await cookies()`
 *   - `await headers()`
 *   - `await connnection()`
 *   - `draftMode`
 *   - `unstable_noStore()`
 *   - `fetch()` with `{ cache: no-store }` <-- Regular `fetch()` OK, still caches routes.
 * - Data fetches
 *   - Caching data fetches is NOT pre-requisite for caching routes, fully | partially (PPR).
 *   - Even though docs says so (Full Route Cache).
 *   - As long no fetch is `{ cache: no-store }`, routes are cached.
 *   - Same for PPR and fully static routes.
 * - Dynamic API
 *   - DOMContentLoaded: > 600ms
 *   - BUT: Still equally fast LCP
 *   - No visible speed difference.
 *   - RSC loads in same time as without dynamic API: 500ms - 1s
 *   - Something NOT VISIBLE, is making document loading slower.
 *
 *
 *
 * ===========================
 * CACHE NOTES
 * ===========================
 * - IMPORTANT: When testing caching, have DevTools up with (browser) cach disabled,
 *   otherwise browser cache might obscure debugging.
 * - Sometimes, hitting url in address bar might not start Redis, most likely
 *   because using browser cache from previous run, thus use DevTools and Ctrl-R.
 * - NEVER place 'use cache' on top of component, if component reads `await
 *   params`, or accessess dynamic APIs.
 * - OK with `use cache` in any component ABOVE component reading `await params`,
 *   or accessing  dynamic APIs, but ALWAYS wrap children in `<Suspense>`.
 * - MUST use `<Suspense>` around components that read `await params`, or
 *   access dynamic APIs.
 *   - If not upheld, and parent uses `use cache`, then app will throw error on `pnpm start`.
 *   - If not upheld, and parent does not use `use cache`, no error but NO CACHING.
 *
 * - Find out where `use cache` is needed. only layout seems enough?
 * - Find out why [slug] in cache, and not specific path.
 *
 * - Thus, can have `layout.tsx` with `use cache`, when `page.tsx` accesses
 *   `headers()` and `await params`, EVEN without `children` in `layout.tsx`
 *   wrapped in `<Suspense>`.
 * - NOT OK with `use cache` AT or BELOW any component using dynamic APIs,
 *   but OK AT or BELOW component reading `await params`.
 * - 'use cache' at BOTH 'layout.tsx' AND `page.tsx` still will NOT write cache,
 *   when coming from `NextResponse.rewrite(..)`.
 * - NOTE: No matter where I place `use cache`, at component or file level,
 *   it will NOT write cache, when coming from `NextResponse.rewrite(..)`.
 *
 * TRIED
 * - Removing `ppr: true` from `next.config.ts`
 *   - NO change.
 *   - Still need `generateStaticParams()`, with at least one value,
 *     when `cacheComponents: true`.
 *   - Perhaps because `cacheComponents: true` implies `ppr: true`.
 *
 * TAKEAWAYS: `cacheComponents: true`:
 * - `generateStaticParams()`
 *   - MUST have `generateStaticParams()`, if using dynamic routes.
 *   - MUST have minimum ONE value, empty array does NOT work.
 *   - Even if `[slug]` was further down, i.e. `sub/[slug]`.
 *   - BECAUSE PPR ONLY applies to paths pre-rendered with `generateStaticParams()`.
 *   - BECAUSE, dynamic routes are dynamic - The way to tell Next.js to
 *     pre-render them, including partially-prerendering components,
 *     is to use `generateStaticParams()`.
 * - Unfortunateloy, components are not cached by PPR, if not from path pre-rendered
 *   with `generateStaticParams()`.
 * - `cacheCompnents: true` and `use cache` implies `ppr: true`???
 *
 * `use cache`
 * - https://nextjs.org/docs/app/api-reference/directives/use-cache#use-cache-at-runtime
 * - `use cache` uses server-side in-memory cache, not custom `cacheHandler`.
 * - `use cache` at page | layout for prerendering, but these already prerendered by default,
 *   if no dynamic APIs | `fetch` with `no-store`.
 * - Lastly, not sure how server-side in-memory cache works in serverless.
 * - CONCLUSION: AVOID `use cache`, breaks caching in cluster.
 *
 * TO EXPLORE:
 *
 * NOTE: It incorrectly uses cache-handler on build, so .next/cache is not
 * populated with fetch-cache and cannot be compied over for insstrumentation,
 * using `useFileSystem` does not work.
 * - Make a post on forte about filesystem cache not working.
 * NOTE: It seems to use LRU (in-memory) cache for `use cache`?
 *
 * - Check if going to `/fooz/foo` will cache page, with / withtout fetch().
 * - If works, then use redirect and live with url format?
 * - 'use cahce' at component or function level?
 * - Build shows that both [slug]/ and fooz/ (from `generateStaticParams()`),
 *   are partially pre-rendered.
 * - /[slug] in cache:
 *   - `layout.tsx`, with template hole for page.
 *   - Does NOT contain `page.tsx` cache, thus no runtime caching of page.
 * - /fooz in cache:
 *   - `layout.tsx`, INCLUDING full page cache.
 * - `rewrite()`:
 *   - Never generates `/fooz` cache
 *   - Only `/[slug]` cache.
 *   - Thus, only cahces `layout.tsx` with template hole for `page.tsx` to be
 *     rendered dynamically runtime.
 * - If `/fooz` directly in address bar, or used redirect(), then `/fooz` would be cached,
 *   including full `page.tsx`.
 * - NOTE: Massive problem, need a way to cache pages dynamically.
 *
 *
 * `instrumentation.ts`
 * - Normally:
 *   - Buld time: Cache is stored ON DISK ONLY, in `.next/cache`, BYPASSING `CacheHandler`.
 *   - DISK cache lives in Docker image, pushed to all containers on deployment.
 *   - When segment is visited, `CacheHandler` (Redis cache) is populated from DISK cache.
 *   - Does not matter which container handles SET request, as all GET from same Redis.
 * - `instrumentation.ts`
 *   - Used to pre-populate cache with initial data, when application starts.
 *   - Saves having to wait for cache population on first visit.
 *
 *
 * CACHE TAKEAWAYS
 * - `generateStaticParams()`
 *   - ONLY caches, runtime, dynamic paths prerendered in `generateStaticParams()`.
 *   - Thus, `generateStaticParams()` is used to instruct Next.js which dynamic paths
 *     should be cahced runtime.
 *   - With PPR, empty array does NOT work, CANNOT cache non-specified paths runtime.
 * - `use cache`:
 *   - NOT NEEDED, ATOMATICALLY CACHES BOTH `layout.tsx` and `page.tsx`,
 *     if path in `generateStaticParams()`.
 *   - Even if build output does not mention `revalidate` and `expire`.
 *   - IRRELEVANT if any component has uncached `fetch()`, `[slug]/<path>` ALWAYS CACHED,
 *     despite no `use cache`, if `slug` in `generateStaticParams()`.
 * - Unfortunately:
 *   - CANNOT cache dynamic routes, as/when visited first time.
 *
 * TAKEAWAYS: `cacheComponents: true`
 * - `generateStaticParams()`
 *    - With `cacheComponents: true`, `generateStaticParams()` cannot depend on
 *      uncached | request data, e.g. `fetch()` | `cookies()` | `params`,
 *      unless at least ONE other `layout.tsx`, or the `page.tsx`, of segment,
 *      depends on uncached | request data.
 *    - Error also happens when `generateStaticParams()` does NOT depend on uncached data.
 *    - Error only happens when visiting paths prerendered with `generateStaticParams()`,
 *      thus new path not from `generateStaticParams()` works fine.
 *    - Unfortunateloy, components are not cached by PPR, if not pre-rendered with
 *      `generateStaticParams()`.
 *    - See: https://nextjs.org/docs/messages/next-prerender-dynamic-metadata
 *    - ERROR:
 *      - Route "/[slug]/foo" has a `generateMetadata` that depends on Request data
 *        (`cookies()`, etc...) or uncached external data (`fetch(...)`, etc...) when
 *        the rest of the route does not.
 *        See more info here:
 *        https://nextjs.org/docs/messages/next-prerender-dynamic-metadata
 *    - PROBLEM:
 *
 * Scenarios:
 * - SETUP:
 *   - DevTools open, browser cache disabled.
 *   - Empty Redis cache before each attempt: `flushall`
 *   - `next.config.ts`       : `cacheComponents: true`
 *   - `rewrite()`            : `sub.main/` --> `main/sub`.
 *   - Files:
 *     - `[slug]/page.tsx`    : `async`, reads `await params`.
 *     - `[slug]/layout.tsx`  : `async`, `generateStaticParams()` with one value.
 *     - `[slug]/foo/page.tsx`: `async`, reads `await params`.
 * * ONE:
 *   - `[slug]/layout.tsx`    : NO `use cahce`, `children` NOT in `<Suspense>`.
 *   - `[slug]/page.tsx`      : Reads `await params`, NO `use cache`.
 *   - `[slug]/foo/page.tsx`  : Reads `await params`, NO `use cache`.
 *   - Build  : OK
 *   - Runtime: ERROR
 *     - Route "/[slug]": A component accessed data, headers, params, searchParams,
 *       or a short-lived cache without a Suspense boundary nor a "use cache" above it.
 *   - Reason:
 *     - With `cacheComponents: true`, every component using `await params|searchParams`,
 *       dynamic APIs, `fetch()`, or similar, MUST be wrapped in `<Suspense>` |
 *       have `use cache` above it.
 *       See: https://nextjs.org/docs/messages/next-prerender-missing-suspense
 *   - NO fix:
 *     - `use cache` in `[slug]/page.tsx` OR `[slug]/layout.tsx` does NOT fix it.
 *   - Fix:
 *     - `[slug]/layout.tsx`: Wrap `children` in `<Suspense>`.
 *   - Caching:
 *     - STILL CACHES `nextjs/:[slug]`
 *     - Kind: `APP_PAGE`
 *     - Tags: "_N_T_/layout", "_N_T_/[slug]/layout", "_N_T_/[slug]/page"
 *     - Meaning: BOTH page AND layout cached, by default, without `use cache`???
 * * TWO:
 *   - Like ONE, except:
 *      - `[slug]/foo/page.tsx`: `fetch()`.
 *   - Build: ERROR
 *     - Route "/[slug]/foo": A component accessed data, headers, params, searchParams,
 *       or a short-lived cache without a Suspense boundary nor a "use cache" above it.
 *     - Same error as ONE, but now in `[slug]/foo/page.tsx`.
 *   - Reason:
 *     - Same as ONE: With `cacheComponents: true`, every component using
 *       `await params|searchParams`, dynamic APIs, `fetch()`, or similar,
 *       MUST be wrapped in `<Suspense>` | have `use cache` above it.
 *       See: https://nextjs.org/docs/messages/next-prerender-missing-suspense
 *     - Would have gotten error ONE, runtime, if build had succeeded.
 *   - NO fix:
 *     - `use cache` in `[slug]/page.tsx` OR in `[slug]/layout.tsx` does NOT fix it.
 *   - Fix:
 *     - `use cache` in `[slug]/foo/page.tsx` <-- Did NOT work for `await params`.
 *     - `[slug]/layout.tsx`: Wrap `children` in `<Suspense>`.
 * * THREE
 *   - Setup
 *     - NO `cacheComponents: true`, `ppr: true`, `use-cache: true`.
 *     - No dynamic APIs | uncached data fetches.
 *     - `generateStaticParams()`: `{ slug: "fooz" }`.
 *   - Result
 *     - HTML response headers: `s-maxage=600, stale-while-revalidate=31535400`
 *     - RSC response headers: `s-maxage=600, stale-while-revalidate=31535400`
 *     - Pre-rendered routes (from `generateStaticParams`): ALL CACHE HIT
 *     - NON-pre-rendered routes: NOT CACHED runtime, when visited.
 *     - Normally, runtime caching of dynamic paths WORKS, but `rewrite` breaks it.
 *   - IMPORTANT
 *     - Due to `rewrite()`, dynamic paths, not prerendered with `generateStaticParams`,
 *       NOT cached when visited.
 *     - Thus, ONLY ONE path cached (from prerender).
 *     - Prerendered routes no re-render, FAST: < 250ms to DOMContentLoaded.
 *     - Dynamic routes must re-render, SLOW: > 600ms to DOMContentLoaded.
 *     - Fetch is still cached in all cases, but re-render SLOW.
 * * FOUR:
 *   - Setup
 *     - Same as THREE, except: Dynamic API
 *     - NO `cacheComponents: true`, `ppr: true`, `use-cache: true`.
 *     - Dynamic API in `nav`, within `layout.tsx`, wrapped in `<Suspense>`.
 *   - Result
 *     - NO CACHING of ANY route.
 *     - NOT EVEN prerendered route from `generateStaticParams()`.
 * * FIVE:
 *   - Setup
 *     - Same as THREE, except: `ppr: true`.
 *     - `ppr: true`
 *     - NO dynamic APIs | uncached data fetches.
 *   - Result
 *     - Almost same as THREE.
 *     - Every pre-rendered path is cached.
 *     - Every dynamic path, not pre-rendered, is NOT cached if `rewrite()`.
 *     - Dynamic pats cached, if no `rewrite()`.
 *     - JUST LIKE WITHOUT PPR.
 *     - BUT: Added NEW cached entry: `/[slug]`
 *   - `/[slug]`
 *     - Only contains `lalyout.tsx` with template hole for `page.tsx`.
 *     - Probably adds entry up to first `<Suspense>` boundary.
 *     - And entries for all pre-rendered paths
 *     - What about dynamic paths???
 *   - IMPORTANT:
 *     - `instrumentations.ts` is unable to prepopulate pages from DISK,
 *       as they are suffixed `prefetch.rsc`, and not `.rsc`, when `ppr: true`.
 * * SIX:
 *   - Setup
 *     - Same as THREE, except: `ppr: true` + Dynamic API.
 *     - `ppr: true`
 *     - Dynamic API in `nav`, within `layout.tsx`, wrapped in `<Suspense>`.
 *   - Result
 *     - SAME as THREE and FIVE.
 *     - EXCEPT: Placeholder for `nav`.
 *     - FAST when page in cache: < 250ms to DOMContentLoaded.
 *     - SLOW when page NOT in cache, despite fetch-data in cache: > 600ms to DOMContentLoaded
 *     - WORKS WELL.
 *
 *
 *
 * Links:
 * - https://nextjs.org/docs/messages/prerender-error
 * - https://nextjs.org/docs/messages/next-prerender-missing-suspense
 * - https://nextjs.org/docs/messages/next-prerender-current-time
 *
 * *
 *   - `layout.tsx` : NO `use cahce`, `children` NOT in `<Suspense>`.
 *   - `page.tsx`   : Reads `await params`, NO `use cache`.
 *   - `[slug]/foo/`: Reads `await params`, NO `use cache`.
 *   - Build  : OK
 *   - Runtime: Error
 *     - Route "/[slug]": A component accessed data, headers, params, searchParams,
 *       or a short-lived cache without a Suspense boundary nor a "use cache" above it.
 * *
 *   - `layout.tsx`: `use cahce` at top, `children` NOT in `<Suspense>`.
 *   - `page.tsx`  : Reads `await params`, `use cache` at top.
 *   - Result:
 * *
 *   - `layout.tsx`: `use cahce` at top, `children` NOT in `<Suspense>`.
 *   - `page.tsx`: Reads `await params`, `use cache` at top.
 *   - Result:
 * - TWO:
 *   - `layout.tsx`: `use cahce` at top, `children` NOT in `<Suspense>`.
 *   - `page.tsx`: Reads `await params`, `use cache` at top.
 *
 * - NOTES:
 *   - If cache already has content...
 *   - If using `redirect()` instead of `rewrite()`
 *
 * ===========================
 */

export async function generateStaticParams() {
  return [{ slug: "fooz" }];
}

export default async function SlugLayout({ children }: LayoutProps<"/[slug]">) {
  return (
    <div className="p-4">
      <Suspense fallback={<div>Loading navigation...</div>}>
        <Nav />
      </Suspense>
      <Suspense>{children}</Suspense>
    </div>
  );
}
