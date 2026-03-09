import React, { useState } from 'react';
import { Match, User } from '../types';
import RatePlayersModal from './RatePlayersModal';

interface PendingRatingsModalProps {
  matches: Match[];
  currentUser: User;
  allUsers: Record<string, User>;
  onClose: () => void;
  onRatingsSubmitted: () => void;
}

const PendingRatingsModal: React.FC<PendingRatingsModalProps> = ({ matches, currentUser, allUsers, onClose, onRatingsSubmitted }) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {selectedMatch && (
        <RatePlayersModal
          match={selectedMatch}
          currentUser={currentUser}
          allUsers={allUsers}
          onClose={() => setSelectedMatch(null)}
          onSuccess={() => {
            setSelectedMatch(null);
            onRatingsSubmitted();
          }}
        />
      )}

      {!selectedMatch && (
        <div className="relative bg-white dark:bg-[#1e1e1e] w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-[#2a2a2a] animate-in slide-in-from-bottom-4">
          <div className="p-6 border-b border-gray-100 dark:border-[#2a2a2a] flex justify-between items-center bg-gray-50/50 dark:bg-[#1a1a1a]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tight">Avaliações Pendentes</h2>
                <p className="text-xs text-red-500 font-bold uppercase tracking-widest mt-1">Você precisa avaliar para jogar</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa] dark:bg-[#121212]">
            {matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-4">✅</span>
                <p className="text-gray-500 dark:text-gray-400 font-bold">Nenhuma avaliação pendente!</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Você está liberado para as próximas peladas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-4 rounded-xl bg-red-50 dark:bg-red-900/10 p-4 border border-red-100 dark:border-red-900/20">
                  Pendências bloqueiam sua inscrição em novos jogos. Por favor, avalie seus colegas nas partidas abaixo:
                </p>
                
                {matches.map(match => (
                  <div key={match.id} className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#2a2a2a] flex flex-col items-center justify-center flex-shrink-0 border border-gray-200 dark:border-[#333]">
                        <span className="text-xs font-black text-gray-500">{match.date.split('-')[2]}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(match.date).toLocaleString('default', { month: 'short' })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-gray-900 dark:text-white uppercase truncate text-sm sm:text-base">{match.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">📍 {match.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedMatch(match)}
                      className="w-full sm:w-auto whitespace-nowrap px-6 py-2.5 bg-[#f16d22] text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-lg shadow-[#f16d22]/20 hover:bg-[#d95d1b] transition-colors transform active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>⭐</span>
                      Avaliar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRatingsModal;
