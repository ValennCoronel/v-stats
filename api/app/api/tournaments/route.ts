import { NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/tournaments — List tournaments (with optional search)
export async function GET(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
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

// PUT /api/tournaments — Update a tournament
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

    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament || tournament.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null

    const updated = await prisma.tournament.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ tournament: updated })
  } catch (error) {
    console.error("Tournaments PUT error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// DELETE /api/tournaments — Delete a tournament
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

    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament || tournament.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    await prisma.tournament.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Tournaments DELETE error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
