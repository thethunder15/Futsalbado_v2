
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-2 ml-1 flex items-center justify-between">
                    <span>Habilidade</span>
                    <span className="text-[9px] text-[#f16d22]">★ Definida em quadra</span>
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

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
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
