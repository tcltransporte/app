import { NextResponse } from 'next/server';

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  const pathWithSearch = request.nextUrl.pathname + request.nextUrl.search;
  
  requestHeaders.set('x-invoke-path', pathWithSearch);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\.png$).*)'],
};
