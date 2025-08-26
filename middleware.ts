import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const isAuth = req.cookies.get('sb-access-token')?.value
  const isAuthPath = req.nextUrl.pathname.startsWith('/login')

  if (!isAuth && !isAuthPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isAuth && isAuthPath) {
    return NextResponse.redirect(new URL('/kanban', req.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next|favicon.ico|api).*)'] }

