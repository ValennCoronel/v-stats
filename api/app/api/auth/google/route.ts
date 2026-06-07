import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { signToken, setAuthCookie } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json(
        { error: "Token de Google no proporcionado" },
        { status: 400 }
      )
    }

    // 1. Verify token with Google's tokeninfo API
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
    
    if (!googleRes.ok) {
      return NextResponse.json(
        { error: "Token de Google inválido o expirado" },
        { status: 401 }
      )
    }

    const payload = await googleRes.json()

    // 2. Ensure email is verified
    if (payload.email_verified !== "true" && payload.email_verified !== true) {
      return NextResponse.json(
        { error: "El email de Google no está verificado" },
        { status: 400 }
      )
    }

    const email = payload.email.toLowerCase()
    const name = payload.name || payload.given_name || "Usuario Google"

    // 3. Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Create user with a random secure password hash
      const randomPassword = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
      const passwordHash = await bcrypt.hash(randomPassword, 12)

      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName: name,
          role: "COACH",
        },
      })
    }

    // 4. Generate JWT token
    const jwtToken = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Set cookie
    await setAuthCookie(jwtToken)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
      token: jwtToken,
    })
  } catch (error) {
    console.error("Google Auth error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
