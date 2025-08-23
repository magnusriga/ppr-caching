"use cache";

import { Suspense } from "react";

/**
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
 *
 * TO EXPLORE:
 * - If we had not used ppr, what would happen?
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
 *
 * CACHE TAKEAWAYS
 * - `generateStaticParams()`
 *   - ONLY caches, runtime, dynamic paths prerendered in `generateStaticParams()`.
 *   - Thus, `generateStaticParams()` is used to instruct Next.js which dynamic paths
 *     should be cahced runtime.
 *   - With PPR, empty array does NOT work, CANNOT cache non-specified paths runtime.
 *   - Possible to cahce paths from `generateStaticParams()` build-time,
 *     using `instrumentation.ts`.
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

// export async function generateStaticParams() {
//   return [{ slug: "fooz" }];
// }

export default async function SlugLayout({ children }: LayoutProps<"/[slug]">) {
  return (
    <div>
      {/* OK: */}
      LAYOUT<Suspense>{children}</Suspense>
      {/* NOT OK: */}
      {/* LAYOUT{children} */}
    </div>
  );
}
