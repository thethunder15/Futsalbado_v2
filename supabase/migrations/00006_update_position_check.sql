-- Drop the old constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_position_check;

-- Add the new constraint including 'Lateral'
ALTER TABLE public.users ADD CONSTRAINT users_position_check CHECK (position IN ('Goleiro', 'Zagueiro', 'Lateral', 'Meio', 'Atacante'));
