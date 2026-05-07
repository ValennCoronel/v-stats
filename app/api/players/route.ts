import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/players — List all players for the user's team
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Find user's team
    const team = await prisma.team.findFirst({
      where: { ownerId: authUser.userId },
    })

    if (!team) {
      return NextResponse.json({ players: [] })
    }

    const players = await prisma.player.findMany({
      where: { teamId: team.id },
      orderBy: { number: "asc" },
    })

    return NextResponse.json({ players, teamId: team.id })
  } catch (error) {
    console.error("Players GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST /api/players — Create a new player
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, number, position, injuryHistory, avatarUrl } = body

    if (!name || number === undefined || !position) {
      return NextResponse.json(
        { error: "Nombre, número y posición son requeridos" },
        { status: 400 }
      )
    }

    // Find user's team (auto-create if needed)
    let team = await prisma.team.findFirst({
      where: { ownerId: authUser.userId },
    })

    if (!team) {
      team = await prisma.team.create({
        data: { name: "Mi Equipo", ownerId: authUser.userId },
      })
    }

    // Check for duplicate jersey number
    const existingPlayer = await prisma.player.findUnique({
      where: { teamId_number: { teamId: team.id, number: parseInt(number) } },
    })

    if (existingPlayer) {
      return NextResponse.json(
        { error: `Ya existe un jugador con el número #${number}` },
        { status: 409 }
      )
    }

    const player = await prisma.player.create({
      data: {
        teamId: team.id,
        name,
        number: parseInt(number),
        position,
        injuryHistory: injuryHistory || null,
        avatarUrl: avatarUrl || null,
      },
    })

    return NextResponse.json({ player }, { status: 201 })
  } catch (error) {
    console.error("Players POST error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// PUT /api/players — Update a player
export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, number, position, injuryHistory, avatarUrl, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "ID del jugador es requerido" }, { status: 400 })
    }

    // Verify ownership
    const player = await prisma.player.findUnique({
      where: { id },
      include: { team: true },
    })

    if (!player || player.team.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 })
    }

    // Check jersey number conflict if changing number
    if (number !== undefined && parseInt(number) !== player.number) {
      const existing = await prisma.player.findUnique({
        where: {
          teamId_number: { teamId: player.teamId, number: parseInt(number) },
        },
      })
      if (existing) {
        return NextResponse.json(
          { error: `Ya existe un jugador con el número #${number}` },
          { status: 409 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (number !== undefined) updateData.number = parseInt(number)
    if (position !== undefined) updateData.position = position
    if (injuryHistory !== undefined) updateData.injuryHistory = injuryHistory || null
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ player: updatedPlayer })
  } catch (error) {
    console.error("Players PUT error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// DELETE /api/players — Delete a player
export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID del jugador es requerido" }, { status: 400 })
    }

    // Verify ownership
    const player = await prisma.player.findUnique({
      where: { id },
      include: { team: true },
    })

    if (!player || player.team.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 })
    }

    await prisma.player.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Players DELETE error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
