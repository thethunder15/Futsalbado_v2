import React, { useState } from 'react';
import { Match, User } from '../types';
import { supabase } from '../services/supabase';

interface RatePlayersModalProps {
  match: Match;
  currentUser: User;
  allUsers: Record<string, User>;
  onClose: () => void;
  onSuccess: () => void;
}

const RatePlayersModal: React.FC<RatePlayersModalProps> = ({ match, currentUser, allUsers, onClose, onSuccess }) => {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Os jogadores que participaram da partida, excluindo o próprio usuário e bots eventuais não logados.
  const playersToRate = match.players.filter(p => p.userId !== currentUser.id && allUsers[p.userId] && !allUsers[p.userId].name.includes('(Bot)'));

  const handleRate = (userId: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [userId]: rating
    }));
  };

  const handleSubmit = async () => {
    const ratedUsers = Object.keys(ratings);
    if (ratedUsers.length === 0) {
      setError('Por favor, avalie pelo menos um jogador antes de salvar.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = ratedUsers.map(userId => ({
        match_id: match.id,
        rater_id: currentUser.id,
        rated_id: userId,
        rating: ratings[userId]
      }));

      // Inserir todas as avaliações no Supabase
      const { error: insertError } = await supabase
        .from('player_ratings')
        .insert(payload);

      if (insertError) {
        // Fallback case: already rated
        if (insertError.code === '23505') {
            throw new Error('Você já avaliou os jogadores desta partida!');
        }
        throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Erro ao enviar avaliações:', err);
      setError(err.message || 'Ocorreu um erro ao salvar as avaliações.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-[#1e1e1e] border-b border-gray-100 dark:border-[#2a2a2a] p-6 flex items-center justify-between rounded-t-[2rem]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#f16d22]/10 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Avaliar Colegas</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{match.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:rotate-90 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm font-bold rounded-r-xl">
              {error}
            </div>
          )}

          {playersToRate.length === 0 ? (
           <div className="text-center py-10">
              <span className="text-4xl mb-4 block">👻</span>
              <p className="text-gray-400 font-bold uppercase italic tracking-widest text-sm">Nenhum jogador para avaliar nesta partida.</p>
           </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-4">
                Como os seus colegas saíram na pelada de hoje? Seja honesto, seu voto é secreto!
              </p>
              
              {playersToRate.map((player) => {
                const userInfo = allUsers[player.userId];
                const currentRating = ratings[player.userId] || 0;

                return (
                  <div key={player.userId} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-[#333333] shadow-sm gap-4">
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <img 
                        src={userInfo.avatar} 
                        alt={player.name}
                        className="w-10 h-10 rounded-full border-2 border-[#f16d22] bg-white"
                      />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{player.name}</p>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">{userInfo.position}</p>
                      </div>
                    </div>

                    <div className="flex gap-1 justify-center sm:justify-end w-full sm:w-auto">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(player.userId, star)}
                          className="transform hover:scale-110 transition-transform focus:outline-none"
                          title={`${star} Estrela${star > 1 ? 's' : ''}`}
                        >
                          <svg 
                            className={`w-8 h-8 ${star <= currentRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-[#1e1e1e] p-6 border-t border-gray-100 dark:border-[#2a2a2a] rounded-b-[2rem] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-xl font-black uppercase italic text-sm hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
          >
            Cancelar
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || playersToRate.length === 0}
            className="px-6 py-3 bg-[#f16d22] text-white rounded-xl font-black uppercase italic text-sm hover:bg-[#d95d1b] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                <span>🚀</span> Enviar Avaliações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatePlayersModal;
