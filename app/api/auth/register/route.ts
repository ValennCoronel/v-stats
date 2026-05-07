import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { signToken, setAuthCookie } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName || null,
        role: "COACH",
      },
    })

    // Generate token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Set HTTP-only cookie
    await setAuthCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
