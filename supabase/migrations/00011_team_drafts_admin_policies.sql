-- Permite que Administradores insiram registros de sorteio (team_drafts)
CREATE POLICY "Allow admins to insert team_drafts" ON public.team_drafts
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."isAdmin" = true
  )
);

-- Permite que Administradores atualizem registros de sorteio (team_drafts)
CREATE POLICY "Allow admins to update team_drafts" ON public.team_drafts
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."isAdmin" = true
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."isAdmin" = true
  )
);
