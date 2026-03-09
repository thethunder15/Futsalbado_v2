-- Add isAdmin column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN DEFAULT false;
