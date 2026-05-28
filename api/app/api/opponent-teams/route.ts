import { NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/opponent-teams — List opponent teams (with optional search)
export async function GET(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim()

    const teams = await prisma.opponentTeam.findMany({
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

    return NextResponse.json({ teams })
  } catch (error) {
    console.error("OpponentTeams GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST /api/opponent-teams — Create a new opponent team
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
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

    const team = await prisma.opponentTeam.create({
      data: {
        name: name.trim(),
        logoUrl: logoUrl || null,
        ownerId: authUser.userId,
      },
    })

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error("OpponentTeams POST error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// PUT /api/opponent-teams — Update an opponent team
export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, logoUrl } = body

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 })
    }

    const team = await prisma.opponentTeam.findUnique({ where: { id } })
    if (!team || team.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null

    const updated = await prisma.opponentTeam.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ team: updated })
  } catch (error) {
    console.error("OpponentTeams PUT error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// DELETE /api/opponent-teams — Delete an opponent team
export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 })
    }

    const team = await prisma.opponentTeam.findUnique({ where: { id } })
    if (!team || team.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    await prisma.opponentTeam.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("OpponentTeams DELETE error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
