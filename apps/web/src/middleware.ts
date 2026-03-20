import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has('access_token')

  // Redirect authenticated users away from auth pages
  if (hasSession && PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/overview', request.url))
  }

  // Redirect unauthenticated users to login for dashboard routes
  const isDashboard = !PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (!hasSession && isDashboard && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
