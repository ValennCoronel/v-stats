"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Pencil, 
  FileText,
  Calendar,
  Loader2,
  Trophy
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface MatchData {
  id: string
  date: string
  opponent: string
  result: "WIN" | "LOSS" | "DRAW" | null
  finalScore: string | null
  tournament: string | null
}

export function MatchHistory() {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches")
      if (res.ok) {
        const data = await res.json()
        setMatches(data.matches)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Historial de Partidos</h1>
        <p className="text-muted-foreground">Revisá y gestioná los partidos anteriores</p>
      </div>

      {/* Match History Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-foreground">Todos los Partidos</CardTitle>
          </div>
          <CardDescription>{matches.length} partidos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Aún no hay partidos registrados. ¡Jugá uno nuevo para empezar a ver estadísticas!
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-muted-foreground">Fecha</TableHead>
                      <TableHead className="text-muted-foreground">Rival</TableHead>
                      <TableHead className="text-muted-foreground">Torneo</TableHead>
                      <TableHead className="text-muted-foreground">Resultado</TableHead>
                      <TableHead className="text-muted-foreground">Score</TableHead>
                      <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id} className="border-border">
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(match.date), "dd MMM, yyyy", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {match.opponent}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {match.tournament || "-"}
                        </TableCell>
                        <TableCell>
                          {match.result && (
                            <Badge 
                              variant={match.result === "WIN" ? "default" : "destructive"}
                              className={match.result === "WIN" ? "bg-success text-success-foreground" : ""}
                            >
                              {match.result === "WIN" ? "Victoria" : match.result === "LOSS" ? "Derrota" : "Empate"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-foreground">
                          {match.finalScore || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="gap-2" disabled>
                              <Pencil className="h-3 w-3" />
                              Editar
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" disabled>
                              <FileText className="h-3 w-3" />
                              Reporte
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="rounded-lg bg-muted/50 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{match.opponent}</span>
                          {match.result && (
                            <Badge 
                              variant={match.result === "WIN" ? "default" : "destructive"}
                              className={match.result === "WIN" ? "bg-success text-success-foreground" : ""}
                            >
                              {match.result === "WIN" ? "W" : match.result === "LOSS" ? "L" : "D"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{match.tournament || "Amistoso"}</p>
                      </div>
                      <span className="font-mono font-semibold text-lg text-foreground">
                        {match.finalScore || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(match.date), "dd MMM, yyyy", { locale: es })}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 gap-1" disabled>
                          <Pencil className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-1" disabled>
                          <FileText className="h-3 w-3" />
                          Reporte
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
