-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "sms_consented_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pilot_car_profiles" ADD COLUMN     "sms_consented_at" TIMESTAMP(3);
