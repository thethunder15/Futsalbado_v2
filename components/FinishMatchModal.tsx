import React, { useState } from 'react';

interface FinishMatchModalProps {
    onClose: () => void;
    onSubmit: (scoreAmarelo: number, scoreLaranja: number) => void;
}

import WhistleIcon from './WhistleIcon';

const FinishMatchModal: React.FC<FinishMatchModalProps> = ({ onClose, onSubmit }) => {
    const [scoreAmarelo, setScoreAmarelo] = useState<string>('');
    const [scoreLaranja, setScoreLaranja] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (scoreAmarelo === '' || scoreLaranja === '') {
            alert("Por favor, preencha o placar das duas equipes!");
            return;
        }
        onSubmit(parseInt(scoreAmarelo, 10), parseInt(scoreLaranja, 10));
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                        <WhistleIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Finalizar Jogo</h2>
                    <p className="text-green-100 text-xs font-bold uppercase tracking-wider mt-1">Grave o resultado épico para a história</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-8 gap-4">
                        {/* Amarelo */}
                        <div className="flex-1 text-center">
                            <label className="block text-xs font-black text-yellow-500 uppercase tracking-widest mb-2">Amarelo</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={scoreAmarelo}
                                onChange={(e) => setScoreAmarelo(e.target.value)}
                                className="w-full text-center text-4xl font-black bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-200 dark:border-yellow-900/30 rounded-2xl py-3 focus:outline-none focus:ring-4 ring-yellow-500/20 text-gray-800 dark:text-gray-200"
                                placeholder="0"
                            />
                        </div>

                        <div className="text-2xl font-black text-gray-300 dark:text-gray-600 italic">X</div>

                        {/* Laranja */}
                        <div className="flex-1 text-center">
                            <label className="block text-xs font-black text-[#f16d22] uppercase tracking-widest mb-2">Laranja</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={scoreLaranja}
                                onChange={(e) => setScoreLaranja(e.target.value)}
                                className="w-full text-center text-4xl font-black bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-900/30 rounded-2xl py-3 focus:outline-none focus:ring-4 ring-orange-500/20 text-gray-800 dark:text-gray-200"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-2xl font-black uppercase italic text-xs hover:bg-gray-200 transition-all transform active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] bg-green-500 text-white py-4 rounded-2xl font-black uppercase italic text-xs shadow-lg shadow-green-900/20 hover:bg-green-600 transition-all transform active:scale-95"
                        >
                            SALVAR PLACAR
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FinishMatchModal;
