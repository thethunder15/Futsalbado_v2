
import React, { useState } from 'react';
import { Match } from '../types';
import { searchLocationOnMaps } from '../services/gemini';

interface MatchModalProps {
  onClose: () => void;
  onSubmit: (match: Partial<Match>) => void;
  initialData?: Match;
}

const MatchModal: React.FC<MatchModalProps> = ({ onClose, onSubmit, initialData }) => {
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationFoundName, setLocationFoundName] = useState('');
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    date: initialData?.date || '',
    time: initialData?.time || '',
    location: initialData?.location || '',
    locationUri: initialData?.locationUri || '',
    maxPlayers: initialData?.maxPlayers || 10,
    pricePerPlayer: initialData?.pricePerPlayer || 15,
    description: initialData?.description || ''
  });

  const handleSearchLocation = async () => {
    if (!formData.location) return;
    setIsSearchingLocation(true);
    setLocationFoundName('');
    setIsLocationConfirmed(false);
    try {
      let coords;
      if (navigator.geolocation) {
        coords = await new Promise<{lat: number, lng: number} | undefined>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(undefined)
          );
        });
      }
      
      const result = await searchLocationOnMaps(formData.location, coords);
      if (result.uri) {
        setFormData(prev => ({ ...prev, locationUri: result.uri! }));
        setLocationFoundName(result.text.split('\n')[0].substring(0, 50) + (result.text.length > 50 ? '...' : ''));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.locationUri && !isLocationConfirmed) {
      alert("Por favor, confirme se a localização no mapa está correta para que o link do GPS seja incluído no convite.");
      return;
    }
    onSubmit(formData);
  };

  // URL para embed simples do Google Maps
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(formData.location)}&output=embed`;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in border-4 border-gray-100 dark:border-[#2a2a2a] max-h-[95vh] flex flex-col">
        <div className="p-8 border-b border-gray-100 dark:border-[#2a2a2a] flex justify-between items-center bg-[#f16d22] text-white shrink-0">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">{initialData ? 'Editar Pelada' : 'Convocar Pelada'}</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">{initialData ? 'Atualizar Evento' : 'Novo Evento Futsalbado'}</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-black/10 transition flex items-center justify-center font-bold text-lg">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-2 ml-1">Título do Confronto</label>
            <input 
              required
              type="text" 
              placeholder="Ex: Derby de Sábado"
              className="w-full px-5 py-4 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] focus:border-[#f16d22] outline-none transition font-bold text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-2 ml-1">Data</label>
              <input 
                required
                type="date" 
                className="w-full px-5 py-4 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition font-bold text-gray-900 dark:text-white"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-2 ml-1">Horário</label>
              <input 
                required
                type="time" 
                className="w-full px-5 py-4 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition font-bold text-gray-900 dark:text-white"
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase ml-1">Local da Partida</label>
            <div className="flex gap-2">
              <input 
                required
                type="text" 
                placeholder="Nome da Quadra ou Arena"
                className="flex-1 px-5 py-4 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition font-bold text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700"
                value={formData.location}
                onChange={e => {
                  setFormData({...formData, location: e.target.value, locationUri: ''});
                  setLocationFoundName('');
                  setIsLocationConfirmed(false);
                }}
              />
              <button 
                type="button"
                onClick={handleSearchLocation}
                disabled={!formData.location || isSearchingLocation}
                className={`px-4 rounded-2xl border-2 transition-all flex items-center justify-center ${formData.locationUri ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-50 dark:bg-[#262626] border-gray-100 dark:border-[#333333] text-[#f16d22] hover:border-[#f16d22]'} disabled:opacity-50`}
                title="Buscar no Google Maps"
              >
                {isSearchingLocation ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : formData.locationUri ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {formData.locationUri && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                {/* Embedded Map Preview */}
                <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-[#333] shadow-inner bg-gray-50 dark:bg-[#262626]">
                  <iframe
                    title="Preview do Local"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={mapEmbedUrl}
                    allowFullScreen
                  ></iframe>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/10 border-2 border-green-100 dark:border-green-900/20 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <input 
                      id="confirm-location"
                      type="checkbox" 
                      className="w-5 h-5 rounded border-2 border-green-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      checked={isLocationConfirmed}
                      onChange={(e) => setIsLocationConfirmed(e.target.checked)}
                    />
                    <label htmlFor="confirm-location" className="text-xs font-black text-green-700 dark:text-green-400 uppercase italic cursor-pointer">
                      O local no mapa está correto!
                    </label>
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    Ao confirmar, o link exato do GPS será incluído na mensagem de compartilhamento e no convite.
                  </p>
                </div>
              </div>
            )}
            
            {!formData.locationUri && formData.location && !isSearchingLocation && (
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 ml-1 italic">
                Dica: Use a busca da IA para garantir que todos cheguem no local certo.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-2 ml-1">Nº Jogadores</label>
              <input 
                required
                type="number" 
                className="w-full px-5 py-4 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition font-bold text-gray-900 dark:text-white"
                value={formData.maxPlayers}
                onChange={e => setFormData({...formData, maxPlayers: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-2 ml-1">Preço Avulso</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-gray-400 font-bold">R$</span>
                <input 
                  required
                  type="number" 
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition font-bold text-gray-900 dark:text-white"
                  value={formData.pricePerPlayer}
                  onChange={e => setFormData({...formData, pricePerPlayer: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 py-4 border-2 border-gray-100 dark:border-[#333333] rounded-2xl font-black uppercase italic text-sm text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-[#262626] transition"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={formData.locationUri && !isLocationConfirmed}
              className={`w-full sm:flex-2 px-8 py-4 ${formData.locationUri && !isLocationConfirmed ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#f16d22] hover:bg-[#d95d1b]'} text-white rounded-2xl font-black uppercase italic text-sm shadow-xl transition transform active:scale-95`}
            >
              {initialData ? 'Salvar Alterações' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchModal;
