import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullY(Math.min(delta * 0.5, THRESHOLD + 20));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullY >= THRESHOLD) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      await onRefresh?.();
      setRefreshing(false);
    }
    setPullY(0);
    startY.current = null;
  }, [pullY, onRefresh]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const showIndicator = pullY > 10;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      {/* Indicador */}
      {showIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-40 transition-all"
          style={{ height: pullY, opacity: progress }}
        >
          <div className={`w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center shadow-lg`}>
            <RefreshCw
              className={`w-4 h-4 text-[#E50914] transition-transform ${refreshing ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${progress * 360}deg)` }}
            />
          </div>
        </div>
      )}
      <div style={{ transform: `translateY(${pullY}px)`, transition: pulling.current ? 'none' : 'transform 0.3s ease' }}>
        {children}
      </div>
    </div>
  );
}