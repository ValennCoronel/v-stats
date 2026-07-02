import { NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function escapeCSV(val: any) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const POSITIONS: Record<string, string> = {
  SETTER: 'Armador',
  OUTSIDE_HITTER: 'Punta',
  OPPOSITE_HITTER: 'Opuesto',
  MIDDLE_BLOCKER: 'Central',
  LIBERO: 'Líbero',
  DEFENSIVE_SPECIALIST: 'Especialista',
};

const getPositionLabel = (pos: string) => POSITIONS[pos] || pos;

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      return new Response("No autenticado", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get("clubId")
    const teamId = searchParams.get("teamId")

    if (!clubId) {
      return new Response("El ID del club es requerido", { status: 400 })
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: { teams: true },
    })

    if (!club || club.ownerId !== authUser.userId) {
      return new Response("No autorizado", { status: 403 })
    }

    const requestedTeam = teamId ? club.teams.find((team: any) => team.id === teamId) : null
    if (teamId && !requestedTeam) {
      return new Response("Equipo no encontrado", { status: 404 })
    }

    const selectedTeam = requestedTeam ? { id: requestedTeam.id, name: requestedTeam.name } : null
    const teamIds = selectedTeam ? [selectedTeam.id] : club.teams.map((t: any) => t.id)

    let csvContent = "";

    if (teamIds.length === 0) {
      // Return empty stats CSV
      csvContent += "REPORT DE ESTADISTICAS\n";
      csvContent += `Club,${escapeCSV(club.name)}\n`;
      csvContent += "Equipo,Sin equipos creados\n\n";
      csvContent += "No hay datos para exportar.\n";
    } else {
      // 1. Matches statistics
      const matches = await prisma.match.findMany({
        where: { teamId: { in: teamIds }, status: "finished" },
        orderBy: { date: "desc" },
      })

      const totalMatches = matches.length
      const wins = matches.filter((m: any) => m.result === "WIN").length
      const losses = matches.filter((m: any) => m.result === "LOSS").length
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

      let setsWon = 0
      let setsLost = 0
      for (const match of matches) {
        if (match.finalScore) {
          const parts = match.finalScore.split("-")
          if (parts.length === 2) {
            setsWon += parseInt(parts[0], 10) || 0
            setsLost += parseInt(parts[1], 10) || 0
          }
        }
      }

      // 2. Player statistics (aggregate all PlayerMatchStats)
      const playerStats = await prisma.playerMatchStats.groupBy({
        by: ['playerId'],
        _sum: {
          puntos: true,
          ataquesPositivos: true,
          bloqueosPositivos: true,
          aces: true,
          erroresAtaque: true,
          erroresRecepcion: true,
          erroresSaque: true,
          bloqueosErrados: true,
          erroresTacticos: true,
          defensasPositivas: true,
          ventajasTacticas: true,
        },
        _count: {
          matchId: true,
        },
        where: {
          match: { teamId: { in: teamIds }, status: "finished" }
        }
      })

      // Fetch player names and info
      const playerIds = playerStats.map((s: any) => s.playerId)
      const playersInfo = await prisma.player.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, name: true, number: true, position: true }
      })

      const playerMap = new Map(playersInfo.map((p: any) => [p.id, p]))

      const topScorers = playerStats
        .map((stat: any) => {
          const player = playerMap.get(stat.playerId) || {}
          const totalPositive = (stat._sum.puntos || 0) + (stat._sum.ataquesPositivos || 0) + (stat._sum.bloqueosPositivos || 0) + (stat._sum.aces || 0) + (stat._sum.defensasPositivas || 0) + (stat._sum.ventajasTacticas || 0)
          const totalNegative = (stat._sum.erroresAtaque || 0) + (stat._sum.erroresRecepcion || 0) + (stat._sum.erroresSaque || 0) + (stat._sum.bloqueosErrados || 0) + (stat._sum.erroresTacticos || 0)
          const total = totalPositive + totalNegative
          const eficiencia = total > 0 ? Math.round((totalPositive / total) * 100) : 0

          return {
            ...player,
            puntos: stat._sum.puntos || 0,
            ataques: stat._sum.ataquesPositivos || 0,
            bloqueos: stat._sum.bloqueosPositivos || 0,
            aces: stat._sum.aces || 0,
            recepciones: stat._sum.defensasPositivas || 0,
            errores: totalNegative,
            eficiencia,
            matchesPlayed: stat._count.matchId,
          }
        })
        .filter((p: any) => p.name)
        .sort((a: any, b: any) => b.puntos - a.puntos)

      const attacks = playerStats.reduce((sum: any, stat: any) => sum + (stat._sum.ataquesPositivos || 0), 0)
      const defenses = playerStats.reduce((sum: any, stat: any) => sum + (stat._sum.defensasPositivas || 0), 0)
      const blocks = playerStats.reduce((sum: any, stat: any) => sum + (stat._sum.bloqueosPositivos || 0), 0)
      const aces = playerStats.reduce((sum: any, stat: any) => sum + (stat._sum.aces || 0), 0)
      const tacticalAdvantages = playerStats.reduce((sum: any, stat: any) => sum + (stat._sum.ventajasTacticas || 0), 0)

      const attackErrors = playerStats.reduce((sum: any, stat: any) => sum + (stat._sum.erroresAtaque || 0), 0)
      const receptionErrors = playerStats.reduce((sum: any, stat: any) => sum + (stat._sum.erroresRecepcion || 0), 0)
      const serveErrors = playerStats.reduce((sum: any, stat: any) => sum + (stat._sum.erroresSaque || 0), 0)

      const errors = playerStats.reduce((sum: any, stat: any) =>
        sum
        + (stat._sum.erroresAtaque || 0)
        + (stat._sum.erroresRecepcion || 0)
        + (stat._sum.erroresSaque || 0)
        + (stat._sum.bloqueosErrados || 0)
        + (stat._sum.erroresTacticos || 0),
      0)

      const positiveActions = attacks + defenses + blocks + aces + tacticalAdvantages
      const negativeActions = errors
      const totalActions = positiveActions + negativeActions

      const totalPoints = topScorers.reduce((sum: any, p: any) => sum + p.puntos, 0)
      const avgActionsPerPoint = totalPoints > 0 ? Number((totalActions / totalPoints).toFixed(1)) : 0
      const pointsPerMatch = totalMatches > 0 ? Number((totalPoints / totalMatches).toFixed(1)) : 0

      // Build CSV output
      csvContent += "REPORT DE ESTADISTICAS\n";
      csvContent += `Club,${escapeCSV(club.name)}\n`;
      csvContent += `Equipo,${escapeCSV(selectedTeam ? selectedTeam.name : "Todo el club")}\n\n`;

      csvContent += "ESTADISTICAS GENERALES\n";
      csvContent += `Partidos Jugados,${totalMatches}\n`;
      csvContent += `Partidos Ganados,${wins}\n`;
      csvContent += `Partidos Perdidos,${losses}\n`;
      csvContent += `Porcentaje de Victoria,${winRate}%\n`;
      csvContent += `Sets Ganados,${setsWon}\n`;
      csvContent += `Sets Perdidos,${setsLost}\n`;
      csvContent += `Puntos Totales,${totalPoints}\n`;
      csvContent += `Ataques Positivos,${attacks}\n`;
      csvContent += `Defensas Positivas,${defenses}\n`;
      csvContent += `Bloqueos Positivos,${blocks}\n`;
      csvContent += `Aces,${aces}\n`;
      csvContent += `Errores Totales,${errors}\n`;
      csvContent += `Errores de Ataque,${attackErrors}\n`;
      csvContent += `Errores de Recepcion,${receptionErrors}\n`;
      csvContent += `Errores de Saque,${serveErrors}\n`;
      csvContent += `Acciones Positivas,${positiveActions}\n`;
      csvContent += `Acciones Negativas,${negativeActions}\n`;
      csvContent += `Acciones Totales,${totalActions}\n`;
      csvContent += `Acciones por Punto,${avgActionsPerPoint}\n`;
      csvContent += `Puntos por Partido,${pointsPerMatch}\n\n`;

      csvContent += "JUGADORES\n";
      csvContent += "Nombre,Numero,Posicion,Partidos Jugados,Puntos,Ataques,Bloqueos,Aces,Defensas,Errores,Eficiencia (%)\n";

      for (const p of topScorers) {
        csvContent += `${escapeCSV(p.name)},${p.number},${escapeCSV(getPositionLabel(p.position))},${p.matchesPlayed},${p.puntos},${p.ataques},${p.bloqueos},${p.aces},${p.recepciones},${p.errores},${p.eficiencia}%\n`;
      }
    }

    const filename = `${club.name.replace(/\s+/g, '_')}_${selectedTeam ? selectedTeam.name.replace(/\s+/g, '_') : 'General'}_Stats.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Stats Export error:", error)
    return new Response("Error interno del servidor", { status: 500 })
  }
}
