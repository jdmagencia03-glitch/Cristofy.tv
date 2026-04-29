import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import SeriesCard from './SeriesCard';

export default function SeriesCarousel({ title, series, myListIds, onToggleList, category, episodes = [], hideComingSoon = false, hideComingSoonIds = new Set() }) {
  const [cardsPerPage, setCardsPerPage] = useState(2);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const updateCardsPerPage = () => {
      const w = window.innerWidth;
      if (w >= 1280) setCardsPerPage(5);
      else if (w >= 1024) setCardsPerPage(4);
      else if (w >= 768) setCardsPerPage(3);
      else setCardsPerPage(2);
    };

    updateCardsPerPage();
    window.addEventListener('resize', updateCardsPerPage);
    return () => window.removeEventListener('resize', updateCardsPerPage);
  }, []);

  const pages = useMemo(() => {
    const grouped = [];
    for (let i = 0; i < series.length; i += cardsPerPage) {
      grouped.push(series.slice(i, i + cardsPerPage));
    }
    return grouped;
  }, [series, cardsPerPage]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || pages.length <= 1) return;
    const timer = setInterval(() => {
      if (emblaApi.canScrollNext()) emblaApi.scrollNext();
      else emblaApi.scrollTo(0);
    }, 4000);
    return () => clearInterval(timer);
  }, [emblaApi, pages.length]);

  if (!series || series.length === 0) return null;

  return (
    <div className="relative group/carousel mb-8 md:mb-12">
      <div className="flex items-center justify-between px-4 md:px-12 mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-bold">{title}</h2>
        {category && (
          <Link
            to={`/Browse?category=${encodeURIComponent(category)}`}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Ver Todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      
      <div className="relative">
        <div className="overflow-hidden px-4 md:px-12" ref={emblaRef}>
          <div className="flex pb-4">
            {pages.map((page, idx) => (
              <div key={`${title}-page-${idx}`} className="min-w-0 shrink-0 grow-0 basis-full">
                <div className="flex gap-2 md:gap-3">
                  {page.map((s) => (
                    <SeriesCard
                      key={s.id}
                      series={s}
                      isInList={myListIds?.includes(s.id)}
                      onToggleList={onToggleList}
                      episodes={episodes}
                      hideComingSoon={hideComingSoon || hideComingSoonIds.has(s.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {pages.length > 1 && (
        <div className="mt-1 flex items-center justify-center gap-2">
          {pages.map((_, idx) => (
            <button
              key={`${title}-dot-${idx}`}
              type="button"
              onClick={() => emblaApi?.scrollTo(idx)}
              aria-label={`Ir para página ${idx + 1} de ${pages.length}`}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                selectedIndex === idx ? 'bg-white scale-110' : 'bg-white/35 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}