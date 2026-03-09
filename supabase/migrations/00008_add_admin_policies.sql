-- Permite que Administradores deletem qualquer jogador de uma partida
CREATE POLICY "Allow admins to delete any match_players" ON public.match_players
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."isAdmin" = true
  )
);

-- Permite que Administradores deletem registros de sorteio (team_drafts)
CREATE POLICY "Allow admins to delete any team_drafts" ON public.team_drafts
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."isAdmin" = true
  )
);
