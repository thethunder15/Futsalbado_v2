import React, { useMemo } from 'react';
import { Match } from '../types';

interface HistoryModalProps {
    onClose: () => void;
    matches: Match[];
}

const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, matches }) => {
    const finishedMatches = useMemo(() => {
        return matches
            .filter(m => m.status === 'finished')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [matches]);

    const stats = useMemo(() => {
        let amareloWins = 0;
        let laranjaWins = 0;
        let draws = 0;

        finishedMatches.forEach(m => {
            const gA = m.scoreAmarelo || 0;
            const gL = m.scoreLaranja || 0;
            if (gA > gL) amareloWins++;
            else if (gL > gA) laranjaWins++;
            else draws++;
        });

        return { amareloWins, laranjaWins, draws };
    }, [finishedMatches]);

    const winner = stats.amareloWins > stats.laranjaWins ? 'amarelo'
        : stats.laranjaWins > stats.amareloWins ? 'laranja'
            : 'empate';

    const last3 = finishedMatches.slice(0, 3);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-[#1e1e1e] border-b border-gray-100 dark:border-[#2a2a2a] p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#f16d22]/10 rounded-2xl flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Histórico</h2>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Estatísticas do Futsalbado</p>
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

                <div className="p-6">
                    {finishedMatches.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-4">👻</div>
                            <p className="text-gray-400 font-bold uppercase italic tracking-widest text-sm">Nenhuma partida finalizada ainda.</p>
                        </div>
                    ) : (
                        <>
                            {/* Vencedor Supremo */}
                            <div className="mb-8">
                                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span>🏆</span> Maior Vencedor
                                </h3>

                                {winner === 'amarelo' && (
                                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 rounded-[2rem] text-white shadow-xl shadow-yellow-500/20 flex items-center justify-between relative overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Dominante</p>
                                            <h4 className="text-2xl font-black uppercase italic tracking-tighter shadow-sm">Colete Amarelo</h4>
                                            <p className="text-sm font-bold mt-2 opacity-90">{stats.amareloWins} vitórias na conta!</p>
                                        </div>
                                        <span className="text-7xl opacity-50 relative z-10 transform rotate-12 drop-shadow-lg">🌟</span>
                                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
                                    </div>
                                )}

                                {winner === 'laranja' && (
                                    <div className="bg-gradient-to-r from-[#f16d22] to-orange-600 p-6 rounded-[2rem] text-white shadow-xl shadow-orange-900/20 flex items-center justify-between relative overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Soberano</p>
                                            <h4 className="text-2xl font-black uppercase italic tracking-tighter shadow-sm">Colete Laranja</h4>
                                            <p className="text-sm font-bold mt-2 opacity-90">{stats.laranjaWins} vitórias na conta!</p>
                                        </div>
                                        <span className="text-7xl opacity-50 relative z-10 transform rotate-12 drop-shadow-lg">🔥</span>
                                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
                                    </div>
                                )}

                                {winner === 'empate' && (
                                    <div className="bg-gray-100 dark:bg-[#2a2a2a] p-6 rounded-[2rem] border-2 border-gray-200 dark:border-[#333] flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Equilíbrio</p>
                                            <h4 className="text-xl font-black text-gray-800 dark:text-gray-200 uppercase italic tracking-tighter">Tudo Empatado</h4>
                                            <p className="text-sm font-bold text-gray-500 mt-1">{stats.amareloWins} vitórias pra cada lado!</p>
                                        </div>
                                        <span className="text-5xl opacity-50">⚖️</span>
                                    </div>
                                )}
                            </div>

                            {/* Ultimos 3 jogos */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span>⏪</span> Últimos 3 Jogos
                                </h3>

                                <div className="space-y-4">
                                    {last3.map(match => {
                                        const amScore = match.scoreAmarelo || 0;
                                        const larScore = match.scoreLaranja || 0;
                                        const isAmWinner = amScore > larScore;
                                        const isLarWinner = larScore > amScore;

                                        return (
                                            <div key={match.id} className="bg-white dark:bg-[#262626] border border-gray-100 dark:border-[#333] rounded-2xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between shadow-sm">

                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#f16d22] mb-1">
                                                        {new Date(match.date).toLocaleDateString('pt-BR')}
                                                    </p>
                                                    <h5 className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate max-w-[150px]">{match.title}</h5>
                                                </div>

                                                <div className="flex items-center gap-4 bg-gray-50 dark:bg-[#1e1e1e] p-2 rounded-xl border border-gray-100 dark:border-[#2a2a2a]">
                                                    {/* Amarelo */}
                                                    <div className={`flex flex-col items-center min-w-[3rem] ${isAmWinner ? 'opacity-100 scale-110' : 'opacity-60'}`}>
                                                        <span className="text-[10px] font-black text-yellow-500 uppercase">AMA</span>
                                                        <span className={`text-2xl font-black italic ${isAmWinner ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-600'}`}>
                                                            {amScore}
                                                        </span>
                                                    </div>

                                                    <span className="text-xs font-black italic text-gray-300 dark:text-gray-600">X</span>

                                                    {/* Laranja */}
                                                    <div className={`flex flex-col items-center min-w-[3rem] ${isLarWinner ? 'opacity-100 scale-110' : 'opacity-60'}`}>
                                                        <span className="text-[10px] font-black text-[#f16d22] uppercase">LAR</span>
                                                        <span className={`text-2xl font-black italic ${isLarWinner ? 'text-[#f16d22]' : 'text-gray-400 dark:text-gray-600'}`}>
                                                            {larScore}
                                                        </span>
                                                    </div>
                                                </div>

                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
