import { NextResponse } from "next/server"

const ALLOWED_ORIGINS = [
  "http://localhost:8081",       // Expo dev
  "http://localhost:19006",      // Expo web
  "exp://192.168.0.0:8081",      // Expo Go (placeholder, any IP)
]

/**
 * Add CORS headers to a NextResponse.
 * Accepts any origin in dev; restrict in production via env var.
 */
export function withCors(response: NextResponse, request?: Request): NextResponse {
  const origin = request?.headers.get("origin") ?? "*"

  // In development, allow all origins. In production, restrict.
  const allowedOrigin =
    process.env.NODE_ENV === "production" && process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(",").includes(origin)
        ? origin
        : ""
      : origin || "*"

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin)
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  response.headers.set("Access-Control-Allow-Credentials", "true")
  response.headers.set("Access-Control-Max-Age", "86400")

  return response
}

/**
 * Handle CORS preflight (OPTIONS) requests.
 */
export function handlePreflight(request: Request): NextResponse {
  const response = new NextResponse(null, { status: 204 })
  return withCors(response, request)
}
