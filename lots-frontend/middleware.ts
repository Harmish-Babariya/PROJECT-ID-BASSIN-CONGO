import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicPaths = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register"]
  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith("/api/auth/")

  // If no token and trying to access protected route, redirect to /
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If has token and trying to access auth pages, redirect to dashboard
  if (token && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
