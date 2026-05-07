import { NextResponse } from "next/server"
import { removeAuthCookie } from "@/lib/auth"

export async function POST() {
  await removeAuthCookie()
  return NextResponse.json({ success: true })
}

// GET /api/auth/logout — for browser redirect (clears cookie and sends to login)
export async function GET() {
  await removeAuthCookie()
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"))
}
