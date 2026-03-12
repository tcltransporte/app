import { NextResponse } from 'next/server'

export function middleware(request) {

  const token = request.cookies.get('authorization')

  if (!token) {

    const loginUrl = new URL('/login', request.url)

    const pathname = request.nextUrl.pathname
    const fullPath = pathname + (request.nextUrl.search || '')

    if (fullPath !== '/') {
      loginUrl.searchParams.set('redirect', fullPath)
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
    '/((?!login|redirect|_next|api|assets|favicon.ico|sitemap.xml|robots.txt).*)'
  ]
}