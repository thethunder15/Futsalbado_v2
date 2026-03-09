-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  avatar TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) DEFAULT 3,
  position TEXT CHECK (position IN ('Goleiro', 'Zagueiro', 'Meio', 'Atacante')) DEFAULT 'Meio',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  location_uri TEXT,
  max_players INTEGER NOT NULL DEFAULT 14,
  price_per_player NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  organizer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create match_players table
CREATE TABLE public.match_players (
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('confirmado', 'pendente', 'ausente')) DEFAULT 'pendente',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (match_id, user_id)
);

-- Create team_drafts table
CREATE TABLE public.team_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL UNIQUE,
  team_amarelo JSONB NOT NULL DEFAULT '[]'::jsonb,
  team_laranja JSONB NOT NULL DEFAULT '[]'::jsonb,
  justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_drafts ENABLE ROW LEVEL SECURITY;

-- Create basic policies (adjust these based on your authentication needs)
-- Allow anyone to read users
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);

-- Allow anyone to read matches
CREATE POLICY "Allow public read access to matches" ON public.matches FOR SELECT USING (true);

-- Allow anyone to read match players
CREATE POLICY "Allow public read access to match_players" ON public.match_players FOR SELECT USING (true);

-- Allow anyone to read team drafts
CREATE POLICY "Allow public read access to team_drafts" ON public.team_drafts FOR SELECT USING (true);
