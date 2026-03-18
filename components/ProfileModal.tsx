
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (user: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<User>({ ...user });
  const [showCamera, setShowCamera] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Alterar senha
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setPasswordLoading(true);
    try {
      // Re-autenticar com senha atual
      const fakeEmail = `${user.phone.replace(/\D/g, '')}@futsalbado.com`;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: currentPassword,
      });
      if (signInError) {
        setPasswordError('Senha atual incorreta.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setPasswordSuccess('Senha alterada com sucesso! 🎉');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess('');
      }, 2500);
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao alterar senha.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
        setShowImageOptions(false);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    setShowImageOptions(false);
    setCameraError(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 400, height: 400 },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setCameraError("Não foi possível acessar a câmera. Verifique as permissões.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Garantir captura quadrada
        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = 400;
        canvas.height = 400;

        context.drawImage(
          video,
          (video.videoWidth - size) / 2, (video.videoHeight - size) / 2, size, size,
          0, 0, 400, 400
        );

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData({ ...formData, avatar: dataUrl });
        stopCamera();
      }
    }
  };

  // Limpar câmera ao fechar modal
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Função para gerar avatar masculino randômico
  const generateMaleAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    // Usando estilo pixel-art que é bem neutro/masculino ou avataaars com restrições
    const maleAvatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${randomSeed}&accessoriesProbability=10`;
    setFormData({ ...formData, avatar: maleAvatarUrl });
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in border-4 border-gray-100 dark:border-[#2a2a2a] max-h-[95vh] flex flex-col">
        <div className="p-8 border-b border-gray-100 dark:border-[#2a2a2a] flex justify-between items-center bg-[#f16d22] text-white shrink-0">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Meu Perfil de Atleta</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Ajuste seu estilo de jogo</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-black/10 transition flex items-center justify-center font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          <div className="flex flex-col items-center mb-4">
            {!showCamera ? (
              <div className="relative group mb-4">
                <img
                  src={formData.avatar}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full border-4 border-[#f16d22] shadow-lg object-cover bg-gray-100 dark:bg-[#262626]"
                />

                {showImageOptions && (
                  <div className="absolute top-1/2 left-[110%] -translate-y-1/2 ml-2 bg-white dark:bg-[#1e1e1e] border-2 border-gray-100 dark:border-[#333333] rounded-2xl shadow-xl p-2 flex flex-col gap-2 min-w-[160px] z-50 animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#262626] rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 transition flex items-center gap-2"
                    >
                      <span>📷</span> Câmera
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowImageOptions(false);
                        fileInputRef.current?.click();
                      }}
                      className="text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#262626] rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 transition flex items-center gap-2"
                    >
                      <span>🖼️</span> Galeria
                    </button>
                  </div>
                )}

                <div className="absolute -bottom-2 -right-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImageOptions(!showImageOptions)}
                    className="bg-blue-600 text-white p-3 rounded-full border-2 border-white dark:border-[#1e1e1e] hover:scale-110 transition-transform shadow-md"
                    title="Alterar Foto"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={generateMaleAvatar}
                    className="bg-gray-900 text-white p-3 rounded-full border-2 border-white dark:border-[#1e1e1e] hover:scale-110 transition-transform shadow-md"
                    title="Novo Avatar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-4 animate-in fade-in zoom-in-95">
                <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-[#f16d22] bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover mirror"
                  />
                  <div className="absolute inset-0 border-[16px] border-black/20 pointer-events-none rounded-full"></div>
                </div>
                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-6 py-2 bg-gray-500 text-white rounded-xl font-black uppercase italic text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-6 py-2 bg-[#f16d22] text-white rounded-xl font-black uppercase italic text-xs shadow-lg"
                  >
                    Capturar Foto 📸
                  </button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            {cameraError && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase">{cameraError}</p>}
          </div>

          {!showCamera && (
            <>
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-2 ml-1">Seu Nome / Apelido</label>
                <input
                  required
                  type="text"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition font-bold text-gray-900 dark:text-white"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-2 ml-1">Posição</label>
                  <select
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition font-bold text-gray-900 dark:text-white"
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value as any })}
                  >
                    <option value="Goleiro">Goleiro</option>
                    <option value="Zagueiro">Zagueiro</option>
                    <option value="Lateral">Lateral</option>
                    <option value="Meio">Meio</option>
                    <option value="Atacante">Atacante</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-2 ml-1">Peso (kg)</label>
                  <input
                    required
                    type="number"
                    min="30"
                    max="200"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition font-bold text-gray-900 dark:text-white"
                    value={formData.weight || ''}
                    onChange={e => setFormData({ ...formData, weight: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-2 ml-1 flex items-center justify-between">
                    <span>Hab</span>
                    <span className="text-[9px] text-[#f16d22]">★</span>
                  </label>
                  <div
                    className="w-full px-5 py-[14px] bg-gray-100 dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-[#2a2a2a] rounded-2xl font-black text-gray-500 dark:text-gray-400 cursor-not-allowed flex items-center gap-2 shadow-inner"
                    title="Sua habilidade agora é atualizada baseada nas avaliações dos colegas de equipe durante as partidas."
                  >
                    <span className="text-yellow-500 text-lg">⭐</span>
                    <span className="text-xl">{Number(formData.rating).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Seção Alterar Senha */}
              <div className="border-t border-gray-100 dark:border-[#2a2a2a] pt-4">
                <button
                  type="button"
                  onClick={() => { setShowChangePassword(!showChangePassword); setPasswordError(''); setPasswordSuccess(''); }}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl font-black uppercase italic text-sm text-gray-500 dark:text-gray-400 hover:border-[#f16d22] hover:text-[#f16d22] transition-all"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Alterar Senha
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showChangePassword ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                </button>

                {showChangePassword && (
                  <form onSubmit={handleChangePassword} className="mt-3 space-y-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl p-4 animate-in slide-in-from-top-2">
                    {passwordError && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-xl text-xs font-bold">{passwordError}</div>
                    )}
                    {passwordSuccess && (
                      <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-xl text-xs font-bold">{passwordSuccess}</div>
                    )}

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Senha Atual</label>
                      <div className="relative">
                        <input
                          type={showCurrentPwd ? 'text' : 'password'}
                          placeholder="••••••"
                          required
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 bg-white dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-xl focus:ring-2 focus:ring-[#f16d22] outline-none transition text-gray-900 dark:text-white font-bold text-sm"
                        />
                        <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition">
                          {showCurrentPwd ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Nova Senha</label>
                      <div className="relative">
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          placeholder="••••••"
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 bg-white dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-xl focus:ring-2 focus:ring-[#f16d22] outline-none transition text-gray-900 dark:text-white font-bold text-sm"
                        />
                        <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition">
                          {showNewPwd ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        placeholder="••••••"
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-xl focus:ring-2 focus:ring-[#f16d22] outline-none transition text-gray-900 dark:text-white font-bold text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className={`w-full py-3 bg-[#f16d22] text-white rounded-xl font-black uppercase italic text-xs shadow-lg hover:bg-[#d95d1b] transition-all ${passwordLoading ? 'opacity-50' : 'active:scale-95'}`}
                    >
                      {passwordLoading ? 'Salvando...' : '🔒 Confirmar Nova Senha'}
                    </button>
                  </form>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-4 border-2 border-gray-100 dark:border-[#333333] rounded-2xl font-black uppercase italic text-sm text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-[#262626] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-2 px-8 py-4 bg-[#f16d22] text-white rounded-2xl font-black uppercase italic text-sm hover:bg-[#d95d1b] shadow-xl transition transform active:scale-95"
                >
                  Salvar Alterações
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
