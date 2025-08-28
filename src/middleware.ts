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
    console.log(`Redirecting to ${newUrl}`);
    return NextResponse.redirect(newUrl);
    // console.log(`Rewriting to ${newUrl}`);
    // return NextResponse.rewrite(newUrl);
  }

  console.log(`Preceding with original request...`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_vercel|favicons|icons|favicon.ico|sitemap.xml|robots.txt|monitoring|.well-known).*)",
  ],
};
