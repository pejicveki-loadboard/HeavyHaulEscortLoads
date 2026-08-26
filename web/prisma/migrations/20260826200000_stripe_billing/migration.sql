-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'past_due';

-- CreateEnum
CREATE TYPE "PlanInterval" AS ENUM ('monthly', 'annual');

-- AlterTable
ALTER TABLE "pilot_car_profiles" ADD COLUMN     "plan_interval" "PlanInterval",
ADD COLUMN     "pending_plan_interval" "PlanInterval",
ADD COLUMN     "current_period_end" TIMESTAMP(3),
ADD COLUMN     "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "past_due_since" TIMESTAMP(3);
