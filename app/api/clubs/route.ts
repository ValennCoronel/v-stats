import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/clubs — List all clubs for the user
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Dev workaround: if DB was reset, recreate the user
    let dbUser = await prisma.user.findUnique({ where: { id: authUser.userId } })
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: authUser.userId,
          email: authUser.email,
          passwordHash: "dummy",
          role: "COACH",
          displayName: "Coach",
        }
      })
    }

    const clubs = await prisma.club.findMany({
      where: { ownerId: authUser.userId },
      include: {
        teams: true,
      },
      orderBy: { createdAt: "asc" },
    })
    
    console.error("GET /api/clubs for user", authUser.userId, "found clubs:", clubs.length)

    return NextResponse.json({ clubs })
  } catch (error) {
    console.error("Clubs GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST /api/clubs — Create a new club
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Dev workaround: if DB was reset, recreate the user
    let dbUser = await prisma.user.findUnique({ where: { id: authUser.userId } })
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: authUser.userId,
          email: authUser.email,
          passwordHash: "dummy",
          role: "COACH",
          displayName: "Coach",
        }
      })
    }

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
