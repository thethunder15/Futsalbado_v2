import React from 'react';
import { PlayerEntry } from '../types';

interface RemoveGuestModalProps {
  guests: PlayerEntry[];
  onClose: () => void;
  onSelectGuest: (userId: string) => void;
}

const RemoveGuestModal: React.FC<RemoveGuestModalProps> = ({ guests, onClose, onSelectGuest }) => {
  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-[2.5rem] shadow-2xl animate-scale-in border-4 border-gray-100 dark:border-[#2a2a2a] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-[#2a2a2a] flex justify-between items-center bg-red-500 text-white shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
              <span className="text-2xl">🗑️</span> Remover Convidado
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Selecione quem irá sair</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/10 transition flex items-center justify-center font-bold text-lg">✕</button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto w-full">
          {guests.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 font-bold p-6">Nenhum convidado na partida.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {guests.map((guest) => (
                <button
                  key={guest.userId}
                  onClick={() => onSelectGuest(guest.userId)}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] hover:border-red-400 dark:hover:border-red-500/50 rounded-2xl transition hover:shadow-md cursor-pointer group text-left"
                >
                  <div className="flex flex-col">
                    <span className="font-black text-gray-900 dark:text-white group-hover:text-red-500 transition-colors uppercase text-sm mb-1">{guest.name.replace(' (Convidado)', '').replace(' (Bot)', '')}</span>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      Convidado 🎟️
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                    -
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemoveGuestModal;
