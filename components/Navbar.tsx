
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import Logo from './Logo';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onEditProfile: () => void;
  onShowRanking: () => void;
  onShowHistory: () => void;
  onOpenPendingRatings: () => void;
  pendingRatingsCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, theme, onToggleTheme, onEditProfile, onShowRanking, onShowHistory, onOpenPendingRatings, pendingRatingsCount }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] sticky top-0 z-50 shadow-lg transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="w-10 h-10" />
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Futsalbado</h1>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 focus:outline-none group hover:opacity-80 transition-all"
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100 group-hover:text-[#f16d22] transition-colors">{user.name}</span>
              <span className="text-xs text-gray-500 font-medium">{user.position} • ⭐ {user.rating}</span>
            </div>
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-[#f16d22] object-cover"
              />
              <div className="absolute -bottom-1 -right-1 bg-[#f16d22] rounded-full p-0.5 border border-white dark:border-[#1a1a1a]">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-gray-100 dark:border-[#2a2a2a] sm:hidden">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 font-medium">{user.position} • ⭐ {user.rating}</p>
              </div>

              <div className="p-2">
                <button
                  onClick={() => { onEditProfile(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Editar Perfil
                </button>

                <button
                  onClick={() => { onShowRanking(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Ver Ranking
                </button>

                <button
                  onClick={() => { onOpenPendingRatings(); setIsMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors relative"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Avaliações
                  </div>
                  {pendingRatingsCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                      {pendingRatingsCount} pendente{pendingRatingsCount > 1 ? 's' : ''}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { onShowHistory(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-[#f16d22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ver Histórico
                </button>

                <button
                  onClick={() => { onToggleTheme(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors"
                >
                  {theme === 'dark' ? (
                    <>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                      </svg>
                      Modo Claro
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 118.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      Modo Escuro
                    </>
                  )}
                </button>

                <div className="h-[1px] bg-gray-100 dark:bg-[#2a2a2a] my-1"></div>

                <button
                  onClick={() => { onLogout(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
