
import React, { useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

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

interface AdminResetPasswordModalProps {
  onClose: () => void;
}

const AdminResetPasswordModal: React.FC<AdminResetPasswordModalProps> = ({ onClose }) => {
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Criar cliente admin uma única vez para evitar múltiplas instâncias GoTrueClient
  const adminClient = useMemo(() => {
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || serviceRoleKey === 'COLE_SUA_SERVICE_ROLE_KEY_AQUI') return null;
    return createClient(
      import.meta.env.VITE_SUPABASE_URL,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (!adminClient) {
        setError('Configure VITE_SUPABASE_SERVICE_ROLE_KEY no arquivo .env e reinicie o servidor.');
        return;
      }

      // Montar email fictício baseado no telefone
      const digits = phone.replace(/\D/g, '');
      const fakeEmail = `${digits}@futsalbado.com`;

      // Listar usuários e achar pelo email fictício
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (listError) throw listError;

      const targetUser = users.find((u: any) => u.email === fakeEmail);
      if (!targetUser) {
        setError('Usuário não encontrado para este telefone.');
        return;
      }

      // Atualizar a senha
      const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUser.id, {
        password: newPassword,
      });
      if (updateError) throw updateError;

      setSuccess(`✅ Senha do usuário ${phone} redefinida com sucesso!`);
      setPhone('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border-4 border-gray-100 dark:border-[#2a2a2a]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-[#2a2a2a] flex justify-between items-center bg-[#f16d22] text-white">
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Redefinir Senha
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Painel do Administrador</span>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-black/10 transition flex items-center justify-center font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold">{error}</div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-2xl text-xs font-bold">{success}</div>
          )}

          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1.5 ml-1">
              Telefone do Usuário
            </label>
            <input
              required
              type="tel"
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] focus:border-[#f16d22] outline-none transition text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700 font-bold"
              value={phone}
              onChange={e => setPhone(formatPhoneNumber(e.target.value))}
              maxLength={15}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1.5 ml-1">
              Nova Senha
            </label>
            <div className="relative">
              <input
                required
                type={showNewPwd ? 'text' : 'password'}
                placeholder="••••••"
                minLength={6}
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition text-gray-900 dark:text-white font-bold"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition">
                {showNewPwd
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1.5 ml-1">
              Confirmar Nova Senha
            </label>
            <input
              required
              type="password"
              placeholder="••••••"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition text-gray-900 dark:text-white font-bold"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-100 dark:border-[#333333] rounded-2xl font-black uppercase italic text-sm text-gray-400 hover:bg-gray-50 dark:hover:bg-[#262626] transition"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-grow px-6 py-3 bg-[#f16d22] text-white rounded-2xl font-black uppercase italic text-sm shadow-lg hover:bg-[#d95d1b] transition-all ${loading ? 'opacity-50' : 'active:scale-95'}`}
            >
              {loading ? 'Redefinindo...' : '🔑 Redefinir Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminResetPasswordModal;
