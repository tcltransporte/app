import { NextResponse } from 'next/server'

export function middleware(request) {

  const token = request.cookies.get('authorization')

  if (!token) {

    const loginUrl = new URL('/login', request.url)

    const pathname = request.nextUrl.pathname

    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname)
    }

    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - /login (public auth page)
     * - /_next (Next.js internals)
     * - /api (API routes)
     * - /assets (static assets)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!login|_next|api|assets|favicon.ico|sitemap.xml|robots.txt).*)'
  ]
}