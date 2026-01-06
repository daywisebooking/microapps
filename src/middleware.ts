import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/browse", "/app", "/login", "/api"]
  
  // Routes that require authentication
  const protectedRoutes = ["/favorites", "/admin"]

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // For now, allow all routes (auth check will be done client-side)
  // In production, you'd check for auth token/cookie here
  // This is a placeholder - actual auth checking will be done in components
  
  if (isProtectedRoute && pathname.startsWith("/admin")) {
    // Admin routes require admin role - check will be done in the page component
    // Middleware can't easily check InstantDB auth, so we'll handle it in the page
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next (all Next.js internal routes)
     * - api (API routes)
     * - favicon.ico (favicon file)
     */
    "/((?!_next|api|favicon.ico).*)",
  ],
}

