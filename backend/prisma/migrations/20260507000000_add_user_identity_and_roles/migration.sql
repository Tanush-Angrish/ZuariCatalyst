-- ─── Migration: Add user identity fields & roles ──────────────────────────────
-- Adds: roles, mobile_number, employee_id, profile_photo_url to users table
-- Adds: TourState model (tour_states table)
-- Safe: uses IF NOT EXISTS / DO $$ blocks — will not fail if columns already exist

-- Add roles column (JSON array of all assigned roles)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "roles" TEXT NOT NULL DEFAULT '[]';

-- Add mobile number
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mobile_number" TEXT;

-- Add employee ID
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employee_id" TEXT;

-- Add profile photo URL
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_photo_url" TEXT;

-- ─── Create tour_states table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "tour_states" (
    "id"               SERIAL PRIMARY KEY,
    "userId"           INTEGER NOT NULL,
    "hasCompletedTour" BOOLEAN NOT NULL DEFAULT false,
    "completedAt"      TIMESTAMP(3),
    "xpAwarded"        BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "tour_states_userId_key" UNIQUE ("userId")
);
