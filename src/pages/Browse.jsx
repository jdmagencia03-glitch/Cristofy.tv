import React, { useState, useMemo } from 'react';
import { listPublishedSeries } from '@/api/catalog';
import { CHRISTIAN_CURATED_CATEGORIES } from '@/data/christianCuratedCatalog';
import { CURATED_CATEGORY_LABELS, resolveCuratedItems } from '@/lib/christianCurated';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Play, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const CURATED_BY_LABEL = Object.fromEntries(
  CHRISTIAN_CURATED_CATEGORIES.map((c) => [c.label, c])
);

export default function Browse() {
  const params = new URLSearchParams(window.location.search);
  const urlCategory = params.get('category');
  const [activeCategory, setActiveCategory] = useState(urlCategory || 'Todas');
  const [typeFilter, setTypeFilter] = useState('todos'); // todos | series | movie

  const { data: allSeries = [], isLoading } = useQuery({
    queryKey: ['series'],
    queryFn: () => listPublishedSeries(),
  });

  const categories = useMemo(() => {
    const fromDb = new Set();
    allSeries.forEach(s => {
      if (s.category) {
        s.category.split(',').forEach(c => {
          const t = c.trim();
          if (t) fromDb.add(t);
        });
      }
    });
    const curatedLabels = CHRISTIAN_CURATED_CATEGORIES.map((c) => c.label);
    const rest = [...fromDb]
      .filter((c) => !CURATED_CATEGORY_LABELS.has(c))
      .sort((a, b) => a.localeCompare(b, 'pt'));
    return ['Todas', ...curatedLabels, ...rest];
  }, [allSeries]);

  const filtered = useMemo(() => {
    let list = allSeries;
    if (typeFilter === 'series') list = list.filter((s) => s.content_type !== 'movie');
    if (typeFilter === 'movie') list = list.filter((s) => s.content_type === 'movie');
    if (activeCategory === 'Todas') return list;

    const def = CURATED_BY_LABEL[activeCategory];
    if (def) {
      let curatedList = resolveCuratedItems(def, allSeries);
      if (typeFilter === 'series') {
        curatedList = curatedList.filter((s) => s.content_type !== 'movie');
      }
      if (typeFilter === 'movie') {
        curatedList = curatedList.filter((s) => s.content_type === 'movie');
      }
      return curatedList;
    }

    return list.filter(s => s.category?.toLowerCase().includes(activeCategory.toLowerCase()));
  }, [allSeries, activeCategory, typeFilter]);

  return (
    <div className="min-h-screen bg-[#0F171E] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Séries e filmes</h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Filter className="w-4 h-4" />
            <span>{filtered.length} títulos</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-2">
          {['todos', 'series', 'movie'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                typeFilter === t
                  ? 'bg-[#0057FF] text-white'
                  : 'bg-[#1A242F] text-gray-400 hover:bg-[#252E39] hover:text-white'
              }`}
            >
              {t === 'todos' ? 'Todos' : t === 'series' ? 'Séries' : 'Filmes'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-[#00A8E1] text-white'
                  : 'bg-[#1A242F] text-gray-400 hover:bg-[#252E39] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-[#1A242F] animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
          >
            {filtered.map(s => {
              const isPlaceholder = Boolean(s._curatedPlaceholder);
              const searchQ = s._searchQuery || s.title?.replace(/\s*\(\d{4}\)\s*$/, '').trim() || s.title;
              const linkTo = isPlaceholder
                ? `/Search?q=${encodeURIComponent(searchQ)}`
                : `/SeriesDetail?id=${s.id}`;
              return (
              <motion.div key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link to={linkTo} className="group block">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1A242F] relative">
                    {!isPlaceholder && s.content_type === 'movie' && (
                      <span className="absolute top-2 left-2 z-[1] text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-black/70 text-white">Filme</span>
                    )}
                    {s.cover_url ? (
                      <img src={s.cover_url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00A8E1]/20 to-[#1A242F] p-2">
                        <span className="text-xs font-bold text-center">{s.title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium truncate text-gray-300 group-hover:text-white">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.year}</p>
                  </div>
                </Link>
              </motion.div>
            );
            })}
          </motion.div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl font-semibold mb-2">Nenhuma série encontrada</p>
            <p className="text-gray-400">Tente selecionar outra categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
}