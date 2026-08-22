-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('email', 'sms');

-- DropIndex
DROP INDEX "load_alerts_load_id_search_location_id_key";

-- AlterTable
ALTER TABLE "load_alerts" ADD COLUMN     "channel" "AlertChannel" NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verification_token" TEXT,
ADD COLUMN     "email_verification_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "email_verified_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "load_alerts_load_id_search_location_id_channel_key" ON "load_alerts"("load_id", "search_location_id", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_verification_token_key" ON "users"("email_verification_token");
