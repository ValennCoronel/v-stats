import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/tournaments/[id] — Update tournament
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, logoUrl } = body

    // Verify ownership
    const existing = await prisma.tournament.findFirst({
      where: { id, ownerId: authUser.userId },
    })

    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const updateData: { name?: string; logoUrl?: string | null } = {}
    if (name !== undefined) updateData.name = name.trim()
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl

    const tournament = await prisma.tournament.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error("Tournaments PUT error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// DELETE /api/tournaments/[id] — Delete tournament
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.tournament.findFirst({
      where: { id, ownerId: authUser.userId },
    })

    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    // Check if any matches reference this tournament by name
    const matchCount = await prisma.match.count({
      where: {
        tournament: existing.name,
        team: { ownerId: authUser.userId },
      },
    })

    if (matchCount > 0) {
      return NextResponse.json(
        {
          error: `Este torneo tiene ${matchCount} partido(s) asociado(s). Si lo eliminás, perderás acceso a esas estadísticas.`,
          matchCount,
          hasMatches: true,
        },
        { status: 409 }
      )
    }

    await prisma.tournament.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Tournaments DELETE error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
