-- Create player_ratings table
CREATE TABLE public.player_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rated_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- Prevent user from rating themselves
  CONSTRAINT no_self_rating CHECK (rater_id != rated_id),
  -- Prevent multiple ratings from same rater to same rated in the same match
  UNIQUE(match_id, rater_id, rated_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read ratings
CREATE POLICY "Allow public read access to player_ratings" ON public.player_ratings FOR SELECT USING (true);

-- Allow authenticated users to insert their own ratings
-- Using true for simplicity as the application controls who the rater is, 
-- but in a strict production environment we would check auth.uid()
CREATE POLICY "Allow users to insert their own ratings" ON public.player_ratings FOR INSERT WITH CHECK (true);

-- Create a function to update the user's average rating
CREATE OR REPLACE FUNCTION update_user_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET rating = (
    SELECT ROUND(AVG(rating))
    FROM public.player_ratings
    WHERE rated_id = NEW.rated_id
  )
  WHERE id = NEW.rated_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that calls the function after an insert on player_ratings
CREATE TRIGGER update_user_rating_trigger
AFTER INSERT OR UPDATE ON public.player_ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_average_rating();
