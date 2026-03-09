-- Adiciona a coluna de peso (weight) na tabela de usuários. Utilizando NUMERIC para permitir valores como 85.5, ou INTEGER se preferir. Aqui usaremos NUMERIC(5,2).
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2);
