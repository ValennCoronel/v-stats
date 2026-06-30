import { NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

async function ensureRecoveredUser(authUser: { userId: string; email: string }) {
  const existingUser = await prisma.user.findUnique({ where: { id: authUser.userId } })
  if (existingUser) {
    return existingUser
  }

  const passwordHash = await bcrypt.hash(`recovered:${authUser.userId}`, 12)

  return prisma.user.create({
    data: {
      id: authUser.userId,
      email: authUser.email,
      passwordHash,
      role: "COACH",
      displayName: "Coach",
    },
  })
}

// GET /api/clubs - List all clubs for the user
export async function GET(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    await ensureRecoveredUser(authUser)

    const clubs = await prisma.club.findMany({
      where: { ownerId: authUser.userId },
      include: {
        teams: {
          include: {
            _count: {
              select: { players: true, matches: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ clubs })
  } catch (error) {
    console.error("Clubs GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST /api/clubs - Create a new club
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    await ensureRecoveredUser(authUser)

    const body = await request.json()
    const { name, city, color, role } = body

    if (!name || !city) {
      return NextResponse.json({ error: "Nombre y ciudad son requeridos" }, { status: 400 })
    }

    const club = await prisma.club.create({
      data: {
        name,
        city,
        color: color || "#1E6FD9",
        role: role || "admin",
        ownerId: authUser.userId,
      },
      include: {
        teams: true,
      },
    })

    return NextResponse.json({ club }, { status: 201 })
  } catch (error) {
    console.error("Clubs POST error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
