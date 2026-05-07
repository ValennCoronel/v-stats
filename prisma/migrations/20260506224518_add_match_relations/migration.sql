-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "opponent_team_id" TEXT,
ADD COLUMN     "tournament_id" TEXT;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_opponent_team_id_fkey" FOREIGN KEY ("opponent_team_id") REFERENCES "opponent_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
