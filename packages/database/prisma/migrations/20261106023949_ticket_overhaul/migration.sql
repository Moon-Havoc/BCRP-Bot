-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "category" VARCHAR(50),
ADD COLUMN     "priority" VARCHAR(20),
ADD COLUMN     "rating" SMALLINT,
ADD COLUMN     "transcript_url" VARCHAR(500);

-- CreateIndex
CREATE INDEX "tickets_guild_id_category_idx" ON "tickets"("guild_id", "category");
