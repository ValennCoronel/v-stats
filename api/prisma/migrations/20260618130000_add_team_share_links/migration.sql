CREATE TABLE "team_share_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_share_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_share_links_token_key" ON "team_share_links"("token");
CREATE UNIQUE INDEX "team_share_links_team_id_key" ON "team_share_links"("team_id");

ALTER TABLE "team_share_links"
ADD CONSTRAINT "team_share_links_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_share_links"
ADD CONSTRAINT "team_share_links_club_id_fkey"
FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_share_links"
ADD CONSTRAINT "team_share_links_team_id_fkey"
FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
