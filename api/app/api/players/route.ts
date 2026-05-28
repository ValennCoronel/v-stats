import { NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/players — List all players for a club or team
export async function GET(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get("clubId")
    const teamId = searchParams.get("teamId")

    if (!clubId) {
      return NextResponse.json({ error: "El ID del club es requerido" }, { status: 400 })
    }

    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club || club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const whereClause: any = { clubId }
    if (teamId) {
      whereClause.teamId = teamId
    }

    const players = await prisma.player.findMany({
      where: whereClause,
      orderBy: [
        { teamId: "asc" },
        { number: "asc" },
      ],
      include: {
        team: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ players })
  } catch (error) {
    console.error("Players GET error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST /api/players — Create a new player in a club
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { clubId, teamId, dni, name, number, position, injuryHistory, avatarUrl } = body

    if (!clubId || !teamId || !dni || !name || number === undefined || !position) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (club, equipo, dni, nombre, número, posición)" },
        { status: 400 }
      )
    }

    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club || club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Check unique DNI inside club
    const existingDni = await prisma.player.findUnique({
      where: { clubId_dni: { clubId, dni } },
    })

    if (existingDni) {
      return NextResponse.json(
        { error: `El DNI ${dni} ya está registrado en este club` },
        { status: 409 }
      )
    }

    const player = await prisma.player.create({
      data: {
        clubId,
        teamId,
        dni,
        name,
        number: parseInt(number),
        position,
        injuryHistory: injuryHistory || null,
        avatarUrl: avatarUrl || null,
      },
      include: {
        team: { select: { name: true } }
      }
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
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, teamId, dni, name, number, position, injuryHistory, avatarUrl, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "ID del jugador es requerido" }, { status: 400 })
    }

    const player = await prisma.player.findUnique({
      where: { id },
      include: { club: true },
    })

    if (!player || player.club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 })
    }

    // Check unique DNI if it changes
    if (dni !== undefined && dni !== player.dni) {
      const existing = await prisma.player.findUnique({
        where: {
          clubId_dni: { clubId: player.clubId, dni },
        },
      })
      if (existing) {
        return NextResponse.json(
          { error: `El DNI ${dni} ya está registrado en este club` },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    if (teamId !== undefined) updateData.teamId = teamId
    if (dni !== undefined) updateData.dni = dni
    if (name !== undefined) updateData.name = name
    if (number !== undefined) updateData.number = parseInt(number)
    if (position !== undefined) updateData.position = position
    if (injuryHistory !== undefined) updateData.injuryHistory = injuryHistory || null
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: updateData,
      include: {
        team: { select: { name: true } }
      }
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
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID del jugador es requerido" }, { status: 400 })
    }

    const player = await prisma.player.findUnique({
      where: { id },
      include: { club: true },
    })

    if (!player || player.club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 })
    }

    await prisma.player.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Players DELETE error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
