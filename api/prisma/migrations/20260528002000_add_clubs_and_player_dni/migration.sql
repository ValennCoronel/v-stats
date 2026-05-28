-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_owner_id_fkey";

-- DropIndex
DROP INDEX "players_team_id_number_key";

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "club_id" TEXT NOT NULL,
ADD COLUMN     "dni" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "owner_id",
ADD COLUMN     "club_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#1E6FD9',
    "role" TEXT NOT NULL DEFAULT 'admin',
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_club_id_dni_key" ON "players"("club_id", "dni");

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
