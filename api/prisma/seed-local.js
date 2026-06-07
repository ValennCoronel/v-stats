const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const TRAINER_EMAIL = "trainer@vstats.local";
const TRAINER_PASSWORD = "trainer1234";

const teams = [
  {
    id: "local-team-u18-femenino",
    name: "Sub 18 Femenino",
    players: [
      ["40100001", "Martina Alvarez", 1, "SETTER"],
      ["40100002", "Sofia Benitez", 4, "OUTSIDE_HITTER"],
      ["40100003", "Valentina Castro", 7, "MIDDLE_BLOCKER"],
      ["40100004", "Camila Duarte", 9, "OPPOSITE_HITTER"],
      ["40100005", "Lucia Fernandez", 11, "LIBERO"],
      ["40100006", "Emilia Garcia", 14, "DEFENSIVE_SPECIALIST"],
      ["40100007", "Julieta Herrera", 16, "OUTSIDE_HITTER"],
    ],
  },
  {
    id: "local-team-primera-masculino",
    name: "Primera Masculino",
    players: [
      ["40200001", "Nicolas Ibarra", 2, "SETTER"],
      ["40200002", "Mateo Lopez", 5, "OUTSIDE_HITTER"],
      ["40200003", "Tomas Molina", 8, "MIDDLE_BLOCKER"],
      ["40200004", "Santiago Navarro", 10, "OPPOSITE_HITTER"],
      ["40200005", "Facundo Ortega", 12, "LIBERO"],
      ["40200006", "Bruno Pereira", 15, "DEFENSIVE_SPECIALIST"],
      ["40200007", "Joaquin Rios", 18, "OUTSIDE_HITTER"],
    ],
  },
];

