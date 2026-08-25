// ATLAS — типы данных дашборда

export type NodeKind = 'country' | 'sector' | 'product' | 'service' | 'tech';

// Периметр данных. Домены не складываются между собой: 'world' — мировая экономика
// в долларах, 'ru-edtech' — русскоязычный рынок онлайн-образования в рублях.
// Отсутствие поля означает 'world'.
export type DomainKey = 'world' | 'ru-edtech';

export type EvidenceKind = 'official' | 'company' | 'analyst' | 'forecast' | 'proxy';

export interface EvidenceRef {
  id: string;
  label: string;
  url: string;
  date: string;
  kind: EvidenceKind;
  metric?: string;
  scope?: string;
}

export interface EcoNode {
  id: string;
  name: string;
  kind: NodeKind;
  value?: string;
  valueNum?: number;
  emoji?: string;
  color?: string;
  description: string;
  facts: string[];
  related: string[];
  tags?: string[];
  evidence?: EvidenceRef[];
  domain?: DomainKey;
}

export interface MoneyFlow {
  id: string;
  from: string;
  to: string;
  value: string;
  valueNum?: number;
  label: string;
  description: string;
  era?: EraKey;
  domain?: DomainKey;
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
  nodes: string[];
  summary: string;
  insight: string;
  aiImpact?: string;
}

export type EraKey = 'e2010' | 'e2020' | 'e2026' | 'e2030';

export interface ServiceEraStat {
  serviceId: string;
  era: EraKey;
  demand: number;
  note: string;
}

export interface AiImpactItem {
  id: string;
  title: string;
  targetId: string;
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

export type SectionId = 'overview' | 'flows' | 'chains' | 'timeline' | 'ai' | 'market';
