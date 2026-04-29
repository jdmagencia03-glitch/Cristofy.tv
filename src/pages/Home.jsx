import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  catalogUsesFirestore,
  listEpisodesForHome,
  listFeaturedBannersHome,
  listPublishedSeries,
} from '@/api/catalog';
import * as userLib from '@/lib/userLibrary';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HeroBanner from '../components/home/HeroBanner';
import SeriesCarousel from '../components/home/SeriesCarousel';
import ContinueWatching from '../components/home/ContinueWatching';

export default function Home() {
  const queryClient = useQueryClient();
  const activeProfile = JSON.parse(localStorage.getItem('desenhos_active_profile') || 'null');
  const fsCatalog = catalogUsesFirestore();

  const { data: allSeries = [] } = useQuery({
    queryKey: ['series'],
    queryFn: () => listPublishedSeries(),
  });

  const { data: bannerItems = [] } = useQuery({
    queryKey: ['featuredBanner'],
    queryFn: () => listFeaturedBannersHome(),
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ['episodes'],
    queryFn: () => listEpisodesForHome(500),
  });

  const { data: myListItems = [] } = useQuery({
    queryKey: ['myList', activeProfile?.id],
    queryFn: () => {
      if (!activeProfile?.id) return [];
      if (fsCatalog) return Promise.resolve(userLib.getMyList(activeProfile.id));
      return base44.entities.MyList.filter({ profile_id: activeProfile.id });
    },
    enabled: !!activeProfile?.id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['watchHistory', activeProfile?.id],
    queryFn: () => {
      if (!activeProfile?.id) return [];
      if (fsCatalog) return Promise.resolve(userLib.getWatchHistory(activeProfile.id, 20));
      return base44.entities.WatchHistory.filter({ profile_id: activeProfile.id }, '-updated_date', 20);
    },
    enabled: !!activeProfile?.id,
  });

  const addToListMut = useMutation({
    mutationFn: (seriesId) => {
      if (fsCatalog) {
        userLib.addMyListItem(activeProfile.id, seriesId);
        return Promise.resolve();
      }
      return base44.entities.MyList.create({ profile_id: activeProfile.id, series_id: seriesId });
    },
    onMutate: async (seriesId) => {
      await queryClient.cancelQueries({ queryKey: ['myList', activeProfile?.id] });
      const prev = queryClient.getQueryData(['myList', activeProfile?.id]);
      queryClient.setQueryData(['myList', activeProfile?.id], old => [
        ...(old || []),
        { id: `opt-${seriesId}`, profile_id: activeProfile.id, series_id: seriesId },
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => queryClient.setQueryData(['myList', activeProfile?.id], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['myList'] }),
  });

  const removeFromListMut = useMutation({
    mutationFn: async (seriesId) => {
      if (fsCatalog) {
        userLib.removeMyListBySeries(activeProfile.id, seriesId);
        return;
      }
      const item = myListItems.find(m => m.series_id === seriesId);
      if (item) await base44.entities.MyList.delete(item.id);
    },
    onMutate: async (seriesId) => {
      await queryClient.cancelQueries({ queryKey: ['myList', activeProfile?.id] });
      const prev = queryClient.getQueryData(['myList', activeProfile?.id]);
      queryClient.setQueryData(['myList', activeProfile?.id], old =>
        (old || []).filter(m => m.series_id !== seriesId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => queryClient.setQueryData(['myList', activeProfile?.id], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['myList'] }),
  });

  const myListIds = useMemo(() => myListItems.map(m => m.series_id), [myListItems]);

  const toggleList = (seriesId) => {
    if (!activeProfile?.id) return;
    if (myListIds.includes(seriesId)) {
      removeFromListMut.mutate(seriesId);
    } else {
      addToListMut.mutate(seriesId);
    }
  };

  // Kid profile filter
  const visibleSeries = activeProfile?.is_kid
    ? allSeries.filter(s => s.age_rating === 'Livre' || s.category?.toLowerCase().includes('infantil'))
    : allSeries;

  // Carrossel hero: slides do catálogo OU banners só-imagem (sem série), configurados em Admin → Banner
  const bannerSeries = useMemo(() => {
    if (bannerItems.length > 0) {
      const sorted = [...bannerItems].sort((a, b) => (a.order || 0) - (b.order || 0));
      const slides = [];
      for (const item of sorted) {
        if (item.series_id) {
          const s = visibleSeries.find((x) => x.id === item.series_id);
          if (s) slides.push({ ...s, heroKind: 'series' });
          continue;
        }
        const bu = item.custom_banner_url;
        const bm = item.custom_banner_mobile_url;
        if (!bu && !bm) continue;
        slides.push({
          id: `hero-custom-${item.id}`,
          heroKind: 'custom',
          title: item.custom_title || 'Destaque',
          description: item.custom_description || '',
          banner_url: bu || bm,
          banner_mobile_url: bm || bu,
          custom_link_url: item.link_url || '',
          content_type: null,
        });
      }
      return slides;
    }
    const fallback = visibleSeries.find(s => s.featured) || visibleSeries[0];
    return fallback ? [{ ...fallback, heroKind: 'series' }] : [];
  }, [bannerItems, visibleSeries]);

  const forCategoryRows = useMemo(
    () => visibleSeries.filter((s) => s.content_type !== 'movie'),
    [visibleSeries]
  );
  const movieRows = useMemo(
    () => visibleSeries.filter((s) => s.content_type === 'movie'),
    [visibleSeries]
  );

  const byCategory = (cat) => forCategoryRows.filter(s => s.category?.toLowerCase().includes(cat.toLowerCase()));

  const categories = useMemo(() => {
    const cats = new Set();
    forCategoryRows.forEach(s => {
      if (s.category) {
        s.category.split(',').forEach(c => cats.add(c.trim()));
      }
    });
    return Array.from(cats);
  }, [forCategoryRows]);

  const mostViewed = visibleSeries.filter(s => s.highlighted_home_section === 'mais_assistidos').length > 0
    ? visibleSeries.filter(s => s.highlighted_home_section === 'mais_assistidos')
    : [...visibleSeries].sort((a, b) => (b.total_views || 0) - (a.total_views || 0)).slice(0, 20);

  const mostViewedIds = new Set(mostViewed.map(s => s.id));

  return (
    <div className="min-h-screen bg-[#0F171E]">
      <HeroBanner seriesList={bannerSeries} />

      <div className="-mt-10 md:-mt-20 relative z-10">
        {mostViewed.length > 0 && (
          <SeriesCarousel title="Mais Assistidos" series={mostViewed} myListIds={myListIds} onToggleList={toggleList} episodes={episodes} hideComingSoon={true} />
        )}

        {movieRows.length > 0 && (
          <SeriesCarousel title="Filmes" series={movieRows} myListIds={myListIds} onToggleList={toggleList} episodes={episodes} hideComingSoon={true} hideComingSoonIds={mostViewedIds} />
        )}

        <ContinueWatching history={history} episodes={episodes} allSeries={allSeries} profileName={activeProfile?.name} />

        {categories.map(cat => {
           const catSeries = byCategory(cat);
           if (catSeries.length === 0) return null;
           return (
             <SeriesCarousel
               key={cat}
               title={cat}
               series={catSeries}
               myListIds={myListIds}
               onToggleList={toggleList}
               category={cat}
               episodes={episodes}
               hideComingSoonIds={mostViewedIds}
             />
           );
         })}

        {allSeries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 px-4">
            <div className="text-6xl mb-6">🎬</div>
            <h2 className="text-2xl font-bold mb-2">Bem-vindo ao CristoFy!</h2>
            <p className="text-gray-400 text-center max-w-md">
              Nenhuma série disponível ainda. O administrador precisa adicionar conteúdo no painel admin.
            </p>
          </div>
        )}
      </div>

      <footer className="border-t border-white/5 mt-16 py-8 px-4 md:px-12 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} CristoFy. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}