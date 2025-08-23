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
 * PPR TAKEAWAYS
 * - `ppr: true`:
 *   - MUST have `generateStaticParams()`.
 *   - MUST have minimum ONE value, empty array does NOT work.
 *   - Even if `[slug]` was further down, i.e. `sub/[slug]`.
 *   - WHY???
 *
 * CACHE TAKEAWAYS
 * - `use cache`:
 *   - NOT NEEDED, ATOMATICALLY CACHES BOTH `layout.tsx` and `page.tsx`.
 *   - Even if build output does not mention `revalidate` and `expire`.
 *   - IRRELEVANT if any component has uncached `fetch()`, `[slug]/<path>` ALWAYS CACHED.
 *     despite no `use cache`.
 *   `page.tsx` and `layout.tsx`.
 *   - `use cache` in parent `layout.tsx` is NOT ENOUGH.
 *
 * TAKEAWAYS: `cacheComponents: true`
 * - `generateStaticParams()`
 *    - `generateStaticParams()` cannot depend on uncached | request data,
 *       e.g. `fetch()` | `cookies()` | `params`, unless at least ONE other
 *       `layout.tsx`, or the `page.tsx`, of segment, depends on uncached | request data.
 *    - ERROR:
 *      - Route "/[slug]/foo" has a `generateMetadata` that depends on Request data
 *        (`cookies()`, etc...) or uncached external data (`fetch(...)`, etc...) when
 *        the rest of the route does not.
 *        See more info here:
 *        https://nextjs.org/docs/messages/next-prerender-dynamic-metadata
 *    - PROBLEM:
 *      - Error also happens when `generateStaticParams()` does NOT depend on uncached data.
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

export async function generateStaticParams() {
  return [{ slug: "fooz" }];
}

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
