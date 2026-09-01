-- AlterTable
ALTER TABLE "loads" ADD COLUMN     "alert_cycle" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "load_alerts" ADD COLUMN     "alert_cycle" INTEGER NOT NULL DEFAULT 1;

-- DropIndex
DROP INDEX "load_alerts_load_id_search_location_id_channel_key";

-- CreateIndex
CREATE UNIQUE INDEX "load_alerts_load_id_search_location_id_channel_alert_cycle_key" ON "load_alerts"("load_id", "search_location_id", "channel", "alert_cycle");
