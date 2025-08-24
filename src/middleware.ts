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

  // Get the actual host header from the request (what the browser sent)
  const hostHeader = req.headers.get("host") || "";

  // Remove port if present
  const hostWithoutPort = hostHeader.split(":")[0];
  const hostParts = hostWithoutPort.split(".");
  let subdomain: string | null = null;

  // List of hostnames that should never have subdomains extracted
  const noSubdomainHosts = ["localhost", "127.0.0.1", "0.0.0.0"];

  // Check if we have a subdomain
  if (noSubdomainHosts.includes(hostWithoutPort)) {
    // These hosts never have subdomains
    subdomain = null;
  } else if (hostParts.length === 2 && hostParts[1] === "localhost") {
    // For domains like subdomain.localhost (local development)
    subdomain = hostParts[0];
  } else if (hostParts.length >= 3) {
    // For domains like `subdomain.example.com`.
    // Exclude `www` as it's not really a subdomain for our purposes.
    if (hostParts[0] !== "www") {
      subdomain = hostParts[0];
    }
  }
  // Single-part domains have no subdomain

  console.log(
    `req.url "${req.url}", middleware host header "${hostHeader}", host without port "${hostWithoutPort}", subdomain "${subdomain}", pathname "${pathname}"`,
  );

  // Create a normalized URL without subdomain for consistent caching
  const normalizedUrl = new URL(req.url);
  if (subdomain) {
    // Remove subdomain from host for cache consistency
    const baseHost = hostParts.slice(1).join(".");
    normalizedUrl.hostname = baseHost;
  }

  if (!subdomain || subdomain.length < 2) {
    subdomain = "nfrontacademy";
  }

  if (!pathname.includes(subdomain)) {
    // http://0.0.0.0:3001/
    // const newUrl = new URL(`/${subdomain}${pathname}`, `http://${hostHeader}`);
    const newUrl = new URL(`/${subdomain}${pathname}`, req.url);
    console.log(`Rewriting to ${newUrl}`);
    return NextResponse.redirect(newUrl);

    // console.log(`Rewriting to ${rewriteUrl}`);
    //
    // const headers = new Headers(req.headers);
    // headers.set("x-original-url", req.url);
    // headers.set("x-original-pathname", pathname);
    //
    // return NextResponse.rewrite(rewriteUrl, {
    //   request: {
    //     headers: headers,
    //   },
    // });
  }

  console.log(`Preceding with original reques`);
  return NextResponse.next();

  // Rewrite to `/<subdomain>`.
  // if (subdomain) {
  //   const rewriteUrl = new URL(`/${subdomain}${pathname}`, normalizedUrl);
  //   console.log(`Rewriting to ${rewriteUrl}`);
  //
  //   // Create new headers with original URL for caching consistency
  //   const headers = new Headers(req.headers);
  //   headers.set("x-original-url", req.url);
  //   headers.set("x-original-pathname", pathname);
  //
  //   return NextResponse.rewrite(rewriteUrl, {
  //     request: {
  //       headers: headers,
  //     },
  //   });
  // } else {
  //   const rewriteUrl = new URL(`/nfrontacademy${pathname}`, normalizedUrl);
  //   console.log(`Rewriting to ${rewriteUrl}`);
  //
  //   // Create new headers with original URL for caching consistency
  //   const headers = new Headers(req.headers);
  //   headers.set("x-original-url", req.url);
  //   headers.set("x-original-pathname", pathname);
  //
  //   return NextResponse.redirect(rewriteUrl);
  //   // return NextResponse.rewrite(rewriteUrl, {
  //   //   request: {
  //   //     headers: headers,
  //   //   },
  //   // });
  // }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_vercel|favicons|icons|favicon.ico|sitemap.xml|robots.txt|monitoring|.well-known).*)",
  ],
};
