// ATLAS — типы данных дашборда

export type NodeKind = 'country' | 'sector' | 'product' | 'service' | 'tech';

export interface EcoNode {
  id: string;
  name: string;
  kind: NodeKind;
  /** Короткая человеческая подпись */
  value?: string;
  /** Числовая оценка для сортировки (в $ млрд, если не сказано иначе) */
  valueNum?: number;
  emoji?: string;
  color?: string;
  description: string;
  /** Факты и цифры; всё помечено как оценки */
  facts: string[];
  /** id связанных узлов для быстрых переходов */
  related: string[];
  /** Ключевые слова для поиска и связки */
  tags?: string[];
}

export interface MoneyFlow {
  id: string;
  from: string; // id узла
  to: string; // id узла
  value: string; // подпись объёма (оценка)
  valueNum?: number; // $ млрд для толщины
  label: string;
  description: string;
  era?: EraKey;
}

export interface DependencyLink {
  id: string;
  from: string;
  to: string;
  label: string;
  description: string;
  strength: 'critical' | 'strong' | 'moderate';
}

export interface DependencyChain {
  id: string;
  title: string;
  nodes: string[]; // последовательность id узлов
  summary: string;
  insight: string;
  aiImpact?: string;
}

export type EraKey = 'e2010' | 'e2020' | 'e2026' | 'e2030';

export interface ServiceEraStat {
  serviceId: string;
  era: EraKey;
  demand: number; // 0-100 относительная популярность
  note: string;
}

export interface AiImpactItem {
  id: string;
  title: string;
  targetId: string; // связанный узел
  direction: 'up' | 'down' | 'transform';
  magnitude: 'высокое' | 'среднее' | 'структурное';
  now: string;
  by2030: string;
}

export interface Era {
  key: EraKey;
  label: string;
  title: string;
  summary: string;
}

export type SectionId = 'overview' | 'flows' | 'chains' | 'timeline' | 'ai';
