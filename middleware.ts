import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "vstats-dev-secret-change-in-production"
)

const protectedPaths = ["/dashboard", "/match", "/team", "/history", "/settings"]
const authPaths = ["/login"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("vstats-token")?.value

  // Check if path is protected
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
  const isAuthPage = authPaths.some((path) => pathname === path)

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      await jwtVerify(token, JWT_SECRET)
      return NextResponse.next()
    } catch {
      // Invalid token — redirect to login
      const loginUrl = new URL("/login", request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete("vstats-token")
      return response
    }
  }

  if (isAuthPage && token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      // Valid token — redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } catch {
      // Invalid token — let them see login
      const response = NextResponse.next()
      response.cookies.delete("vstats-token")
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/match/:path*",
    "/team/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/login",
  ],
}
