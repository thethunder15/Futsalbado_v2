-- Migração para criação de índices e melhoria de performance
-- Evita "Full Table Scan" quando o App busca as listas de jogadores vinculados a uma partida

-- Criação de índices para a tabela match_players
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON public.match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_user_id ON public.match_players(user_id);

-- Criação de índices para a tabela team_drafts
CREATE INDEX IF NOT EXISTS idx_team_drafts_match_id ON public.team_drafts(match_id);

-- Criação de índices para a tabela matches
CREATE INDEX IF NOT EXISTS idx_matches_organizer_id ON public.matches(organizer_id);
-- Otimiza listagens baseada na data dos jogos que vão ocorrer
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(date DESC);

-- Otimiza busca do login por telefone na auth (usado no sign in/up e para a checagem de convidado)
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
