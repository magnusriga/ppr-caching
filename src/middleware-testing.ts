import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";

export default async function middleware(
  req: NextRequest,
  _event: NextFetchEvent,
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
    console.log(`🔄 Rewriting: ${pathname} -> /${subdomain}${pathname}`);
    
    // MEGA HACK: Instead of rewriting to arbitrary subdomains like /mag/, 
    // rewrite to a known existing route that Next.js will cache
    // We'll use /fooz/ as the "canonical" route since it exists in generateStaticParams
    const canonicalRoute = pathname === '/' ? '/fooz' : `/fooz${pathname}`;
    const canonicalUrl = new URL(canonicalRoute, req.url);
    
    console.log(`🎯 CANONICAL REWRITE: ${pathname} -> ${canonicalRoute} (for caching)`);
    
    const response = NextResponse.rewrite(canonicalUrl, {
      request: {
        headers: new Headers({
          ...Object.fromEntries(req.headers.entries()),
          'x-original-subdomain': subdomain,
          'x-original-pathname': pathname,
          'x-canonical-route': canonicalRoute,
          'x-actual-subdomain': subdomain, // Track what subdomain this really is
        })
      }
    });
    
    // Set headers so we can identify this later
    response.headers.set('x-original-subdomain', subdomain);
    response.headers.set('x-original-pathname', pathname);
    response.headers.set('x-canonical-route', canonicalRoute);
    response.headers.set('x-actual-subdomain', subdomain);
    
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