const matchSeeds = [
  {
    id: "local-match-u18-001",
    teamId: "local-team-u18-femenino",
    opponentId: "local-opponent-river-sur",
    opponent: "River Sur",
    tournamentId: "local-tournament-liga-metropolitana-2026",
    tournament: "Liga Metropolitana 2026",
    date: "2026-05-16T18:00:00.000Z",
    result: "WIN",
    finalScore: "3-1",
    setScores: [
      { teamPts: 25, oppPts: 20 },
      { teamPts: 22, oppPts: 25 },
      { teamPts: 25, oppPts: 18 },
      { teamPts: 25, oppPts: 21 },
    ],
    stats: [
      ["40100001", { puntos: 6, ataquesPositivos: 2, ventajasTacticas: 11, defensasPositivas: 7, bloqueosPositivos: 1, aces: 3, erroresAtaque: 1, erroresRecepcion: 0, erroresSaque: 2 }],
      ["40100002", { puntos: 18, ataquesPositivos: 15, ventajasTacticas: 4, defensasPositivas: 10, bloqueosPositivos: 1, aces: 2, erroresAtaque: 4, erroresRecepcion: 2, erroresSaque: 1 }],
      ["40100003", { puntos: 12, ataquesPositivos: 7, ventajasTacticas: 2, defensasPositivas: 3, bloqueosPositivos: 5, aces: 0, bloqueosErrados: 1, erroresAtaque: 2 }],
      ["40100004", { puntos: 15, ataquesPositivos: 12, ventajasTacticas: 3, defensasPositivas: 5, bloqueosPositivos: 2, aces: 1, erroresAtaque: 3, erroresSaque: 2 }],
      ["40100005", { puntos: 2, ataquesPositivos: 0, ventajasTacticas: 5, defensasPositivas: 19, bloqueosPositivos: 0, aces: 2, erroresRecepcion: 2 }],
      ["40100007", { puntos: 9, ataquesPositivos: 8, ventajasTacticas: 2, defensasPositivas: 6, bloqueosPositivos: 0, aces: 1, erroresAtaque: 2, erroresRecepcion: 1 }],
    ],
  },
  {
    id: "local-match-u18-002",
    teamId: "local-team-u18-femenino",
    opponentId: "local-opponent-boca-norte",
    opponent: "Boca Norte",
    tournamentId: "local-tournament-copa-apertura",
    tournament: "Copa Apertura",
    date: "2026-05-23T17:30:00.000Z",
    result: "LOSS",
    finalScore: "2-3",
    setScores: [
      { teamPts: 25, oppPts: 21 },
      { teamPts: 19, oppPts: 25 },
      { teamPts: 25, oppPts: 23 },
      { teamPts: 21, oppPts: 25 },
      { teamPts: 12, oppPts: 15 },
    ],
    stats: [
      ["40100001", { puntos: 4, ataquesPositivos: 1, ventajasTacticas: 13, defensasPositivas: 8, aces: 2, erroresSaque: 3, erroresTacticos: 1 }],
      ["40100002", { puntos: 20, ataquesPositivos: 17, ventajasTacticas: 3, defensasPositivas: 12, bloqueosPositivos: 1, aces: 2, erroresAtaque: 6, erroresRecepcion: 3 }],
      ["40100003", { puntos: 9, ataquesPositivos: 5, defensasPositivas: 4, bloqueosPositivos: 4, bloqueosErrados: 2, erroresAtaque: 1 }],
      ["40100004", { puntos: 17, ataquesPositivos: 14, ventajasTacticas: 2, defensasPositivas: 5, bloqueosPositivos: 1, aces: 2, erroresAtaque: 5, erroresSaque: 2 }],
      ["40100005", { puntos: 1, ventajasTacticas: 4, defensasPositivas: 22, aces: 1, erroresRecepcion: 4 }],
      ["40100006", { puntos: 2, ventajasTacticas: 3, defensasPositivas: 11, aces: 1, erroresRecepcion: 2 }],
    ],
  },
  {
    id: "local-match-u18-003",
    teamId: "local-team-u18-femenino",
    opponentId: "local-opponent-san-telmo",
    opponent: "San Telmo",
    tournamentId: "local-tournament-liga-metropolitana-2026",
    tournament: "Liga Metropolitana 2026",
    date: "2026-05-30T19:00:00.000Z",
    result: "WIN",
    finalScore: "3-0",
    setScores: [
      { teamPts: 25, oppPts: 17 },
      { teamPts: 25, oppPts: 19 },
      { teamPts: 25, oppPts: 22 },
    ],
    stats: [
      ["40100001", { puntos: 8, ataquesPositivos: 2, ventajasTacticas: 14, defensasPositivas: 6, bloqueosPositivos: 1, aces: 5, erroresSaque: 1 }],
      ["40100002", { puntos: 16, ataquesPositivos: 13, ventajasTacticas: 5, defensasPositivas: 9, aces: 3, erroresAtaque: 2, erroresRecepcion: 1 }],
      ["40100003", { puntos: 13, ataquesPositivos: 6, defensasPositivas: 3, bloqueosPositivos: 6, aces: 1, bloqueosErrados: 1 }],
      ["40100004", { puntos: 14, ataquesPositivos: 11, ventajasTacticas: 2, defensasPositivas: 4, bloqueosPositivos: 2, aces: 1, erroresAtaque: 2 }],
      ["40100005", { puntos: 3, ventajasTacticas: 5, defensasPositivas: 16, aces: 3, erroresRecepcion: 1 }],
      ["40100007", { puntos: 11, ataquesPositivos: 9, defensasPositivas: 7, bloqueosPositivos: 1, aces: 1, erroresAtaque: 2 }],
    ],
  },
  {
    id: "local-match-primera-001",
    teamId: "local-team-primera-masculino",
    opponentId: "local-opponent-ferro-oeste",
    opponent: "Ferro Oeste",
    tournamentId: "local-tournament-superliga-2026",
    tournament: "Superliga 2026",
    date: "2026-05-18T21:00:00.000Z",
    result: "WIN",
    finalScore: "3-2",
    setScores: [
      { teamPts: 25, oppPts: 23 },
      { teamPts: 21, oppPts: 25 },
      { teamPts: 25, oppPts: 20 },
      { teamPts: 23, oppPts: 25 },
      { teamPts: 15, oppPts: 12 },
    ],
    stats: [
      ["40200001", { puntos: 5, ataquesPositivos: 1, ventajasTacticas: 16, defensasPositivas: 7, bloqueosPositivos: 1, aces: 3, erroresSaque: 2 }],
      ["40200002", { puntos: 22, ataquesPositivos: 18, ventajasTacticas: 5, defensasPositivas: 13, bloqueosPositivos: 1, aces: 3, erroresAtaque: 5, erroresRecepcion: 2 }],
      ["40200003", { puntos: 14, ataquesPositivos: 8, defensasPositivas: 4, bloqueosPositivos: 6, bloqueosErrados: 2, erroresAtaque: 2 }],
      ["40200004", { puntos: 19, ataquesPositivos: 16, ventajasTacticas: 2, defensasPositivas: 6, bloqueosPositivos: 2, aces: 1, erroresAtaque: 4 }],
      ["40200005", { puntos: 2, ventajasTacticas: 6, defensasPositivas: 24, aces: 2, erroresRecepcion: 3 }],
      ["40200007", { puntos: 13, ataquesPositivos: 11, ventajasTacticas: 2, defensasPositivas: 8, aces: 2, erroresAtaque: 3, erroresRecepcion: 2 }],
    ],
  },
  {
    id: "local-match-primera-002",
    teamId: "local-team-primera-masculino",
    opponentId: "local-opponent-ciudad",
    opponent: "Ciudad",
    tournamentId: "local-tournament-superliga-2026",
    tournament: "Superliga 2026",
    date: "2026-05-25T20:30:00.000Z",
    result: "LOSS",
    finalScore: "1-3",
    setScores: [
      { teamPts: 22, oppPts: 25 },
      { teamPts: 25, oppPts: 20 },
      { teamPts: 20, oppPts: 25 },
      { teamPts: 23, oppPts: 25 },
    ],
    stats: [
      ["40200001", { puntos: 3, ataquesPositivos: 1, ventajasTacticas: 12, defensasPositivas: 6, aces: 2, erroresSaque: 3, erroresTacticos: 1 }],
      ["40200002", { puntos: 17, ataquesPositivos: 14, ventajasTacticas: 4, defensasPositivas: 10, aces: 3, erroresAtaque: 7, erroresRecepcion: 3 }],
      ["40200003", { puntos: 10, ataquesPositivos: 5, defensasPositivas: 3, bloqueosPositivos: 5, bloqueosErrados: 3 }],
      ["40200004", { puntos: 16, ataquesPositivos: 13, defensasPositivas: 5, bloqueosPositivos: 2, aces: 1, erroresAtaque: 6 }],
      ["40200005", { puntos: 1, ventajasTacticas: 4, defensasPositivas: 18, aces: 1, erroresRecepcion: 5 }],
      ["40200006", { puntos: 2, ventajasTacticas: 3, defensasPositivas: 12, aces: 1, erroresRecepcion: 2 }],
    ],
  },
  {
    id: "local-match-primera-003",
    teamId: "local-team-primera-masculino",
    opponentId: "local-opponent-lomas",
    opponent: "Lomas",
    tournamentId: "local-tournament-copa-apertura",
    tournament: "Copa Apertura",
    date: "2026-06-01T20:00:00.000Z",
    result: "WIN",
    finalScore: "3-0",
    setScores: [
      { teamPts: 25, oppPts: 18 },
      { teamPts: 25, oppPts: 21 },
      { teamPts: 25, oppPts: 19 },
    ],
    stats: [
      ["40200001", { puntos: 7, ataquesPositivos: 2, ventajasTacticas: 15, defensasPositivas: 5, bloqueosPositivos: 1, aces: 4, erroresSaque: 1 }],
      ["40200002", { puntos: 19, ataquesPositivos: 16, ventajasTacticas: 4, defensasPositivas: 11, bloqueosPositivos: 1, aces: 2, erroresAtaque: 2, erroresRecepcion: 1 }],
      ["40200003", { puntos: 15, ataquesPositivos: 8, defensasPositivas: 3, bloqueosPositivos: 7, erroresAtaque: 1 }],
      ["40200004", { puntos: 18, ataquesPositivos: 15, ventajasTacticas: 3, defensasPositivas: 4, bloqueosPositivos: 2, aces: 1, erroresAtaque: 2 }],
      ["40200005", { puntos: 2, ventajasTacticas: 5, defensasPositivas: 21, aces: 2, erroresRecepcion: 1 }],
      ["40200007", { puntos: 12, ataquesPositivos: 10, ventajasTacticas: 2, defensasPositivas: 9, aces: 2, erroresAtaque: 2 }],
    ],
  },
];

