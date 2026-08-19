-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('none', 'trialing', 'active', 'expired');

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('open', 'covered', 'expired');

-- CreateEnum
CREATE TYPE "RateUnit" AS ENUM ('flat', 'per_mile');

-- CreateEnum
CREATE TYPE "EscortPosition" AS ENUM ('LEAD', 'CHASE', 'HIGH_POLE', 'STEER', 'ROUTE_SURVEY', 'THIRD_CAR', 'FOURTH_CAR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_manager_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dot_number" TEXT,
    "mc_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "load_manager_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_car_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "home_base_city" TEXT NOT NULL,
    "home_base_state" TEXT NOT NULL,
    "home_base_lat" DOUBLE PRECISION NOT NULL,
    "home_base_lng" DOUBLE PRECISION NOT NULL,
    "alert_radius_miles" INTEGER NOT NULL,
    "escort_positions" "EscortPosition"[],
    "alerts_muted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'none',
    "trial_started_at" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "paid_started_at" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,

    CONSTRAINT "pilot_car_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loads" (
    "id" TEXT NOT NULL,
    "origin_city" TEXT NOT NULL,
    "origin_state" TEXT NOT NULL,
    "origin_lat" DOUBLE PRECISION NOT NULL,
    "origin_lng" DOUBLE PRECISION NOT NULL,
    "destination_city" TEXT NOT NULL,
    "destination_state" TEXT NOT NULL,
    "destination_lat" DOUBLE PRECISION NOT NULL,
    "destination_lng" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "escort_positions" "EscortPosition"[],
    "dimension_width_ft" DOUBLE PRECISION,
    "dimension_height_ft" DOUBLE PRECISION,
    "dimension_length_ft" DOUBLE PRECISION,
    "weight_lbs" DOUBLE PRECISION,
    "rate" DECIMAL(10,2),
    "rate_unit" "RateUnit",
    "posted_by_id" TEXT NOT NULL,
    "status" "LoadStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_alerts" (
    "id" TEXT NOT NULL,
    "load_id" TEXT NOT NULL,
    "pilot_car_profile_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "load_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "load_manager_profiles_user_id_key" ON "load_manager_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pilot_car_profiles_user_id_key" ON "pilot_car_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "load_alerts_load_id_pilot_car_profile_id_key" ON "load_alerts"("load_id", "pilot_car_profile_id");

-- AddForeignKey
ALTER TABLE "load_manager_profiles" ADD CONSTRAINT "load_manager_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_car_profiles" ADD CONSTRAINT "pilot_car_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loads" ADD CONSTRAINT "loads_posted_by_id_fkey" FOREIGN KEY ("posted_by_id") REFERENCES "load_manager_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_alerts" ADD CONSTRAINT "load_alerts_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_alerts" ADD CONSTRAINT "load_alerts_pilot_car_profile_id_fkey" FOREIGN KEY ("pilot_car_profile_id") REFERENCES "pilot_car_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
