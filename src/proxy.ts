import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/login",
  "/register",
  "/api/auth",
  "/api/github/webhook",
  "/api/health",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    /\.(svg|png|jpg|jpeg|gif|ico|css|js|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check for session token (JWT strategy)
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!token) {
    // Redirect to login for page requests
    if (!pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Return 401 for API requests
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
