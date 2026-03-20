-- Migração para otimizar a filtragem de partidas por status
-- Melhora a performance da busca de partidas ativas (status != 'finished')

CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

-- Adiciona também um índice composto para data e status, que é um padrão de busca comum
CREATE INDEX IF NOT EXISTS idx_matches_date_status ON public.matches(date DESC, status);
