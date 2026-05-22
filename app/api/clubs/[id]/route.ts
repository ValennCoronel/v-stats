import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/clubs/[id] — Update a club
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, city, color, role } = body

    const club = await prisma.club.findUnique({ where: { id } })
    if (!club || club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (city) updateData.city = city
    if (color) updateData.color = color
    if (role) updateData.role = role

    const updatedClub = await prisma.club.update({
      where: { id },
      data: updateData,
      include: { teams: true },
    })

    return NextResponse.json({ club: updatedClub })
  } catch (error) {
    console.error("Clubs PUT error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// DELETE /api/clubs/[id] — Delete a club
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = params

    const club = await prisma.club.findUnique({ where: { id } })
    if (!club || club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 })
    }

    await prisma.club.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Clubs DELETE error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
