import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicPaths = ["/", "/login"]
  const isPublicPath =
    publicPaths.includes(pathname) ||
    pathname.startsWith("/verify-invite") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/seed")

  // Unauthenticated user trying to access protected route -> redirect to login
  if (!token && !isPublicPath) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user trying to access auth pages -> redirect to dashboard
  if (token && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
