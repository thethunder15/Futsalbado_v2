
import React from 'react';
import { User } from '../types';

interface RankingModalProps {
  users: User[];
  onClose: () => void;
}

const RankingModal: React.FC<RankingModalProps> = ({ users, onClose }) => {
  // Ordenar usuários por rating (maior para menor)
  const sortedUsers = [...users].sort((a, b) => b.rating - a.rating);

  const getPodiumStyle = (index: number) => {
    switch(index) {
      case 0: return 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-yellow-500/20';
      case 1: return 'bg-gray-300 text-gray-800 border-gray-400 shadow-gray-500/20';
      case 2: return 'bg-orange-400 text-orange-900 border-orange-500 shadow-orange-500/20';
      default: return 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 border-transparent';
    }
  };

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in border-4 border-gray-100 dark:border-[#2a2a2a] max-h-[85vh] flex flex-col">
        <div className="p-8 border-b border-gray-100 dark:border-[#2a2a2a] flex justify-between items-center bg-gray-900 text-white shrink-0">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Ranking de Atletas</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Os Melhores do Futsalbado</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 transition flex items-center justify-center font-bold text-lg">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-3 custom-scrollbar">
          {sortedUsers.length > 0 ? (
            sortedUsers.map((user, index) => (
              <div 
                key={user.id} 
                className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all hover:scale-[1.02] ${index < 3 ? 'border-orange-500/20 bg-orange-500/5' : 'border-gray-50 dark:border-[#2a2a2a] bg-white dark:bg-[#222]'}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black italic text-sm border-2 shrink-0 ${getPodiumStyle(index)}`}>
                  {getMedal(index)}
                </div>
                
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-12 h-12 rounded-full border-2 border-[#f16d22] shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 dark:text-white uppercase italic text-sm truncate">{user.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{user.position}</p>
                </div>
                
                <div className="text-right shrink-0 flex flex-col items-end">
                  <div className="flex gap-0.5 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xs ${i < user.rating ? 'text-orange-400' : 'text-gray-200 dark:text-[#333]'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-[#f16d22] uppercase italic bg-orange-100 dark:bg-orange-900/20 px-2 py-0.5 rounded-lg">
                    Rating: {user.rating}.0
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 opacity-50">
              <p className="font-bold uppercase italic text-sm">Nenhum craque encontrado.</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-[#181818] border-t border-gray-100 dark:border-[#2a2a2a] shrink-0 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">O rating é definido pelo administrador e desempenho em quadra.</p>
        </div>
      </div>
    </div>
  );
};

export default RankingModal;
