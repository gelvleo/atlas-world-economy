// Маршрутизация по хэшу. Без библиотеки и без сервера: атлас статический,
// ссылка должна открываться в любом браузере и вести к нужному блоку.
//
// Контракт адресов (он же отдан агенту region-brief под тул region_atlas_link):
//   #/vietnam/region/<slug>
//   #/vietnam/market/<region_slug>/<market_slug>
//   #/vietnam/entity/<slug>
//   #/vietnam/section/<id>   search · calendar · regions · employment ·
//                            markets · national · opportunity · entities · sweeps
//   #/ai/node/<id>           узел карты рынка ИИ-внедрений (data/ai-market)
//   #/ai/layer/<layer>       слой той же карты
// Двоеточие в слаге зоны (zone:namban-home) допустимо и не кодируется.

import { useEffect, useState } from 'react';

export interface AtlasRoute {
  domain: string;
  kind: 'region' | 'market' | 'entity' | 'section' | 'node' | 'layer';
  a: string;
  b: string;
}

const KINDS = new Set<AtlasRoute['kind']>(['region', 'market', 'entity', 'section', 'node', 'layer']);

export function parseHash(hash: string): AtlasRoute | null {
  let parts: string[];
  try {
    parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    // Неполная percent-кодировка приходит из внешней ссылки: она не должна
    // ронять всё приложение, поэтому такой адрес считается неизвестным.
    return null;
  }
  if (parts.length < 3) return null;
  const [domain, kind, a, b] = parts;
  if (!KINDS.has(kind as AtlasRoute['kind'])) return null;
  // У рынка два слага: без второго адрес неполный и маршрутом не считается.
  if (kind === 'market' && !b) return null;
  return { domain, kind: kind as AtlasRoute['kind'], a, b: b ?? '' };
}

/** Текущий маршрут. Меняется по hashchange, в том числе по кнопке «назад». */
export function useHashRoute(): AtlasRoute | null {
  const [route, setRoute] = useState<AtlasRoute | null>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