const zeroStats = {
  puntos: 0,
  ataquesPositivos: 0,
  ventajasTacticas: 0,
  defensasPositivas: 0,
  bloqueosPositivos: 0,
  aces: 0,
  bloqueosErrados: 0,
  erroresAtaque: 0,
  erroresRecepcion: 0,
  erroresSaque: 0,
  erroresTacticos: 0,
};

async function main() {
  const passwordHash = await bcrypt.hash(TRAINER_PASSWORD, 12);

  const trainer = await prisma.user.upsert({
    where: { email: TRAINER_EMAIL },
    update: {
      passwordHash,
      displayName: "Local Trainer",
      role: "COACH",
    },
    create: {
      id: "local-trainer-user",
      email: TRAINER_EMAIL,
      passwordHash,
      displayName: "Local Trainer",
      role: "COACH",
    },
  });

  const club = await prisma.club.upsert({
    where: { id: "local-club-atletico-aurora" },
    update: {
      name: "Club Atletico Aurora",
      city: "Buenos Aires",
      color: "#1E6FD9",
      role: "trainer",
      ownerId: trainer.id,
    },
    create: {
      id: "local-club-atletico-aurora",
      name: "Club Atletico Aurora",
      city: "Buenos Aires",
      color: "#1E6FD9",
      role: "trainer",
      ownerId: trainer.id,
    },
  });

  const playerByDni = new Map();

  for (const teamSeed of teams) {
    const team = await prisma.team.upsert({
      where: { id: teamSeed.id },
      update: {
        name: teamSeed.name,
        clubId: club.id,
      },
      create: {
        id: teamSeed.id,
        name: teamSeed.name,
        clubId: club.id,
      },
    });

    for (const [dni, name, number, position] of teamSeed.players) {
      const player = await prisma.player.upsert({
        where: {
          clubId_dni: {
            clubId: club.id,
            dni,
          },
        },
        update: {
          name,
          number,
          position,
          isActive: true,
          teams: {
            set: [{ id: team.id }],
          },
        },
        create: {
          clubId: club.id,
          dni,
          name,
          number,
          position,
          isActive: true,
          teams: {
            connect: [{ id: team.id }],
          },
        },
      });

      playerByDni.set(dni, player);
    }
  }

  await seedMatches(trainer.id, playerByDni);

  console.log("Local seed data is ready.");
  console.log(`Trainer login: ${TRAINER_EMAIL} / ${TRAINER_PASSWORD}`);
}

