import {
  type NextFetchEvent,
  NextRequest,
  NextResponse,
} from "next/server";

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent,
) {
  const pathname = req.nextUrl.pathname;

  // Get actual host header from request (what browser sent)
  const hostHeader = req.headers.get("host") || "";

  let subdomain: string | null = null;

  const hostWithoutPort = hostHeader.split(":")[0];
  const hostParts = hostWithoutPort.split(".");

  if (hostParts.length > 1) {
    subdomain = hostParts[0];
  } else {
    subdomain = "main";
  }

  console.log(
    `req.url "${req.url}", middleware host header "${hostHeader}", host without port "${hostWithoutPort}", subdomain "${subdomain}", pathname "${pathname}"`,
  );

  // - Rewrite | redirect from `foo.bar.com` to `foo.bar.com/foo`.
  // - Do not rewrite | redirect if path already includes subdomain,
  //   to avoid infinite loop if using `redirect()` above.
  if (!pathname.includes(subdomain)) {
    const newUrl = new URL(`/${subdomain}${pathname}`, req.url);
    const newPathname = `/${subdomain}${pathname}`;
    console.log(`Rewriting to ${newUrl}`);
    
    // Clone the request with modified headers
    const modifiedHeaders = new Headers(req.headers);
    
    // Add custom headers that might help with cache key generation
    modifiedHeaders.set('x-original-pathname', pathname);
    modifiedHeaders.set('x-resolved-pathname', newPathname);
    modifiedHeaders.set('x-rewrite-subdomain', subdomain);
    
    // Create new request with modified headers
    const modifiedRequest = new NextRequest(newUrl, {
      headers: modifiedHeaders,
      method: req.method,
      body: req.body,
    });
    
    // Use rewrite with the modified request
    const response = NextResponse.rewrite(newUrl, {
      request: {
        headers: modifiedHeaders,
      }
    });
    
    // Try to force proper cache behavior
    // Set headers that might influence cache key generation
    response.headers.set('x-resolved-pathname', newPathname);
    response.headers.set('x-middleware-rewrite-path', newPathname);
    
    // Use waitUntil to potentially trigger cache population after rewrite
    // This is experimental and may help trigger runtime caching
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log(`Cache hint: Dynamic route ${newPathname} should be cached`);
      })
    );
    
    return response;
  }

  console.log(`Preceding with original request...`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_vercel|favicons|icons|favicon.ico|sitemap.xml|robots.txt|monitoring|.well-known).*)",
  ],
};