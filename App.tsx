
import React, { useState, useEffect, useMemo } from 'react';
import { User, Match, PlayerEntry, TeamDraft } from './types';
import Login from './components/Login';
import Navbar from './components/Navbar';
import MatchCard from './components/MatchCard';
import MatchModal from './components/MatchModal';
import ProfileModal from './components/ProfileModal';
import RankingModal from './components/RankingModal';
import FinishMatchModal from './components/FinishMatchModal';
import HistoryModal from './components/HistoryModal';
import PendingRatingsModal from './components/PendingRatingsModal';
import AddGuestModal from './components/AddGuestModal';
import RemoveGuestModal from './components/RemoveGuestModal';

import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPendingRatingsModalOpen, setIsPendingRatingsModalOpen] = useState(false);
  const [pendingMatchesToRate, setPendingMatchesToRate] = useState<Match[]>([]);
  const [finishingMatchId, setFinishingMatchId] = useState<string | null>(null);
  
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestMatchId, setGuestMatchId] = useState<string | null>(null);

  const [isRemoveGuestModalOpen, setIsRemoveGuestModalOpen] = useState(false);
  const [removeGuestMatchId, setRemoveGuestMatchId] = useState<string | null>(null);

  const [allUsers, setAllUsers] = useState<Record<string, User>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('futsalbado_theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });

  // Helper para limpar sorteio caso o elenco mude
  const clearMatchDraft = async (matchId: string) => {
    try {
      await supabase.from('team_drafts').delete().eq('match_id', matchId);
    } catch (err) {
      console.error('Erro ao limpar sorteio:', err);
    }
  };

  // Lógica de Debounce para a busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms de atraso para evitar filtragem excessiva enquanto digita

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchMatches = async () => {
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          team_drafts (*),
          match_players (
            user_id,
            status,
            joined_at,
            users (*)
          )
        `);

      if (matchesError) throw matchesError;

      const newAllUsers: Record<string, User> = { ...allUsers };

      const formattedMatches: Match[] = (matchesData || []).map((m: any) => {
        const players: PlayerEntry[] = (m.match_players || []).map((mp: any) => {
          const user = mp.users;
          if (user) {
            newAllUsers[user.id] = user;
          }
          return {
            userId: mp.user_id,
            name: user?.name || 'Desconhecido',
            status: mp.status,
            joinedAt: new Date(mp.joined_at).getTime()
          };
        });

        // Pegar o rascunho de time associado se houver (Supabase pode retornar Array ou Objeto dependendo se é 1-to-M ou 1-to-1)
        let draftData = null;
        if (Array.isArray(m.team_drafts) && m.team_drafts.length > 0) {
          draftData = m.team_drafts[0];
        } else if (m.team_drafts && !Array.isArray(m.team_drafts)) {
          draftData = m.team_drafts;
        }

        const draft: TeamDraft | null = draftData ? {
          id: draftData.id,
          teamAmarelo: draftData.team_amarelo || [],
          teamLaranja: draftData.team_laranja || [],
          justification: draftData.justification || ''
        } : null;

        return {
          id: m.id,
          title: m.title,
          date: m.date,
          time: m.time.substring(0, 5),
          location: m.location,
          locationUri: m.location_uri,
          maxPlayers: m.max_players,
          pricePerPlayer: Number(m.price_per_player),
          players: players,
          organizerId: m.organizer_id,
          description: m.description,
          draft: draft,
          status: m.status,
          scoreAmarelo: m.score_amarelo,
          scoreLaranja: m.score_laranja
        };
      });

      setAllUsers(newAllUsers);
      setMatches(formattedMatches);
    } catch (error) {
      console.error('Erro ao buscar partidas:', error);
      showToast('Erro ao carregar as partidas.');
    }
  };

  const checkPendingRatings = async (currentMatches: Match[], userId: string) => {
    try {
      // 1. Achar partidas finalizadas que o usuário participou
      const finishedMatchesUserPlayed = currentMatches.filter(
        m => m.status === 'finished' && m.players.some(p => p.userId === userId)
      );

      if (finishedMatchesUserPlayed.length === 0) {
        setPendingMatchesToRate([]);
        return;
      }

      // 2. Buscar avaliações enviadas pelo usuário
      const { data: userRatings, error } = await supabase
        .from('player_ratings')
        .select('match_id')
        .eq('rater_id', userId);

      if (error) throw error;

      const ratedMatchIds = new Set(userRatings?.map(r => r.match_id) || []);

      // 3. Filtrar apenas as partidas ainda não avaliadas
      const pendingMatches = finishedMatchesUserPlayed.filter(m => !ratedMatchIds.has(m.id));
      setPendingMatchesToRate(pendingMatches);
    } catch (error) {
      console.error('Erro ao checar avaliações pendentes:', error);
    }
  };

  useEffect(() => {
    if (currentUser && matches.length > 0) {
      checkPendingRatings(matches, currentUser.id);
    }
  }, [currentUser, matches]);

  useEffect(() => {
    const checkSession = async () => {
      // Verifica se o Supabase tem uma sessão ativa real
      const { data: { session } } = await supabase.auth.getSession();
      const savedUser = localStorage.getItem('futsalbado_user');

      if (session && savedUser) {
        // Usuário está logado no Supabase E tem dados locais
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setAllUsers(prev => ({ ...prev, [user.id]: user }));
      } else if (savedUser) {
        // Tem dados locais mas a sessão do Supabase expirou/não existe
        console.warn('Sessão do Supabase expirada ou inexistente. Forçando logout local.');
        localStorage.removeItem('futsalbado_user');
        setCurrentUser(null);
        setPendingMatchesToRate([]);
      }

      fetchMatches();
    };

    checkSession();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('futsalbado_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setAllUsers(prev => ({ ...prev, [user.id]: user }));
    localStorage.setItem('futsalbado_user', JSON.stringify(user));
  };

  const handleUpdateProfile = async (updatedUser: User) => {
    try {
      // 1. Atualizar no Supabase
      const { error } = await supabase
        .from('users')
        .update({
          name: updatedUser.name,
          position: updatedUser.position,
          rating: updatedUser.rating,
          avatar: updatedUser.avatar
        })
        .eq('id', updatedUser.id);

      if (error) throw error;

      // 2. Atualizar estado local
      setCurrentUser(updatedUser);
      setAllUsers(prev => ({ ...prev, [updatedUser.id]: updatedUser }));
      localStorage.setItem('futsalbado_user', JSON.stringify(updatedUser));

      setMatches(prev => prev.map(match => ({
        ...match,
        players: match.players.map(p => p.userId === updatedUser.id ? { ...p, name: updatedUser.name } : p)
      })));

      setIsProfileModalOpen(false);
      showToast('Perfil atualizado com sucesso! ⚡');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      showToast('Erro ao atualizar perfil. Tente novamente.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('futsalbado_user');
  };

  const handleSaveMatch = async (matchData: Partial<Match>) => {
    if (!currentUser || currentUser.id.startsWith('guest_')) return;

    try {
      if (editingMatch) {
        const { error } = await supabase
          .from('matches')
          .update({
            title: matchData.title,
            date: matchData.date,
            time: matchData.time,
            location: matchData.location,
            location_uri: matchData.locationUri,
            max_players: matchData.maxPlayers,
            price_per_player: matchData.pricePerPlayer,
            description: matchData.description
          })
          .eq('id', editingMatch.id);

        if (error) throw error;
        showToast('Pelada atualizada com sucesso! ✏️');
      } else {
        const { error } = await supabase
          .from('matches')
          .insert([{
            title: matchData.title || 'Novo Jogo',
            date: matchData.date || '',
            time: matchData.time || '',
            location: matchData.location || '',
            location_uri: matchData.locationUri || '',
            max_players: matchData.maxPlayers || 10,
            price_per_player: matchData.pricePerPlayer || 0,
            organizer_id: currentUser.id,
            description: matchData.description || ''
          }]);

        if (error) throw error;
        showToast('Pelada convocada! Bora pro jogo! ⚽');
      }

      setIsModalOpen(false);
      setEditingMatch(null);
      fetchMatches();
    } catch (error) {
      console.error('Erro ao salvar partida:', error);
      showToast('Erro ao salvar a partida.');
    }
  };

  const handleFinishMatch = async (scoreAmarelo: number, scoreLaranja: number) => {
    if (!finishingMatchId) return;

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          status: 'finished',
          score_amarelo: scoreAmarelo,
          score_laranja: scoreLaranja
        })
        .eq('id', finishingMatchId);

      if (error) throw error;

      showToast('Partida finalizada! Placar gravado com sucesso. 🏆');
      setFinishingMatchId(null);
      fetchMatches();
    } catch (error) {
      console.error('Erro ao finalizar partida:', error);
      showToast('Erro ao salvar o placar.');
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;

      showToast('Pelada cancelada e removida. 🗑️');
      fetchMatches();
    } catch (error) {
      console.error('Erro ao deletar partida:', error);
      showToast('Erro ao deletar a partida.');
    }
  };

  const joinMatch = async (matchId: string) => {
    if (!currentUser) return;

    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const isAlreadyIn = match.players.some(p => p.userId === currentUser.id);

    try {
      if (isAlreadyIn) {
        const { error } = await supabase
          .from('match_players')
          .delete()
          .eq('match_id', matchId)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        await clearMatchDraft(matchId);
        showToast('Presença cancelada. Que pena! ❌');
        fetchMatches(); // Recarregar após sair
      } else {
        // Validação autoritativa das pendências direto no banco para evitar race conditions
        const { data: userRatings } = await supabase
          .from('player_ratings')
          .select('match_id')
          .eq('rater_id', currentUser.id);
        
        const ratedMatchIds = new Set(userRatings?.map(r => r.match_id) || []);
        
        const finishedMatchesUserPlayed = matches.filter(
          m => m.status === 'finished' && m.players.some(p => p.userId === currentUser.id)
        );
        
        const hasActualPendencies = finishedMatchesUserPlayed.some(m => !ratedMatchIds.has(m.id));

        // Bloquear inscrição se houver pendências
        if (hasActualPendencies || pendingMatchesToRate.length > 0) {
          showToast('Você possui avaliações pendentes! Resolva-as antes de se inscrever.');
          setIsPendingRatingsModalOpen(true);
          // Força a atualização do estado caso estivesse defasado
          if (hasActualPendencies && pendingMatchesToRate.length === 0) {
            checkPendingRatings(matches, currentUser.id);
          }
          return;
        }

        if (match.players.length >= match.maxPlayers) {
          showToast('Vagas esgotadas! 🚫');
          return;
        }

        const { error } = await supabase
          .from('match_players')
          .insert([{
            match_id: matchId,
            user_id: currentUser.id,
            status: 'confirmado'
          }]);

        if (error) throw error;
        await clearMatchDraft(matchId);
        showToast('Confirmado na lista! Toca o terror! ⚽🔥');
      }
      fetchMatches();
    } catch (error) {
      console.error('Erro ao entrar/sair da partida:', error);
      showToast('Erro ao processar sua solicitação.');
    }
  };

  const openGuestModal = (matchId: string) => {
    setGuestMatchId(matchId);
    setIsGuestModalOpen(true);
  };

  const handleAddGuest = async (guestData: { name: string; phone: string; position: User['position']; rating: number }) => {
    if (!guestMatchId) return;
    const match = matches.find(m => m.id === guestMatchId);
    if (!match) return;

    if (match.players.length >= match.maxPlayers) {
      showToast('Vagas esgotadas! 🚫');
      setIsGuestModalOpen(false);
      return;
    }

    try {
      // 1. Check if phone exists in table
      const { data: existingUsers, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', guestData.phone)
        .limit(1);

      if (searchError) throw searchError;

      let userId = '';

      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id;
        // Verify if user is already in match
        if (match.players.some(p => p.userId === userId)) {
          showToast('Este jogador já está confirmado na partida! 🛑');
          setIsGuestModalOpen(false);
          return;
        }
      } else {
        // Create new user (guest)
        const newGuestName = guestData.name + ' (Convidado)';
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{
            name: newGuestName,
            phone: guestData.phone,
            avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${guestData.phone.replace(/\D/g, '')}&accessoriesProbability=50`,
            position: guestData.position,
            rating: guestData.rating
          }])
          .select()
          .single();

        if (userError) throw userError;
        userId = userData.id;
      }

      // Add to match_players
      const { error: matchError } = await supabase
        .from('match_players')
        .insert([{
          match_id: guestMatchId,
          user_id: userId,
          status: 'confirmado'
        }]);

      if (matchError) throw matchError;

      await clearMatchDraft(guestMatchId);
      showToast(`Convidado ${guestData.name} adicionado! 🎟️`);
      setIsGuestModalOpen(false);
      setGuestMatchId(null);
      fetchMatches();
    } catch (error) {
      console.error('Erro ao adicionar convidado:', error);
      showToast('Erro ao adicionar convidado. O telefone pode estar mal formatado ou indisponível.');
    }
  };

  const openRemoveGuestModal = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    
    const guestPlayers = match.players.filter(p => p.name.includes('(Convidado)') || p.name.includes('(Bot)'));
    if (guestPlayers.length === 0) {
      showToast('Nenhum convidado para remover! 🤷');
      return;
    }

    setRemoveGuestMatchId(matchId);
    setIsRemoveGuestModalOpen(true);
  };

  const handleRemoveGuest = async (userId: string) => {
    if (!removeGuestMatchId) return;

    try {
      const { error } = await supabase
        .from('match_players')
        .delete()
        .eq('match_id', removeGuestMatchId)
        .eq('user_id', userId);

      if (error) throw error;

      await clearMatchDraft(removeGuestMatchId);
      showToast(`Convidado removido da lista! 🗑️`);
      setIsRemoveGuestModalOpen(false);
      setRemoveGuestMatchId(null);
      fetchMatches();
    } catch (error) {
      console.error('Erro ao remover convidado:', error);
      showToast('Erro ao remover convidado.');
    }
  };

  // Otimização crucial: Memoização da filtragem das partidas
  const filteredMatches = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();
    const now = new Date();
    // Definimos hoje como meia-noite para garantir que jogos de hoje ainda apareçam
    now.setHours(0, 0, 0, 0);

    return matches
      .filter(match => {
        // 1. Ocultar partidas já finalizadas independente da data
        if (match.status === 'finished') return false;

        // 2. Filtro de Data (Somente jogos futuros ou de hoje)
        const matchDate = new Date(match.date + 'T23:59:59');
        if (matchDate < now) return false;

        // 2. Filtro de Busca (Se houver query)
        if (!query) return true;

        const formattedDate = new Date(match.date).toLocaleDateString('pt-BR');
        return (
          match.title.toLowerCase().includes(query) ||
          match.location.toLowerCase().includes(query) ||
          match.date.includes(query) ||
          formattedDate.includes(query)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ordenar por proximidade
  }, [matches, debouncedSearchQuery]);

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const isGuest = currentUser.id.startsWith('guest_');

  return (
    <div className="min-h-screen pb-20 bg-[#f8f9fa] dark:bg-[#121212] transition-colors duration-300">
        <Navbar 
          user={currentUser}
          theme={theme}
          onToggleTheme={toggleTheme}
          onEditProfile={() => setIsProfileModalOpen(true)}
          onShowRanking={() => setIsRankingModalOpen(true)} 
          onShowHistory={() => setIsHistoryModalOpen(true)} 
          onOpenPendingRatings={() => setIsPendingRatingsModalOpen(true)}
          pendingRatingsCount={pendingMatchesToRate.length}
          onLogout={handleLogout} 
        />

      <main className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Agenda de Jogos</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Garanta sua vaga na quadra</p>
          </div>
          {currentUser?.isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="hidden md:flex bg-[#f16d22] hover:bg-[#d95d1b] text-white px-6 py-3 rounded-xl font-black uppercase italic text-sm transition shadow-lg shadow-orange-900/10 items-center gap-2 transform active:scale-95"
            >
              <span>+</span> Novo Jogo
            </button>
          )}
        </div>

        <div className="mb-8 relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-[#f16d22] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nome do jogo, local ou data..."
            className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-[#1e1e1e] border-2 border-gray-200 dark:border-[#2a2a2a] rounded-[1.5rem] focus:ring-4 focus:ring-[#f16d22]/10 focus:border-[#f16d22] outline-none transition-all font-bold text-gray-900 dark:text-white shadow-sm placeholder:text-gray-300 dark:placeholder:text-gray-600 placeholder:font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery !== debouncedSearchQuery && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[#f16d22] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="grid gap-6">
          {filteredMatches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onJoin={() => joinMatch(match.id)}
              onEdit={() => {
                setEditingMatch(match);
                setIsModalOpen(true);
              }}
              onDelete={() => handleDeleteMatch(match.id)}
              onAddMockPlayer={() => openGuestModal(match.id)}
              onRemoveMockPlayer={() => openRemoveGuestModal(match.id)}
              onDraftSaved={() => fetchMatches()}
              onFinishMatch={() => setFinishingMatchId(match.id)}
              isJoined={match.players.some(p => p.userId === currentUser.id)}
              currentUserId={currentUser.id}
              allUsers={allUsers}
            />
          ))}

          {filteredMatches.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-[#1e1e1e] rounded-[2rem] shadow-sm border-2 border-dashed border-gray-100 dark:border-[#2a2a2a] animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-gray-50 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-bold uppercase italic tracking-wider">
                {searchQuery ? 'Nenhum resultado para sua busca.' : 'Nenhuma pelada marcada para os próximos dias.'}
              </p>
            </div>
          )}
        </div>
      </main>

      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform w-[90%] max-w-sm ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 border-b-4 border-[#f16d22] w-full">
          <span className="text-xl shrink-0">⚽</span>
          <p className="font-black uppercase italic text-xs sm:text-sm tracking-tight text-center">{toast.message}</p>
        </div>
      </div>

      {finishingMatchId && (
        <FinishMatchModal
          onClose={() => setFinishingMatchId(null)}
          onSubmit={handleFinishMatch}
        />
      )}

      {isHistoryModalOpen && (
        <HistoryModal
          matches={matches}
          currentUserId={currentUser.id}
          allUsers={allUsers}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}

      {isModalOpen && currentUser?.isAdmin && (
        <MatchModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingMatch(null);
          }}
          onSubmit={handleSaveMatch}
          initialData={editingMatch || undefined}
        />
      )}

      {isProfileModalOpen && (
        <ProfileModal
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={handleUpdateProfile}
        />
      )}

      {isRankingModalOpen && (
        <RankingModal
          users={Object.values(allUsers)}
          onClose={() => setIsRankingModalOpen(false)}
        />
      )}

      {isPendingRatingsModalOpen && (
        <PendingRatingsModal
          matches={pendingMatchesToRate}
          currentUser={currentUser}
          allUsers={allUsers}
          onClose={() => setIsPendingRatingsModalOpen(false)}
          onRatingsSubmitted={() => {
            checkPendingRatings(matches, currentUser.id);
            fetchMatches(); // Re-fetch matches to update player ratings
          }}
        />
      )}

      {currentUser?.isAdmin && (
        <div className="fixed bottom-8 right-6 z-40 md:hidden">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#f16d22] w-16 h-16 rounded-2xl shadow-2xl text-white text-3xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 border-4 border-white dark:border-[#121212]"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      {isGuestModalOpen && guestMatchId && (
        <AddGuestModal
          onClose={() => {
            setIsGuestModalOpen(false);
            setGuestMatchId(null);
          }}
          onSubmit={handleAddGuest}
        />
      )}

      {isRemoveGuestModalOpen && removeGuestMatchId && (
        <RemoveGuestModal
          guests={matches.find(m => m.id === removeGuestMatchId)?.players.filter(p => p.name.includes('(Convidado)') || p.name.includes('(Bot)')) || []}
          onClose={() => {
            setIsRemoveGuestModalOpen(false);
            setRemoveGuestMatchId(null);
          }}
          onSelectGuest={handleRemoveGuest}
        />
      )}
    </div>
  );
};

export default App;