async function seedMatches(ownerId, playerByDni) {
  const opponentIds = [...new Map(matchSeeds.map((match) => [match.opponentId, match.opponent])).entries()];
  const tournamentIds = [...new Map(matchSeeds.map((match) => [match.tournamentId, match.tournament])).entries()];

  for (const [id, name] of opponentIds) {
    await prisma.opponentTeam.upsert({
      where: { id },
      update: { name, ownerId, lastUsedAt: new Date() },
      create: { id, name, ownerId, lastUsedAt: new Date() },
    });
  }

  for (const [id, name] of tournamentIds) {
    await prisma.tournament.upsert({
      where: { id },
      update: { name, ownerId, lastUsedAt: new Date() },
      create: { id, name, ownerId, lastUsedAt: new Date() },
    });
  }

  for (const seed of matchSeeds) {
    const match = await prisma.match.upsert({
      where: { id: seed.id },
      update: {
        teamId: seed.teamId,
        opponent: seed.opponent,
        opponentTeamId: seed.opponentId,
        tournament: seed.tournament,
        tournamentId: seed.tournamentId,
        date: new Date(seed.date),
        result: seed.result,
        finalScore: seed.finalScore,
        setScores: seed.setScores,
        status: "finished",
      },
      create: {
        id: seed.id,
        teamId: seed.teamId,
        opponent: seed.opponent,
        opponentTeamId: seed.opponentId,
        tournament: seed.tournament,
        tournamentId: seed.tournamentId,
        date: new Date(seed.date),
        result: seed.result,
        finalScore: seed.finalScore,
        setScores: seed.setScores,
        status: "finished",
      },
    });

    await prisma.playerMatchStats.deleteMany({ where: { matchId: match.id } });

    for (const [dni, stats] of seed.stats) {
      const player = playerByDni.get(dni);
      if (!player) continue;

      await prisma.playerMatchStats.create({
        data: {
          matchId: match.id,
          playerId: player.id,
          ...zeroStats,
          ...stats,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error("Local seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
