
import React, { useState } from 'react';
import { Match, User, TeamDraft } from '../types';
import { balanceTeams } from '../services/gemini';
import { supabase } from '../services/supabase';
import WhistleIcon from './WhistleIcon';

interface MatchCardProps {
  match: Match;
  onJoin: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddMockPlayer: () => void;
  onRemoveMockPlayer: () => void;
  onAddRentedGoalie: () => void;
  onRemoveRentedGoalie: () => void;
  onDraftSaved: () => void;
  onFinishMatch: () => void;
  isJoined: boolean;
  allUsers: Record<string, User>;
  currentUserId: string;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onJoin, onEdit, onDelete, onAddMockPlayer, onRemoveMockPlayer, onAddRentedGoalie, onRemoveRentedGoalie, onDraftSaved, onFinishMatch, isJoined, allUsers, currentUserId }) => {
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const draft = match.draft;

  // Função auxiliar para formatar a data (YYYY-MM-DD -> DD/MM/YYYY) sem usar Date() puro, que causa bugs de fuso horário
  const getFormattedDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleDraftTeams = async () => {
    if (match.players.length < 2) {
      setShowAlert(true);
      return;
    }
    setIsDrafting(true);
    try {
      const result = await balanceTeams(match.players, allUsers);

      // Salvar o draft no Supabase
      if (draft?.id) {
        // Atualiza sorteio existente
        const { error } = await supabase
          .from('team_drafts')
          .update({
            team_amarelo: result.teamAmarelo,
            team_laranja: result.teamLaranja,
            justification: result.justification
          })
          .eq('id', draft.id);

        if (error) throw error;
      } else {
        // Insere novo sorteio
        const { error } = await supabase
          .from('team_drafts')
          .insert([{
            match_id: match.id,
            team_amarelo: result.teamAmarelo,
            team_laranja: result.teamLaranja,
            justification: result.justification
          }]);

        if (error) throw error;
      }

      // Aciona o recarregamento pelo pai
      onDraftSaved();

    } catch (error) {
      console.error(error);
      alert("Erro ao sortear times. Tente novamente.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleShare = async () => {
    const formattedDate = getFormattedDate(match.date);
    let shareText = `*CONVOCAÇÃO FUTSALBADO!* ⚽🔥\n\n`;
    shareText += `🏆 *${match.title}*\n`;
    shareText += `📅 Data: ${formattedDate}\n`;
    shareText += `⏰ Horário: ${match.time}\n`;
    shareText += `📍 Local: ${match.location}\n`;

    // Inserção crucial das coordenadas no link de compartilhamento
    if (match.locationUri) {
      shareText += `🗺️ *Link do GPS:* ${match.locationUri}\n`;
    }

    shareText += `💰 Valor: R$ ${match.pricePerPlayer},00\n\n`;
    shareText += `*Confirme sua vaga agora:* ${window.location.origin}/#match=${match.id}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const isAdmin = allUsers[currentUserId]?.isAdmin;

  const isUpcoming = () => {
    try {
      const matchDateTime = new Date(`${match.date}T${match.time}`);
      return matchDateTime > new Date();
    } catch (e) {
      return true; // Default to true if parsing fails
    }
  };

  const canEditOrDelete = isAdmin;

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-lg border border-gray-100 dark:border-[#2a2a2a] overflow-hidden hover:shadow-xl hover:border-gray-200 dark:hover:border-[#3a3a3a] transition-all group relative">
      {/* Custom Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-[2rem] shadow-2xl border-4 border-[#f16d22] p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-2">Faltam Atletas!</h3>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-6">
              É necessário pelo menos <span className="text-[#f16d22]">2 jogadores</span> confirmados para realizar o sorteio equilibrado pela IA.
            </p>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full bg-[#f16d22] text-white py-4 rounded-2xl font-black uppercase italic text-sm shadow-lg shadow-orange-900/20 hover:bg-[#d95d1b] transition-all transform active:scale-95"
            >
              Entendido, Chefe!
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-[2rem] shadow-2xl border-4 border-red-500 p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🗑️</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-2">Excluir Partida?</h3>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-6">
              Esta ação removerá o jogo da lista permanentemente. Tem certeza, capitão?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-2xl font-black uppercase italic text-xs hover:bg-gray-200 transition-all transform active:scale-95"
              >
                Manter Jogo
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black uppercase italic text-xs shadow-lg shadow-red-900/20 hover:bg-red-600 transition-all transform active:scale-95"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4 sm:gap-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-50 dark:bg-[#2a2a2a] rounded-2xl flex items-center justify-center border-2 border-gray-100 dark:border-[#3a3a3a] group-hover:border-orange-200 dark:group-hover:border-orange-900 transition-colors shrink-0">
              <span className="text-2xl">⚽</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tight leading-none mb-2">{match.title}</h3>
              {match.locationUri ? (
                <a
                  href={match.locationUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#f16d22] hover:text-[#d95d1b] font-bold uppercase tracking-wider underline transition-colors"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate max-w-[200px] sm:max-w-[300px]">{match.location}</span> (Ver GPS)
                </a>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="truncate max-w-[200px] sm:max-w-[300px]">{match.location}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              {canEditOrDelete && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={onEdit}
                    className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-all group/edit"
                    title="Editar Partida"
                  >
                    <svg className="w-5 h-5 group-hover/edit:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all group/del"
                    title="Excluir Partida"
                  >
                    <svg className="w-5 h-5 group-hover/del:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="bg-[#f16d22] text-white px-3 py-1.5 rounded-xl shadow-lg shadow-orange-900/10 flex flex-col items-center justify-center leading-tight">
                <div className="flex items-center gap-1 font-black italic">
                  <span className="text-[10px] opacity-80 not-italic font-bold">R$</span>
                  <span className="text-sm">{match.pricePerPlayer}</span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-90 border-t border-white/20 pt-0.5 w-full text-center">
                  / Avulso
                </span>
              </div>
            </div>

            <button
              onClick={handleShare}
              className={`mt-0 sm:mt-2 flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 rounded-lg text-[10px] font-black uppercase italic transition-all border ${copied
                ? 'bg-green-500 border-green-600 text-white'
                : 'bg-gray-100 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:bg-[#f16d22] hover:text-white hover:border-[#f16d22]'
                }`}
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado!
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Convocar
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-[#333333]">
            <div className="text-xl">📅</div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest">Data</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase italic">{getFormattedDate(match.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-[#333333]">
            <div className="text-xl">⏰</div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest">Horário</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase italic">{match.time}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Atletas Confirmados</span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg p-0.5 border border-gray-200 dark:border-[#333]">
                  <button
                    onClick={onRemoveMockPlayer}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:bg-white dark:hover:bg-[#333] hover:text-red-500 transition-colors"
                    title="Remover Convidado"
                  >
                    -
                  </button>
                  <span className="text-[9px] font-bold text-gray-400 px-1 uppercase gap-1 flex items-center">Convidados 🎟️</span>
                  <button
                    onClick={onAddMockPlayer}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:bg-white dark:hover:bg-[#333] hover:text-green-500 transition-colors"
                    title="Adicionar Convidado"
                  >
                    +
                  </button>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-0.5 border border-blue-200 dark:border-blue-900/30">
                    <button
                      onClick={onRemoveRentedGoalie}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-blue-500 hover:bg-white dark:hover:bg-[#333] hover:text-red-500 transition-colors"
                      title="Remover Goleiro Ap"
                    >
                      -
                    </button>
                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 px-1 uppercase gap-1 flex items-center">Goleiro Ap 🧤</span>
                    <button
                      onClick={onAddRentedGoalie}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-blue-500 hover:bg-white dark:hover:bg-[#333] hover:text-green-500 transition-colors"
                      title="Adicionar Goleiro Ap"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs font-black text-[#f16d22] uppercase tracking-wider">{match.players.length}/{match.maxPlayers}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-[#2a2a2a] h-3 rounded-full overflow-hidden p-0.5 border border-gray-50 dark:border-[#333333]">
            <div
              className="bg-[#f16d22] h-full rounded-full transition-all duration-500"
              style={{ width: `${(match.players.length / match.maxPlayers) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 min-h-[40px]">
          {match.players.map(p => {
            const isMe = p.userId === currentUserId;
            const isUserOrganizer = p.userId === match.organizerId;
            return (
              <div
                key={p.userId}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all shadow-inner ${isMe
                  ? 'bg-[#f16d22] text-white border-orange-600 ring-2 ring-orange-500/20 shadow-md'
                  : 'bg-gray-50 dark:bg-[#262626] text-gray-700 dark:text-gray-300 border-gray-100 dark:border-[#333333]'
                  }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${isMe ? 'bg-white animate-pulse' : 'bg-[#f16d22]'}`}></div>
                <span className="flex items-center gap-1">
                  {p.name}
                  {isUserOrganizer && (
                    <span title="Organizador" className="text-yellow-500 drop-shadow-sm filter">👑</span>
                  )}
                </span>
                {isMe && <span className="text-[9px] font-black opacity-80 ml-0.5 tracking-tighter">(VOCÊ)</span>}
              </div>
            );
          })}
          {match.players.length === 0 && <p className="text-[11px] text-gray-400 dark:text-gray-600 font-bold uppercase italic tracking-widest">Aguardando convocados...</p>}
        </div>

        {match.status === 'finished' ? (
          <div className="bg-gradient-to-r from-gray-900 to-black p-4 rounded-2xl flex items-center justify-between text-white shadow-xl mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
            <div className="flex flex-col items-center z-10">
              <span className="text-[10px] font-black uppercase text-yellow-500 tracking-widest">Amarelo</span>
              <span className="text-3xl font-black italic">{match.scoreAmarelo}</span>
            </div>
            <div className="flex flex-col items-center z-10 px-4">
              <WhistleIcon className="w-6 h-6" />
              <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Fim de Jogo</span>
            </div>
            <div className="flex flex-col items-center z-10">
              <span className="text-[10px] font-black justify-self-end text-[#f16d22] uppercase tracking-widest">Laranja</span>
              <span className="text-3xl font-black italic">{match.scoreLaranja}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <button
              onClick={onJoin}
              className={`w-full sm:flex-1 py-4 rounded-2xl font-black uppercase italic text-sm transition-all transform active:scale-95 shadow-lg ${isJoined
                ? 'bg-gray-100 dark:bg-[#2a2a2a] text-red-500 border-2 border-red-500/20 hover:bg-red-500/10'
                : 'bg-[#f16d22] text-white hover:bg-[#d95d1b] shadow-orange-900/20'
                }`}
            >
              {isJoined ? 'Cancelar Presença' : 'Confirmar Presença'}
            </button>

            {isAdmin && (
              <button
                onClick={handleDraftTeams}
                disabled={isDrafting}
                className="w-full sm:w-auto px-6 py-4 bg-gray-900 dark:bg-[#1a1a1a] text-white rounded-2xl font-black uppercase italic text-sm hover:bg-black border border-gray-700 dark:border-[#333333] transition-all disabled:opacity-50 transform active:scale-95 shadow-xl"
              >
                {isDrafting ? 'Sortear...' : 'SORTEIA AI'}
              </button>
            )}

            {isAdmin && draft && (
              <button
                onClick={onFinishMatch}
                className="w-full sm:w-auto px-6 py-4 bg-green-500 text-white rounded-2xl font-black uppercase italic text-sm hover:bg-green-600 border border-green-600 transition-all transform active:scale-95 shadow-xl shadow-green-900/20 flex items-center justify-center gap-2"
              >
                <WhistleIcon className="w-5 h-5 mb-0.5" /> Finalizar
              </button>
            )}
          </div>
        )}

        {draft && (
          <div className="mt-8 p-6 bg-[#f16d22]/5 border-2 border-[#f16d22]/20 rounded-[2rem] animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-black text-gray-900 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
                <span className="text-lg">🤖</span> Times Equilibrados
              </h4>
              <div className="h-0.5 flex-1 mx-4 bg-[#f16d22]/10"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-2xl shadow-sm border border-yellow-200 dark:border-yellow-900/30">
                <p className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mb-3 border-b border-yellow-200 dark:border-yellow-900/30 pb-2">Colete Amarelo</p>
                <div className="space-y-2">
                  {['Goleiro', 'Zagueiro', 'Lateral', 'Meio', 'Atacante'].map(position => {
                    const playersInPosition = draft.teamAmarelo
                      .map(name => match.players.find(p => p.name === name))
                      .filter(Boolean)
                      .filter(p => p && allUsers[p.userId]?.position === position);
                    
                    if (playersInPosition.length === 0) return null;
                    
                    return (
                      <div key={`amarelo-${position}`} className="mb-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-yellow-700/60 dark:text-yellow-500/60 block mb-1">{position}s</span>
                        <ul className="text-xs font-bold text-gray-700 dark:text-gray-300 space-y-1">
                          {playersInPosition.map((p, index) => (
                            <li key={`amarelo-${p!.userId}-${index}`} className="flex items-center justify-between bg-yellow-100/50 dark:bg-yellow-900/20 px-2 py-1.5 rounded-lg border border-yellow-200/50 dark:border-yellow-700/30">
                              <span className="flex items-center gap-1.5">⚽ {p!.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-yellow-200 dark:bg-yellow-800 rounded font-black uppercase text-yellow-800 dark:text-yellow-200">{position.substring(0, 3)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl shadow-sm border border-orange-200 dark:border-orange-900/30">
                <p className="text-[10px] font-black text-[#f16d22] uppercase tracking-widest mb-3 border-b border-orange-200 dark:border-orange-900/30 pb-2">Colete Laranja</p>
                <div className="space-y-2">
                  {['Goleiro', 'Zagueiro', 'Lateral', 'Meio', 'Atacante'].map(position => {
                    const playersInPosition = draft.teamLaranja
                      .map(name => match.players.find(p => p.name === name))
                      .filter(Boolean)
                      .filter(p => p && allUsers[p.userId]?.position === position);
                    
                    if (playersInPosition.length === 0) return null;
                    
                    return (
                      <div key={`laranja-${position}`} className="mb-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-orange-700/60 dark:text-orange-500/60 block mb-1">{position}s</span>
                        <ul className="text-xs font-bold text-gray-700 dark:text-gray-300 space-y-1">
                          {playersInPosition.map((p, index) => (
                            <li key={`laranja-${p!.userId}-${index}`} className="flex items-center justify-between bg-orange-100/50 dark:bg-orange-900/20 px-2 py-1.5 rounded-lg border border-orange-200/50 dark:border-orange-700/30">
                              <span className="flex items-center gap-1.5">⚽ {p!.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-orange-200 dark:bg-orange-800 rounded font-black uppercase text-orange-800 dark:text-orange-200">{position.substring(0, 3)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#f16d22]/80 mt-4 font-bold italic border-t border-[#f16d22]/10 pt-3">"{draft.justification}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
