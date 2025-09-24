import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Admin routes protection would be handled by ProtectedRoute component on client-side
  // Since we're using Firebase auth, server-side auth is complex
  // For now, we rely on client-side protection only
  
  // You could add IP restrictions, rate limiting, or other server-side checks here
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}