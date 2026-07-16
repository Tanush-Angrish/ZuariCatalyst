-- Migration: add last_login_at column to users table
-- This tracks the most recent login for each user, used by the Management Dashboard
-- to identify "Never Logged In" and "Not Logged In 10+ Days" employees.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);
