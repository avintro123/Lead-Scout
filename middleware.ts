import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // 1. Skip static assets, favicon, Next.js internal files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // 2. CSRF & Same-Origin Protection for mutating requests
  if (["POST", "DELETE", "PUT", "PATCH"].includes(method) && pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        // Ensure origin hostname matches host
        if (originUrl.host !== host) {
          return NextResponse.json(
            { error: "Forbidden: Cross-Origin Request Blocked" },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Forbidden: Malformed Origin Header" },
          { status: 403 }
        );
      }
    }
  }

  const response = NextResponse.next();

  // 3. Defensive Response Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
