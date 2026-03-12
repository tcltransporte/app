import { NextResponse } from 'next/server'

export function proxy(request) {

  const token = request.cookies.get('authorization')

  if (!token) {

    const loginUrl = new URL('/sign-in', request.url)

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
     * - /sign-in (public auth page)
     * - /_next (Next.js internals)
     * - /api (API routes)
     * - /assets (static assets)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!sign-in|redirect|_next|api|assets|favicon.ico|sitemap.xml|robots.txt).*)'
  ]
}