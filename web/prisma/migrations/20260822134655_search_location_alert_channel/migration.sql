-- CreateEnum
CREATE TYPE "AlertChannelPreference" AS ENUM ('email', 'sms', 'both');

-- AlterTable
ALTER TABLE "pilot_car_profiles" DROP COLUMN "alerts_muted";

-- AlterTable
ALTER TABLE "search_locations" ADD COLUMN     "alert_channel" "AlertChannelPreference" NOT NULL DEFAULT 'both';
