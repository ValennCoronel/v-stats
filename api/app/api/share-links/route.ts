import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { getPublicBaseUrl } from "@/lib/public-url"
import { prisma } from "@/lib/prisma"

function createToken() {
  return randomBytes(24).toString("base64url")
}

const prismaClient = prisma as any

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const clubId = body?.clubId
    const teamId = body?.teamId

    if (!clubId || !teamId) {
      return NextResponse.json({ error: "clubId y teamId son requeridos" }, { status: 400 })
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    })

    if (!team || team.clubId !== clubId || team.club.ownerId !== authUser.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const teamShareLink = await prismaClient.teamShareLink.upsert({
      where: { teamId: team.id },
      update: {
        token: createToken(),
      },
      create: {
        token: createToken(),
        ownerId: authUser.userId,
        clubId,
        teamId: team.id,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const baseUrl = getPublicBaseUrl(request)
    const url = `${baseUrl}/share/${teamShareLink.token}`

    return NextResponse.json({
      shareLink: {
        id: teamShareLink.id,
        token: teamShareLink.token,
        url,
        createdAt: teamShareLink.createdAt,
        updatedAt: teamShareLink.updatedAt,
        team: teamShareLink.team,
      },
    })
  } catch (error) {
    console.error("Share links POST error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
