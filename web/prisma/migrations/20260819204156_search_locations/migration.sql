-- DropForeignKey
ALTER TABLE "load_alerts" DROP CONSTRAINT "load_alerts_pilot_car_profile_id_fkey";

-- DropIndex
DROP INDEX "load_alerts_load_id_pilot_car_profile_id_key";

-- AlterTable
ALTER TABLE "load_alerts" DROP COLUMN "pilot_car_profile_id",
ADD COLUMN     "search_location_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pilot_car_profiles" DROP COLUMN "alert_radius_miles",
DROP COLUMN "escort_positions",
DROP COLUMN "home_base_city",
DROP COLUMN "home_base_lat",
DROP COLUMN "home_base_lng",
DROP COLUMN "home_base_state";

-- CreateTable
CREATE TABLE "search_locations" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "label" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "radius_miles" INTEGER NOT NULL,
    "escort_positions" "EscortPosition"[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "load_alerts_load_id_search_location_id_key" ON "load_alerts"("load_id", "search_location_id");

-- AddForeignKey
ALTER TABLE "search_locations" ADD CONSTRAINT "search_locations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "pilot_car_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_alerts" ADD CONSTRAINT "load_alerts_search_location_id_fkey" FOREIGN KEY ("search_location_id") REFERENCES "search_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
