-- Policies for matches
CREATE POLICY "Allow authenticated users to insert matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow organizers to update their matches" ON public.matches FOR UPDATE TO authenticated USING (organizer_id = auth.uid());
CREATE POLICY "Allow organizers to delete their matches" ON public.matches FOR DELETE TO authenticated USING (organizer_id = auth.uid());

-- Policies for match_players
CREATE POLICY "Allow authenticated users to insert match_players" ON public.match_players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow users to delete their own match_players" ON public.match_players FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Allow organizers to delete any match_players" ON public.match_players FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.matches m WHERE m.id = match_players.match_id AND m.organizer_id = auth.uid()
  )
);

-- Allow inserting bots into users table
CREATE POLICY "Allow authenticated users to insert bots" ON public.users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete bots" ON public.users FOR DELETE TO authenticated USING (true);
