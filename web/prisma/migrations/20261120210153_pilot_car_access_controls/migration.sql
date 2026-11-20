-- AlterTable
ALTER TABLE "pilot_car_profiles" ADD COLUMN     "access_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "access_note" TEXT,
ADD COLUMN     "access_updated_at" TIMESTAMP(3),
ADD COLUMN     "access_updated_by_id" TEXT,
ADD COLUMN     "free_access_until" TIMESTAMP(3);
