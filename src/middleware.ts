import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that need auth (client-side check only for SSR pages)
  const protectedPaths = ["/dashboard"];
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    // For API routes, auth is checked server-side via authenticate()
    // For pages, auth is checked client-side via localStorage
    // Middleware just ensures no caching of protected pages
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
