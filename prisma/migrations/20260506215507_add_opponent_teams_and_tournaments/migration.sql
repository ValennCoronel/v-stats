-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COACH', 'PLAYER');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('SETTER', 'OUTSIDE_HITTER', 'OPPOSITE_HITTER', 'MIDDLE_BLOCKER', 'LIBERO', 'DEFENSIVE_SPECIALIST');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COACH',
    "display_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "position" "Position" NOT NULL,
    "injury_history" TEXT,
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "opponent" TEXT NOT NULL,
    "tournament" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "result" TEXT,
    "final_score" TEXT,
    "set_scores" JSONB,
    "status" TEXT NOT NULL DEFAULT 'setup',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_match_stats" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "ataques_positivos" INTEGER NOT NULL DEFAULT 0,
    "ventajas_tacticas" INTEGER NOT NULL DEFAULT 0,
    "defensas_positivas" INTEGER NOT NULL DEFAULT 0,
    "bloqueos_positivos" INTEGER NOT NULL DEFAULT 0,
    "aces" INTEGER NOT NULL DEFAULT 0,
    "bloqueos_errados" INTEGER NOT NULL DEFAULT 0,
    "errores_ataque" INTEGER NOT NULL DEFAULT 0,
    "errores_recepcion" INTEGER NOT NULL DEFAULT 0,
    "errores_saque" INTEGER NOT NULL DEFAULT 0,
    "errores_tacticos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "player_match_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_action_log" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "player_id" TEXT,
    "action" TEXT NOT NULL,
    "set" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_action_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opponent_teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "owner_id" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opponent_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "owner_id" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "players_team_id_number_key" ON "players"("team_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "player_match_stats_match_id_player_id_key" ON "player_match_stats"("match_id", "player_id");

-- CreateIndex
CREATE INDEX "match_action_log_match_id_set_idx" ON "match_action_log"("match_id", "set");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_action_log" ADD CONSTRAINT "match_action_log_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opponent_teams" ADD CONSTRAINT "opponent_teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
