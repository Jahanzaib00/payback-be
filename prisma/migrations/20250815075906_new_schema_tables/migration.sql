/*
  Warnings:

  - The `subscription_status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('inactive', 'active', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."GroupStatus" AS ENUM ('upcoming', 'ongoing', 'completed');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('pending', 'paid', 'failed');

-- CreateEnum
CREATE TYPE "public"."ReferralStatus" AS ENUM ('pending', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "public"."referrals" ADD COLUMN     "status" "public"."ReferralStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "subscription_status",
ADD COLUMN     "subscription_status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'inactive';

-- CreateTable
CREATE TABLE "public"."workouts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "group_id" UUID,
    "workout_type" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "workout_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."groups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weekly_goal" INTEGER NOT NULL,
    "invite_code" TEXT NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "max_members" INTEGER NOT NULL DEFAULT 10,
    "entry_fee" DECIMAL(8,2) NOT NULL DEFAULT 100.00,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "public"."GroupStatus" NOT NULL DEFAULT 'upcoming',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "payment_status" "public"."PaymentStatus" NOT NULL DEFAULT 'pending',
    "stripe_payment_intent_id" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "group_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."weekly_goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "week_number" INTEGER NOT NULL,
    "week_start_date" TIMESTAMP(3) NOT NULL,
    "week_end_date" TIMESTAMP(3) NOT NULL,
    "target_workouts" INTEGER NOT NULL,
    "completed_workouts" INTEGER NOT NULL DEFAULT 0,
    "goal_achieved" BOOLEAN NOT NULL DEFAULT false,
    "pf_coins_earned" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groups_invite_code_key" ON "public"."groups"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "group_memberships_user_id_group_id_key" ON "public"."group_memberships"("user_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_goals_user_id_group_id_week_number_key" ON "public"."weekly_goals"("user_id", "group_id", "week_number");

-- AddForeignKey
ALTER TABLE "public"."workouts" ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workouts" ADD CONSTRAINT "workouts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_memberships" ADD CONSTRAINT "group_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_memberships" ADD CONSTRAINT "group_memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."weekly_goals" ADD CONSTRAINT "weekly_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."weekly_goals" ADD CONSTRAINT "weekly_goals_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
