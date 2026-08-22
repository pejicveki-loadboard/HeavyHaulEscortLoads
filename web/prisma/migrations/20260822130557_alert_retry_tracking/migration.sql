-- CreateEnum
CREATE TYPE "AlertSendStatus" AS ENUM ('sent', 'failed');

-- AlterTable
ALTER TABLE "load_alerts" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "AlertSendStatus" NOT NULL DEFAULT 'failed';
