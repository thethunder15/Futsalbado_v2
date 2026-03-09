<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Futsalbado

**Futsalbado** é uma moderna aplicação web (PWA instalável) desenvolvida para gerenciar e organizar peladas de futebol e futsal entre amigos. Construída com React, TypeScript, TailwindCSS no frontend e Supabase como backend corporativo de alta escalabilidade.

## 🌟 Funcionalidades Principais

- **Autenticação Simples**: Os usuários conseguem criar sua conta de jogador usando nome, celular (WhatsApp), posição e avaliação (`Perna de Pau` à `Seleção`).
- **Gerenciador de Partidas**: Administradores podem listar datas, horários e valores de peladas, definindo o local e quantidade de vagas.
- **Sistema de Inscrições Limitadas**: Jogadores registrados podem "Confirmar Presença" nas partidas disponíveis com apenas um clique. Controle rígido de assentos máximos.

### 🤖 Sorteio Justo (IA Balanceada)
Para evitar as clássicas brigas nos famosos "par ou ímpar" ou "tirar o time", os administradores possuem um botão especial **"Sorteia Ai"**. Ele envia toda a lista de confirmados (com as respectivas posições e nível de habilidade) para uma API inteligente do *Google Gemini*, que processa instantaneamente cruzamentos numéricos e devolve duas equipes perfeitamente equilibradas, garantindo uma partida super disputada e justificando o porquê de cada divisão.

### ⭐️ Sistema de Avaliação Entre Jogadores
O coração da comunidade do Futsalbado! Após o encerramento do relógio com a vitória (ou derrota) de uma equipe gravada perante a história, os atletas **são obrigados** a avaliarem com notas de `1 a 5 estrelas` os companheiros que estiveram em quadra.
Se um jogador "esquecer" ou se recusar a preencher as estatísticas no menu de **Minhas Avaliações**, o sistema ativa um pênalti automático e o **bloqueia** de realizar qualquer inscrição futura. Isso mantém o banco da AI fresquinho, orgânico e implacável para a escalação da próxima partida!

### 🎟️ Sistema de Convidados
Se um jogador recorrente não puder comparecer, qualquer atleta já inscrito na partida pode usar o "Sistema Libre" para adicionar seus convidados avulsos. O sistema:
1. Pede o WhatsApp, Nome e Notas de Habilidade do amigo em uma telinha animada.
2. Faz o cruzamento na Base de Dados e identifica se o Goleirão convidado já tem uma conta ou se é um novato puramente virtual.
3. Se o convidado sumir ou desistir, qualquer outro jogador pode abrir a "Telinha de Corte" (`RemoveGuestModal`) e desvincular o convidado específico com facilidade, liberando a vaga imediatamente aos atletas na fila de espera. As escalações e os sorteios são resetados para preservar o equilíbrio automático.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, TypeScript, TailwindCSS, Vite, PWA
- **Inteligência:** Google Gemini SDK (`@google/genai`)
- **Backend / Real-time:** Supabase (PostgreSQL, Auth, Edge Functions)

---

## 🚀 Rodando o Projeto

Você precisa do **Node.js** para instalar e rodar.

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie ou popule o arquivo `.env.local` na raiz com as chaves:
   - `VITE_SUPABASE_URL=`
   - `VITE_SUPABASE_ANON_KEY=`
   - `VITE_GEMINI_API_KEY=`
3. Rode o aplicativo localmente em modo desenvolvimento:
   ```bash
   npm run dev
   ```
O frontend começará na porta `localhost:5173`. Aproveite o jogo! ⚽
