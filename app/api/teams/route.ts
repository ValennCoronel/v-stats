import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/teams — Get teams for a club
export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get("clubId")

    if (!clubId) {
      return NextResponse.json({ error: "El ID del club es requerido" }, { status: 400 })
    }

    // Verify user owns the club
    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club || club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "Club no encontrado o no tienes permiso" }, { status: 403 })
    }

    const teams = await prisma.team.findMany({
      where: { clubId },
      orderBy: { createdAt: "asc" },
      include: {
        players: true,
        matches: true,
      }
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error("Teams GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST /api/teams — Create a new team in a club
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { clubId, name, logoUrl } = body

    if (!clubId || !name) {
      return NextResponse.json({ error: "ID de club y nombre son requeridos" }, { status: 400 })
    }

    // Verify user owns the club
    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club || club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "Club no encontrado o no tienes permiso" }, { status: 403 })
    }

    const team = await prisma.team.create({
      data: {
        clubId,
        name,
        logoUrl: logoUrl || null,
      },
    })

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error("Teams POST error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// PUT /api/teams — Update team name and/or logo
export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, logoUrl } = body

    if (!id) {
      return NextResponse.json({ error: "ID del equipo es requerido" }, { status: 400 })
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: { club: true },
    })

    if (!team || team.club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }

    const updateData: { name?: string; logoUrl?: string | null } = {}
    if (name !== undefined) updateData.name = name
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl

    const updatedTeam = await prisma.team.update({
      where: { id: team.id },
      data: updateData,
    })

    return NextResponse.json({ team: updatedTeam })
  } catch (error) {
    console.error("Teams PUT error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// DELETE /api/teams — Delete a team
export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID del equipo es requerido" }, { status: 400 })
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: { club: true },
    })

    if (!team || team.club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }

    await prisma.team.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Teams DELETE error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
