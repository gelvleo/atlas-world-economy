// Соответствие «узел → обозначение». Данных не касается: маппинг по id и kind.
// Цвет вида живёт только в точке 6px и левой полосе 2px — в тексте его нет.
import type { NodeKind } from '../types';

// Страны обозначаются двухбуквенным кодом, а не флагом.
export const COUNTRY_CODE: Record<string, string> = {
  usa: 'US',
  china: 'CN',
  eu: 'EU',
  india: 'IN',
  japan_korea: 'JP',
  japan: 'JP'
};

export function nodeCode(id: string): string | null {
  return COUNTRY_CODE[id] ?? null;
}

// Пять несиреневых тонов одного холодного семейства.
// Значения совпадают с --kind-* в styles.css.
export const KIND_TONE: Record<NodeKind, string> = {
  country: '#14568C',
  sector: '#0B6B4F',
  product: '#8A5A0B',
  service: '#4A5568',
  tech: '#9B2C2C'
};

export const KIND_LABEL: Record<NodeKind, string> = {
  country: 'страна',
  sector: 'сектор',
  product: 'продукт',
  service: 'услуга',
  tech: 'технология'
};
