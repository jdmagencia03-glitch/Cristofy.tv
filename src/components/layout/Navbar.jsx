import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ArrowLeft, LogOut, Users } from 'lucide-react';
import { appParams } from '@/lib/app-params';
import { useAuth } from '@/lib/AuthContext';
import NotificationCenter from '@/components/admin/NotificationCenter';

const hasValidBase44AppId = (appId) => Boolean(appId && appId !== 'null' && appId !== 'undefined');

export default function Navbar({ isStackRoute = false }) {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLocalPreview = !hasValidBase44AppId(appParams.appId);
  const canAccessAdmin = isLocalPreview || user?.role === 'admin';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Início', to: '/Home' },
    { label: 'Séries', to: '/Browse' },
    { label: 'Minha Lista', to: '/MyList' },
    { label: 'Assinar', to: '/Subscription' },
  ];

  const activeProfile = JSON.parse(localStorage.getItem('desenhos_active_profile') || 'null');

  // Navbar de stack (SeriesDetail, Player) — só mostra botão voltar no mobile
  if (isStackRoute) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F0F]/95 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center h-14 px-2">
          <button
            onClick={() => navigate(-1)}
            className="md:hidden flex items-center gap-2 p-2 text-white active:opacity-60 transition-opacity"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {/* Desktop: mantém logo e links */}
          <Link to="/Home" className="hidden md:flex items-center ml-4">
            <img
              src="/cristofy-logo.png"
              alt="CristoFy"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <div className="hidden md:flex items-center gap-6 ml-8">
            {links.map(l => (
              <Link key={l.to} to={l.to} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  // Navbar padrão (tabs)
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0F0F0F]/95 backdrop-blur-md shadow-2xl' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-8">
            <Link to="/Home" className="flex items-center shrink-0">
              <img
                src="/cristofy-logo.png"
                alt="CristoFy"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {links.slice(0, -1).map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`text-sm font-medium transition-colors hover:text-white ${location.pathname === l.to ? 'text-white' : 'text-gray-400'}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <Link to="/Search" className="p-2 hover:text-[#E50914] transition-colors">
              <Search className="w-5 h-5" />
            </Link>
            <Link
              to="/Subscription"
              className={`hidden md:block text-sm font-semibold px-4 py-1.5 rounded-full border transition-all ${location.pathname === '/Subscription' ? 'bg-[#E50914] border-[#E50914] text-white' : 'border-[#E50914] text-[#E50914] hover:bg-[#E50914] hover:text-white'}`}
            >
              Assinar
            </Link>
            {canAccessAdmin && (
              <>
                {!isLocalPreview && <NotificationCenter />}
                <Link to="/Admin" className="hidden md:block text-xs text-gray-400 hover:text-[#FFC107] transition-colors font-medium">
                  Admin
                </Link>
              </>
            )}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2"
                aria-label="Abrir menu do perfil"
              >
                <div className="w-8 h-8 rounded-md overflow-hidden bg-[#E50914] flex items-center justify-center ring-2 ring-transparent group-hover:ring-white/30 transition-all">
                  {activeProfile?.avatar_url ? (
                    <img src={activeProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {activeProfile?.name?.[0] || user?.full_name?.[0] || '?'}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block transition-transform group-focus-within:rotate-180 group-hover:rotate-180" />
              </button>

              <div className="absolute right-0 top-8 hidden pt-3 group-focus-within:block group-hover:block">
                <div className="w-48 rounded-xl border border-white/10 bg-[#1A1A1A] p-2 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/ProfileSelect');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10"
                  >
                    <Users className="w-4 h-4" />
                    Trocar perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => logout(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair da conta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}