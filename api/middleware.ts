import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "vstats-dev-secret-change-in-production"
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── CORS: Handle preflight (OPTIONS) for all /api routes ──
  if (pathname.startsWith("/api") && request.method === "OPTIONS") {
    const origin = request.headers.get("origin") ?? "*"
    const allowedOrigin = process.env.NODE_ENV === "production" && process.env.CORS_ALLOWED_ORIGINS
      ? (process.env.CORS_ALLOWED_ORIGINS.split(",").includes(origin) ? origin : "")
      : origin || "*"

    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    })
  }

  // ── API routes: add CORS headers to all responses ──
  if (pathname.startsWith("/api")) {
    const response = NextResponse.next()
    const origin = request.headers.get("origin") ?? "*"
    const allowedOrigin = process.env.NODE_ENV === "production" && process.env.CORS_ALLOWED_ORIGINS
      ? (process.env.CORS_ALLOWED_ORIGINS.split(",").includes(origin) ? origin : "")
      : origin || "*"

    response.headers.set("Access-Control-Allow-Origin", allowedOrigin)
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.set("Access-Control-Allow-Credentials", "true")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
}
