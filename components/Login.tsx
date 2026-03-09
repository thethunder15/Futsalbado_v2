
import React, { useState } from 'react';
import { User } from '../types';
import Logo from './Logo';
import { supabase } from '../services/supabase';

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

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Login state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regPosition, setRegPosition] = useState<User['position']>('Meio');
  const [regWeight, setRegWeight] = useState<number>(75);
  const [regRating, setRegRating] = useState(3);
  const [regError, setRegError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsAuthenticating(true);

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('As variáveis de ambiente do Supabase não estão configuradas. Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no painel do AI Studio.');
      }

      // Usamos um email fictício baseado no telefone para usar a autenticação padrão do Supabase
      // sem precisar configurar um provedor de SMS (Twilio, etc)
      const fakeEmail = `${phone.replace(/\D/g, '')}@futsalbado.com`;

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao fazer login');

      // Buscar o perfil do usuário na tabela public.users
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (dbError) throw dbError;

      if (userData) {
        onLogin(userData as User);
      } else {
        throw new Error('Perfil não encontrado');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      setLoginError('Telefone ou senha inválidos.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setRegError('');

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('As variáveis de ambiente do Supabase não estão configuradas. Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no painel do AI Studio.');
      }

      const fakeEmail = `${regPhone.replace(/\D/g, '')}@futsalbado.com`;

      let authUserId: string | undefined;

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: regPassword,
      });

      if (authError) {
        // Se o usuário já existe no Auth (ex: perfil deletado mas auth mantido)
        if (authError.message.includes('User already registered') || authError.message.includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: fakeEmail,
            password: regPassword,
          });

          if (signInError) {
            throw new Error('Este telefone já está em uso porem a senha informada não confere. Tente o formulário de Login.');
          }
          authUserId = signInData.user?.id;
        } else {
          throw authError;
        }
      } else {
        authUserId = authData.user?.id;
      }

      if (!authUserId) throw new Error('Erro ao criar usuário');

      // 2. Verificar se o perfil já existe na tabela public.users
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .single();
        
      if (existingUser) {
        // Se o usuário já existe na tabela public.users, mostramos erro amigável na tela de cadastro
        throw new Error('Esta conta já existe. Por favor, volte e faça Login.');
      }

      // 3. Inserir novo perfil na tabela public.users
      const newUser: User = {
        id: authUserId,
        name: regName || 'Craque',
        phone: regPhone,
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${regName || Math.random()}&accessoriesProbability=10`,
        rating: regRating,
        position: regPosition,
        weight: regWeight
      };

      const { error: dbError } = await supabase
        .from('users')
        .insert([
          {
            id: newUser.id,
            name: newUser.name,
            phone: newUser.phone,
            avatar: newUser.avatar,
            rating: newUser.rating,
            position: newUser.position,
            weight: newUser.weight
          }
        ]);

      if (dbError) {
        console.error("Erro no DB Insert:", dbError);
        if (dbError.code === '23505') {
            throw new Error('Este telefone já está registrado para outro craque. Tente fazer Login.');
        }
        throw dbError;
      }

      onLogin(newUser);
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      setRegError(error.message || 'Erro ao criar conta. Verifique os dados e tente novamente.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (showProfileSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#f8f9fa] dark:bg-[#121212] transition-colors duration-300">
        <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-gray-100 dark:border-[#2a2a2a]">
          <div className="flex justify-center mb-6">
            <Logo className="w-20 h-20" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1 text-center uppercase italic tracking-tight">
            Crie sua Conta
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm text-center font-medium">
            Registre-se para entrar em quadra!
          </p>

          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            {regError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative text-xs font-bold" role="alert">
                <span className="block sm:inline">{regError}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1.5 ml-1">Seu Nome / Apelido</label>
              <input
                required
                type="text"
                placeholder="Ex: Falcão"
                className="w-full px-4 py-3 bg-white dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] focus:border-[#f16d22] outline-none transition text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700 font-bold"
                value={regName}
                onChange={e => setRegName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1.5 ml-1">Telefone</label>
              <input
                required
                type="tel"
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 bg-white dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] focus:border-[#f16d22] outline-none transition text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700 font-bold"
                value={regPhone}
                onChange={e => setRegPhone(formatPhoneNumber(e.target.value))}
                maxLength={15}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1.5 ml-1">Senha</label>
              <div className="relative">
                <input
                  required
                  type={showRegPassword ? "text" : "password"}
                  placeholder="••••••"
                  className="w-full px-4 py-3 pr-12 bg-white dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] focus:border-[#f16d22] outline-none transition text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700 font-bold"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  minLength={6}
                  title="A senha deve ter pelo menos 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  aria-label={showRegPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showRegPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mt-1.5 ml-2 tracking-wide">Mínimo 6 caracteres</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1.5 ml-1">Posição</label>
                <select
                  className="w-full px-4 py-3 bg-white dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition text-gray-900 dark:text-white cursor-pointer font-bold"
                  value={regPosition}
                  onChange={e => setRegPosition(e.target.value as any)}
                >
                  <option value="Goleiro">Goleiro</option>
                  <option value="Zagueiro">Zagueiro</option>
                  <option value="Lateral">Lateral</option>
                  <option value="Meio">Meio</option>
                  <option value="Atacante">Atacante</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1.5 ml-1">Peso (kg)</label>
                <input
                  required
                  type="number"
                  min="30"
                  max="200"
                  className="w-full px-4 py-3 bg-white dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition text-gray-900 dark:text-white font-bold"
                  value={regWeight}
                  onChange={e => setRegWeight(parseInt(e.target.value) || 75)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1.5 ml-1">Habilidade</label>
                <select
                  className="w-full px-4 py-3 bg-white dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] outline-none transition text-gray-900 dark:text-white cursor-pointer font-bold"
                  value={regRating}
                  onChange={e => setRegRating(parseInt(e.target.value))}
                >
                  <option value="1">⭐ Perna de Pau</option>
                  <option value="2">⭐⭐ Esforçado</option>
                  <option value="3">⭐⭐⭐ Joga Muito</option>
                  <option value="4">⭐⭐⭐⭐ Profissional</option>
                  <option value="5">⭐⭐⭐⭐⭐ Seleção</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button
                type="submit"
                disabled={isAuthenticating}
                className={`w-full bg-[#f16d22] text-white py-4 rounded-2xl font-black uppercase italic shadow-xl shadow-orange-900/20 hover:bg-[#d95d1b] transition-all ${isAuthenticating ? 'opacity-50' : 'transform active:scale-95'}`}
              >
                {isAuthenticating ? 'Registrando...' : 'Criar Conta'}
              </button>

              <button
                type="button"
                onClick={() => setShowProfileSetup(false)}
                className="w-full py-3 text-gray-400 dark:text-gray-600 font-black uppercase italic text-[10px] tracking-[0.2em] hover:text-gray-600 dark:hover:text-gray-400 transition-all text-center flex items-center justify-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar para o Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f8f9fa] dark:bg-[#121212] transition-colors duration-300 overflow-hidden">
      {/* Indicador de Carregamento Overlay */}
      {isAuthenticating && (
        <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#f16d22]/20 border-t-[#f16d22] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl animate-bounce">⚽</span>
            </div>
          </div>
          <h3 className="mt-6 text-lg font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
            Validando Craque...
          </h3>
        </div>
      )}

      <div className="bg-white dark:bg-[#1e1e1e] p-10 rounded-[3rem] shadow-2xl w-full max-w-sm text-center relative overflow-hidden border border-gray-100 dark:border-[#2a2a2a]">
        <div className="absolute top-0 left-0 right-0 h-3 bg-[#f16d22]"></div>

        <div className="flex justify-center mb-8">
          <Logo className="w-32 h-32" />
        </div>

        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase italic">Futsalbado</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm font-bold uppercase tracking-widest">A Pelada de Todo Sábado</p>

        <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
          {loginError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative text-xs font-bold" role="alert">
              <span className="block sm:inline">{loginError}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1.5 ml-1">Telefone</label>
            <input
              required
              type="tel"
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 bg-white dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] focus:border-[#f16d22] outline-none transition text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700 font-bold"
              value={phone}
              onChange={e => setPhone(formatPhoneNumber(e.target.value))}
              maxLength={15}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-1.5 ml-1">Senha</label>
            <div className="relative">
              <input
                required
                type={showLoginPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 bg-white dark:bg-[#262626] border-2 border-gray-100 dark:border-[#333333] rounded-2xl focus:ring-2 focus:ring-[#f16d22] focus:border-[#f16d22] outline-none transition text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700 font-bold"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label={showLoginPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showLoginPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className={`w-full bg-[#f16d22] text-white py-4 rounded-2xl font-black uppercase italic shadow-xl shadow-orange-900/20 hover:bg-[#d95d1b] transition-all mt-2 ${isAuthenticating ? 'opacity-50' : 'transform active:scale-95'}`}
          >
            Entrar
          </button>
        </form>

        <div className="relative py-4 mt-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-[#2a2a2a]"></div></div>
          <div className="relative flex justify-center text-[10px] font-black uppercase"><span className="bg-white dark:bg-[#1e1e1e] px-3 text-gray-300 dark:text-gray-700">Ou</span></div>
        </div>

        <button
          onClick={() => setShowProfileSetup(true)}
          className="w-full bg-[#1a1a1a] dark:bg-white text-white dark:text-black px-6 py-4 rounded-2xl hover:bg-black dark:hover:bg-gray-100 transition-all shadow-xl font-black uppercase italic text-sm transform active:scale-95"
        >
          Criar Nova Conta
        </button>

        <p className="mt-8 text-[9px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-tight">
          Exclusivo para os membros do Futsalbado
        </p>
      </div>
    </div>
  );
};

export default Login;
