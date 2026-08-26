import React, { useState, useEffect } from 'react';
import { Shield, User, LogOut, Menu, X, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { BrandLogo } from './Logo';

export const Header = ({ onOpenAuth, onOpenUpload, onOpenAdmin, currentView, setCurrentView }) => {
  const { user, isOwner, isModerator, canManage, logout } = useAuth();
  const { pendingPhotos, messages } = useData();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const unreadMessagesCount = messages.filter(m => !m.read).length;
  const totalAdminBadge = pendingPhotos.length + unreadMessagesCount;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Cosa Facciamo', href: '#categorie' },
    { name: 'Eventi', href: '#eventi' },
    { name: 'Galleria', href: '#gallery' },
    { name: 'Chi Siamo', href: '#chi-siamo' },
    { name: 'Contatti', href: '#contatti' },
  ];

  const getRoleLabel = () => {
    if (isOwner) return '👑 OWNER';
    if (isModerator) return '🛡️ MODERATORE';
    return 'UTENTE';
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-alpine-950/90 backdrop-blur-md border-b border-cyan-500/15 shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-3'
          : 'bg-gradient-to-b from-black/85 via-black/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <a
            href="#home"
            className="flex items-center gap-3 group focus:outline-none"
            onClick={() => {
              if (currentView === 'admin') setCurrentView('public');
            }}
          >
            <BrandLogo size="md" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-alpine-900/60 border border-cyan-500/20 rounded-full px-4 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.05)]">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-full transition-all duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs & User Area */}
          <div className="hidden sm:flex items-center gap-3">
            
            {/* Upload moments button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-200 hover:text-white border border-cyan-500/30 transition-all duration-200 hover:border-cyan-400 hover:shadow-glow-cyan"
              title="Carica le tue foto delle serate"
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>Carica Momenti</span>
            </button>

            {/* Admin Dashboard button (Visible if logged in as Owner or Moderator) */}
            {canManage && (
              <button
                onClick={onOpenAdmin}
                className="relative flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black shadow-glow-cyan transition-all duration-200 active:scale-95"
              >
                <Shield className="w-4 h-4" />
                <span>Pannello Gestione</span>
                {totalAdminBadge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-alpine-950 animate-bounce">
                    {totalAdminBadge}
                  </span>
                )}
              </button>
            )}

            {/* User Account / Login button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-alpine-800/80 border border-cyan-500/20 hover:border-cyan-400/60 text-xs font-medium text-zinc-200 transition-all"
                >
                  <span className="text-base">{user.avatar || '👤'}</span>
                  <span className="font-semibold text-white max-w-[100px] truncate">{user.name}</span>
                  {canManage && (
                    <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                      {isOwner ? 'OWNER' : 'MOD'}
                    </span>
                  )}
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-alpine-900/95 border border-cyan-500/30 rounded-2xl shadow-card py-2 px-1 z-50 backdrop-blur-xl animate-fadeIn">
                    <div className="px-3 py-2 border-b border-cyan-500/10 mb-1">
                      <p className="text-xs text-zinc-400">Accesso effettuato come</p>
                      <p className="text-sm font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-cyan-400 font-mono">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[9px] font-mono font-bold">
                        {getRoleLabel()}
                      </span>
                    </div>

                    {canManage && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAdmin();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Pannello Gestione
                        {totalAdminBadge > 0 && (
                          <span className="ml-auto bg-cyan-400 text-black text-[10px] font-bold px-1.5 rounded-full">
                            {totalAdminBadge}
                          </span>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenUpload();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-cyan-400" />
                      Carica Nuova Foto
                    </button>

                    <div className="my-1 border-t border-cyan-500/10"></div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Esci
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-alpine-900/80 hover:bg-cyan-950/50 text-zinc-200 hover:text-cyan-200 border border-cyan-500/20 hover:border-cyan-400/50 transition-all shadow-[0_0_10px_rgba(0,240,255,0.05)]"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Accedi</span>
              </button>
            )}

          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {canManage && (
              <button
                onClick={onOpenAdmin}
                className="relative p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              >
                <Shield className="w-5 h-5" />
                {totalAdminBadge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalAdminBadge}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-alpine-900/80 border border-cyan-500/20 text-zinc-300 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 pb-6 px-4 bg-alpine-900/98 border border-cyan-500/30 rounded-2xl backdrop-blur-xl shadow-2xl space-y-4 animate-fadeIn">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition-all"
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-cyan-500/15 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenUpload();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-200 border border-cyan-500/30"
              >
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                Carica i tuoi momenti
              </button>

              {canManage && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-black shadow-glow-cyan font-extrabold"
                >
                  <Shield className="w-4 h-4" />
                  Pannello Gestione ({getRoleLabel()})
                </button>
              )}

              {user ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-alpine-800/80 border border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{user.avatar || '👤'}</span>
                    <div>
                      <p className="text-xs font-bold text-white">{user.name}</p>
                      <p className="text-[10px] text-cyan-400 font-mono">{getRoleLabel()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-alpine-800 hover:bg-cyan-950/40 text-white border border-cyan-500/20 text-center"
                >
                  Accedi / Registrati
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
