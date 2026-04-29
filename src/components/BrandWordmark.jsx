import React from 'react';

/**
 * Marca CristoFy: CRISTO (azul) + FY (branco), sem quebra de linha.
 * Em links, use aria-label no pai (ex.: "CristoFy — Início").
 */
export default function BrandWordmark({ className = '' }) {
  return (
    <span className={`font-black tracking-tight whitespace-nowrap ${className}`.trim()}>
      <span className="text-[#0057FF]">CRISTO</span>
      <span className="text-white">FY</span>
    </span>
  );
}
