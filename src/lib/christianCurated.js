import { CHRISTIAN_CURATED_CATEGORIES } from '@/data/christianCuratedCatalog';

/** Labels das categorias curadas (para não duplicar carrosséis dinâmicos na Home). */
export const CURATED_CATEGORY_LABELS = new Set(
  CHRISTIAN_CURATED_CATEGORIES.map((c) => c.label)
);

function normalizeTitle(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Remove sufixo " – Série" / "– Minissérie" e extrai ano (AAAA).
 */
export function parseCuratedLine(raw) {
  const t = raw.trim();
  if (!t) return null;
  const kind = /\bminissérie\b/i.test(t)
    ? 'miniseries'
    : /\b(série|series)\b/i.test(t) || /[–-]\s*(Série|Minissérie)\s*$/i.test(t)
      ? 'series'
      : 'movie';
  const withoutKind = t
    .replace(/\s*[–-]\s*Minissérie\s*$/i, '')
    .replace(/\s*[–-]\s*Série\s*$/i, '')
    .trim();
  const yearMatch = withoutKind.match(/\((\d{4})\)\s*$/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : null;
  const cleanTitle = yearMatch
    ? withoutKind.replace(/\s*\(\d{4}\)\s*$/, '').trim()
    : withoutKind;
  return {
    displayTitle: t,
    cleanTitle,
    year,
    content_type: kind === 'series' || kind === 'miniseries' ? 'series' : 'movie',
  };
}

function titlesMatch(dbTitle, curatedClean) {
  const a = normalizeTitle(dbTitle);
  const b = normalizeTitle(curatedClean);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

/**
 * Para cada linha da lista curada, usa série/filme do catálogo se existir; senão placeholder pesquisável.
 */
export function resolveCuratedItems(categoryDef, visibleSeries) {
  const lines = categoryDef.titlesRaw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line, idx) => {
    const parsed = parseCuratedLine(line);
    if (!parsed) {
      return {
        id: `curated-${categoryDef.id}-${idx}`,
        title: line,
        year: null,
        content_type: 'movie',
        category: categoryDef.label,
        cover_url: null,
        published: true,
        _curatedPlaceholder: true,
      };
    }

    const match = visibleSeries.find((s) => titlesMatch(s.title, parsed.cleanTitle));
    if (match) {
      const mergedCat = mergeCategoryLabel(match.category, categoryDef.label);
      return { ...match, category: mergedCat };
    }

    return {
      id: `curated-${categoryDef.id}-${idx}`,
      title: parsed.cleanTitle + (parsed.year ? ` (${parsed.year})` : ''),
      year: parsed.year || undefined,
      content_type: parsed.content_type,
      category: categoryDef.label,
      cover_url: null,
      published: true,
      _curatedPlaceholder: true,
      _searchQuery: parsed.cleanTitle,
    };
  });
}

function mergeCategoryLabel(existing, label) {
  const parts = (existing || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.includes(label)) parts.push(label);
  return parts.join(', ');
}
