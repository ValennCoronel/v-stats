import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getTeamDashboardStats } from "@/lib/team-stats"

export const dynamic = "force-dynamic"

const prismaClient = prisma as any

const POSITIONS: Record<string, string> = {
  SETTER: "Armador",
  OUTSIDE_HITTER: "Punta",
  OPPOSITE_HITTER: "Opuesto",
  MIDDLE_BLOCKER: "Central",
  LIBERO: "Libero",
  DEFENSIVE_SPECIALIST: "Especialista",
}

function getPositionLabel(position: string) {
  return POSITIONS[position] || position
}

function getEfficiencyColor(value: number) {
  if (value >= 65) return "#0f9f6e"
  if (value >= 50) return "#d97706"
  return "#dc2626"
}

function getRecordTone(result: string | null) {
  if (result === "WIN") return { background: "#dcfce7", color: "#166534", label: "Victoria" }
  if (result === "LOSS") return { background: "#fee2e2", color: "#991b1b", label: "Derrota" }
  return { background: "#e2e8f0", color: "#334155", label: "Partido" }
}

export default async function SharedTeamStatsPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const shareLink = await prismaClient.teamShareLink.findUnique({
    where: { token },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          city: true,
          color: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!shareLink) {
    notFound()
  }

  const stats = await getTeamDashboardStats(shareLink.clubId, shareLink.teamId)
  if (!stats) {
    notFound()
  }

  const accentColor = shareLink.club.color || "#1E6FD9"
  const recentMatches = stats.recentMatches
  const players = stats.topScorers
  const totalSets = stats.setsWon + stats.setsLost

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(30,111,217,0.14), transparent 36%), linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
        color: "#0f172a",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 64px" }}>
        <section
          style={{
            borderRadius: 28,
            padding: "28px 24px",
            background: `linear-gradient(135deg, ${accentColor} 0%, #0f172a 100%)`,
            color: "#fff",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.72, textTransform: "uppercase" }}>
                Estadisticas compartidas
              </div>
              <h1 style={{ margin: "12px 0 8px", fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1 }}>
                {shareLink.team.name}
              </h1>
              <p style={{ margin: 0, fontSize: 16, opacity: 0.8 }}>
                {shareLink.club.name} - {shareLink.club.city}
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(120px, 1fr))",
                gap: 12,
                minWidth: 260,
                flex: "1 1 280px",
              }}
            >
              {[
                { label: "Partidos", value: stats.totalMatches },
                { label: "Victorias", value: stats.wins },
                { label: "Win rate", value: `${stats.winRate}%` },
                { label: "Puntos", value: stats.totalPoints },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: 20,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.72, textTransform: "uppercase", letterSpacing: 1.2 }}>{item.label}</div>
                  <div style={{ marginTop: 6, fontSize: 28, fontWeight: 800 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >
          {[
            { label: "Sets", value: `${stats.setsWon}-${stats.setsLost}`, detail: totalSets > 0 ? `${Math.round((stats.setsWon / totalSets) * 100)}% ganados` : "Sin sets cargados" },
            { label: "Acciones positivas", value: stats.positiveActions, detail: `${stats.avgActionsPerPoint} acciones por punto` },
            { label: "Errores", value: stats.errors, detail: `${stats.serveErrors} saques - ${stats.receptionErrors} recepciones` },
            { label: "Promedio", value: stats.pointsPerMatch, detail: "puntos por partido" },
          ].map((card) => (
            <article
              key={card.label}
              style={{
                background: "#fff",
                borderRadius: 22,
                padding: 20,
                border: "1px solid #dbe7ff",
                boxShadow: "0 12px 30px rgba(30, 64, 175, 0.08)",
              }}
            >
              <div style={{ fontSize: 12, letterSpacing: 1.3, color: "#64748b", textTransform: "uppercase" }}>{card.label}</div>
              <div style={{ marginTop: 10, fontSize: 34, fontWeight: 800, color: "#0f172a" }}>{card.value}</div>
              <div style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>{card.detail}</div>
            </article>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 24 }}>
          <article
            style={{
              background: "#fff",
              borderRadius: 26,
              padding: 24,
              border: "1px solid #dbe7ff",
              boxShadow: "0 14px 36px rgba(30, 64, 175, 0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: 1.3, color: "#64748b", textTransform: "uppercase" }}>Rendimiento del plantel</div>
                <h2 style={{ margin: "10px 0 0", fontSize: 28 }}>Jugadoras y jugadores destacados</h2>
              </div>
              <div style={{ fontSize: 14, color: "#475569" }}>{players.length} con estadisticas registradas</div>
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              {players.length > 0 ? players.map((player, index) => (
                <div
                  key={player.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px 1fr auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "14px 16px",
                    borderRadius: 18,
                    background: index < 3 ? "linear-gradient(90deg, rgba(30,111,217,0.08), rgba(255,255,255,1))" : "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      background: accentColor,
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    #{player.number}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{player.name}</div>
                    <div style={{ marginTop: 4, color: "#64748b", fontSize: 14 }}>
                      {getPositionLabel(player.position)} - {player.matchesPlayed} {player.matchesPlayed === 1 ? "partido" : "partidos"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{player.puntos}</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: getEfficiencyColor(player.eficiencia) }}>
                      {player.eficiencia}% eficiencia
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: "28px 4px", color: "#64748b" }}>
                  Todavia no hay estadisticas individuales cargadas para este equipo.
                </div>
              )}
            </div>
          </article>

          <article
            style={{
              background: "#fff",
              borderRadius: 26,
              padding: 24,
              border: "1px solid #dbe7ff",
              boxShadow: "0 14px 36px rgba(30, 64, 175, 0.08)",
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: 1.3, color: "#64748b", textTransform: "uppercase" }}>Ultimos partidos</div>
            <h2 style={{ margin: "10px 0 0", fontSize: 28 }}>Historial reciente</h2>

            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              {recentMatches.length > 0 ? recentMatches.map((match) => {
                const tone = getRecordTone(match.result)
                return (
                  <div
                    key={match.id}
                    style={{
                      borderRadius: 18,
                      padding: 16,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                          vs {match.opponentTeam?.name || match.opponent}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: "#64748b" }}>
                          {new Date(match.date).toLocaleDateString("es-AR")}
                        </div>
                      </div>
                      <span
                        style={{
                          background: tone.background,
                          color: tone.color,
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {tone.label}
                      </span>
                    </div>
                    <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
                      <div style={{ fontSize: 28, fontWeight: 800 }}>{match.finalScore || "-"}</div>
                      <div style={{ textAlign: "right", color: "#64748b", fontSize: 13 }}>
                        {match.tournamentRef?.name || "Sin torneo"}
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <div style={{ padding: "28px 4px", color: "#64748b" }}>
                  El equipo todavia no tiene partidos finalizados para mostrar.
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}
