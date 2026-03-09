import React, { useState } from 'react';
import { User } from '../types';

interface AddGuestModalProps {
  onClose: () => void;
  onSubmit: (guestData: { name: string; phone: string; position: User['position']; rating: number }) => void;
}

const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  const limited = numbers.slice(0, 11);
  let formatted = limited;
  if (limited.length > 2) {
    formatted = `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  }
  if (limited.length > 7) {
    formatted = `${formatted.slice(0, 10)}-${formatted.slice(10)}`;
  }
  return formatted;
};

const AddGuestModal: React.FC<AddGuestModalProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState<User['position']>('Meio');
  const [rating, setRating] = useState<number>(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || phone.length < 14) return;
    onSubmit({ name, phone, position, rating });
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-[2.5rem] shadow-2xl animate-scale-in border-4 border-gray-100 dark:border-[#2a2a2a] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-[#2a2a2a] flex justify-between items-center bg-[#f16d22] text-white shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
              <span className="text-2xl">🎟️</span> Convidado
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Adicione um amigo à lista</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/10 transition flex items-center justify-center font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1">Nome do Convidado</label>
            <input
              required
              type="text"
              placeholder="Ex: Neymar"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] focus:border-[#f16d22] outline-none transition font-bold text-gray-900 dark:text-white"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1">WhatsApp</label>
            <input
              required
              type="tel"
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] focus:border-[#f16d22] outline-none transition font-bold text-gray-900 dark:text-white"
              value={phone}
              onChange={e => setPhone(formatPhoneNumber(e.target.value))}
              maxLength={15}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1">Posição</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition text-gray-900 dark:text-white cursor-pointer font-bold text-sm"
                value={position}
                onChange={e => setPosition(e.target.value as User['position'])}
              >
                <option value="Goleiro">Goleiro</option>
                <option value="Zagueiro">Zagueiro</option>
                <option value="Meio">Meio</option>
                <option value="Atacante">Atacante</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1">Habilidade</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition text-gray-900 dark:text-white cursor-pointer font-bold text-sm"
                value={rating}
                onChange={e => setRating(parseInt(e.target.value))}
              >
                <option value="1">⭐ Perna de Pau</option>
                <option value="2">⭐⭐ Esforçado</option>
                <option value="3">⭐⭐⭐ Joga Muito</option>
                <option value="4">⭐⭐⭐⭐ Profissional</option>
                <option value="5">⭐⭐⭐⭐⭐ Seleção</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 px-6 py-4 bg-[#f16d22] text-white rounded-2xl font-black uppercase italic text-sm hover:bg-[#d95d1b] shadow-xl shadow-orange-900/10 transition transform active:scale-95"
            disabled={!name || phone.length < 14}
          >
            Adicionar à Pelada
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddGuestModal;
