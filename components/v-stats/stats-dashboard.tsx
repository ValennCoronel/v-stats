"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Link2, 
  TrendingUp, 
  Trophy, 
  Target, 
  Users,
  ChevronRight,
  Loader2
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface StatData {
  totalMatches: number
  winRate: number
  setsWon: number
  topScorers: any[]
  recentMatches: any[]
}

export function StatsDashboard() {
  const [stats, setStats] = useState<StatData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activePlayers, setActivePlayers] = useState(0)
  const router = useRouter()

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, playersRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/players")
      ])
      
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
      
      if (playersRes.ok) {
        const data = await playersRes.json()
        const activeCount = data.players.filter((p: any) => p.isActive).length
        setActivePlayers(activeCount)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const getInitials = (name: string) => 
    name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "??"

  const statsCards = [
    { label: "Tasa de Victorias", value: `${stats?.winRate || 0}%`, change: "Histórico", icon: TrendingUp },
    { label: "Partidos Jugados", value: stats?.totalMatches || 0, change: "Total", icon: Trophy },
    { label: "Sets Ganados", value: stats?.setsWon || 0, change: "Total", icon: Target },
    { label: "Jugadores Activos", value: activePlayers, change: "En el equipo", icon: Users },
  ]

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Rendimiento de tu equipo de un vistazo</p>
        </div>
        <Button className="bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white gap-2" disabled>
          <Link2 className="h-4 w-4" />
          Compartir Enlace Público
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Matches & Top Players */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Matches */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Partidos Recientes</CardTitle>
                <CardDescription>Tus últimos 3 resultados</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/history")}>
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!stats?.recentMatches || stats.recentMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay partidos recientes</p>
            ) : (
              stats.recentMatches.map((match: any, index: number) => (
                <div
                  key={match.id || index}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={match.result === "WIN" ? "default" : "destructive"}
                      className={match.result === "WIN" ? "bg-success text-success-foreground" : ""}
                    >
                      {match.result === "WIN" ? "W" : match.result === "LOSS" ? "L" : "D"}
                    </Badge>
                    <div>
                      <p className="font-medium text-foreground">{match.opponent}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(match.date), "dd MMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-lg font-semibold text-foreground">
                    {match.finalScore || "-"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Players */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Top Jugadores</CardTitle>
                <CardDescription>Los máximos anotadores (Total puntos)</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/team")}>
                Ver Plantel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!stats?.topScorers || stats.topScorers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay estadísticas de jugadores aún</p>
            ) : (
              stats.topScorers.map((player: any, index: number) => (
                <div
                  key={player.id || index}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3 sm:p-4"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center justify-center w-6 text-sm font-bold text-muted-foreground">
                      #{index + 1}
                    </div>
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/20">
                      <AvatarImage src={player.avatarUrl || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm sm:text-base text-foreground">{player.name}</p>
                      <div className="flex gap-2 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                        <span title="Ataques positivos">Ata: {player.ataques}</span>
                        <span title="Bloqueos positivos">Blo: {player.bloqueos}</span>
                        <span title="Aces">Ace: {player.aces}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="font-semibold text-base sm:text-lg text-[#0a67ec]">{player.puntos}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground block -mt-1">pts</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
