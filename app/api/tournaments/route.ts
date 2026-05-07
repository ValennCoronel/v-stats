import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/tournaments — List tournaments (with optional search)
export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim()

    const tournaments = await prisma.tournament.findMany({
      where: {
        ownerId: authUser.userId,
        ...(search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : {}),
      },
      orderBy: [
        { lastUsedAt: { sort: "desc", nulls: "last" } },
        { name: "asc" },
      ],
    })

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error("Tournaments GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST /api/tournaments — Create a new tournament
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, logoUrl } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      )
    }

    const tournament = await prisma.tournament.create({
      data: {
        name: name.trim(),
        logoUrl: logoUrl || null,
        ownerId: authUser.userId,
      },
    })

    return NextResponse.json({ tournament }, { status: 201 })
  } catch (error) {
    console.error("Tournaments POST error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
