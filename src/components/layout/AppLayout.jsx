import React, { useEffect, useCallback, useRef } from 'react';
import { useOutlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import PullToRefresh from './PullToRefresh';
import { useQueryClient } from '@tanstack/react-query';

// Abas que preservam scroll ao voltar
const TAB_ROUTES = ['/Home', '/Browse', '/Search', '/MyList', '/Subscription'];

// Rotas "stack" — sem BottomNav, com back button no header
const STACK_ROUTES = ['/SeriesDetail', '/Player'];

// Rotas que NÃO precisam de perfil ativo (admin e perfil select em si)
const NO_PROFILE_ROUTES = ['/ProfileSelect', '/Admin', '/AdminSeries', '/AdminEpisodes', '/AdminUsers', '/AdminCodes', '/AdminProposals', '/AdminAvatars', '/AdminEpisodeCreator', '/AdminSubscriptions', '/AdminMetrics', '/AdminBanner', '/Subscription', '/ActivateCode'];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scrollPositions = useRef({});
  const prevPathname = useRef(location.pathname);
  const outlet = useOutlet();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  // Salva scroll da aba anterior e restaura scroll da nova aba
  useEffect(() => {
    const prev = prevPathname.current;
    const next = location.pathname;

    // Salva posição da rota anterior se for uma aba
    if (TAB_ROUTES.some(r => prev.startsWith(r))) {
      scrollPositions.current[prev] = window.scrollY;
    }

    prevPathname.current = next;

    // Restaura posição da nova aba (ou vai ao topo se for nova visita)
    const isTabRoute = TAB_ROUTES.some(r => next.startsWith(r));
    if (isTabRoute) {
      const saved = scrollPositions.current[next] ?? 0;
      // Pequeno delay para garantir que o conteúdo renderizou
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved, behavior: 'auto' });
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [location.pathname]);

  useEffect(() => {
    // Verifica se há perfil ativo (apenas em rotas que precisam de perfil)
    const needsProfile = !NO_PROFILE_ROUTES.some(r => location.pathname.startsWith(r));
    if (needsProfile) {
      const activeProfile = localStorage.getItem('desenhos_active_profile');
      if (!activeProfile) {
        navigate('/ProfileSelect', { replace: true });
      }
    }
  }, [location.pathname]);

  const isStackRoute = STACK_ROUTES.some(r => location.pathname.startsWith(r));

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <Navbar isStackRoute={isStackRoute} />
      <PullToRefresh onRefresh={handleRefresh}>
        <main className={isStackRoute ? 'pb-0' : 'pb-16 md:pb-0'}>
          {outlet}
        </main>
      </PullToRefresh>
      {!isStackRoute && <BottomNav />}
    </div>
  );
}