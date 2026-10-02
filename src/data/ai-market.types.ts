// Карта рынка ИИ-внедрений: дерево от первооснов до конкретного вопроса человека.
// Данные лежат в data/ai-market/*.json (контракт в SCHEMA.md там же), здесь только типы
// и сборка дерева. Деньги домена рублёвые, западные вилки справочные (см. ai-native.ts).

import type { EvidenceKind, EvidenceRef } from '../types';

export type AiMarketLayer =
  | 'principles'
  | 'demand'
  | 'services'
  | 'adjacent'
  | 'questions'
  | 'failures'
  | 'supply'
  | 'prices'
  | 'channels'
  | 'insights';

export type AiMarketKind =
  | 'principle'
  | 'segment'
  | 'industry'
  | 'usecase'
  | 'service'
  | 'subservice'
  | 'niche'
  | 'question'
  | 'pain'
  | 'failure'
  | 'player'
  | 'price'
  | 'channel'
  | 'insight'
  | 'metric';

export interface AiMarketNumber {
  label: string;
  value: string;
  unit?: string;
  evidence: string;
}

export interface AiMarketQuote {
  text: string;
  who?: string;
  where?: string;
  url: string;
  date?: string;
}

export interface AiMarketNode {
  id: string;
  parent?: string;
  layer: AiMarketLayer;
  kind: AiMarketKind;
  title: string;
  summary: string;
  facts?: string[];
  numbers?: AiMarketNumber[];
  quotes?: AiMarketQuote[];
  questions?: string[];
  pains?: string[];
  priceRu?: string;
  priceEn?: string;
  time?: string;
  acceptance?: string;
  whoSells?: string[];
  risk?: string;
  evidence?: string[];
  related?: string[];
  tags?: string[];
  /** Узел атласа (EcoNode), если у строки есть карточка в общей панели. */
  nodeId?: string;
}

export interface AiMarketEvidence extends EvidenceRef {
  kind: EvidenceKind;
}

export interface AiMarketFile {
  nodes: AiMarketNode[];
  evidence: AiMarketEvidence[];
}

export const AI_MARKET_LAYERS: { id: AiMarketLayer; label: string; lead: string }[] = [
  { id: 'principles', label: 'Первоосновы', lead: 'Почему этот рынок вообще существует и из чего он сделан.' },
  { id: 'demand', label: 'Кто покупает', lead: 'Сегменты по размеру и отрасли, их сценарии и боли.' },
  { id: 'services', label: 'Что продают', lead: 'Услуги и подуслуги с ценой, сроком, приёмкой и способом провала.' },
  { id: 'adjacent', label: 'Смежные ниши', lead: 'Куда уходят деньги рядом с внедрением: данные, безопасность, железо, обучение.' },
  { id: 'questions', label: 'Что спрашивают люди', lead: 'Вопросы и слова покупателей дословно, по ролям.' },
  { id: 'failures', label: 'Как это ломается', lead: 'Режимы отказа внедрений и цифры по каждому.' },
  { id: 'supply', label: 'Кто продаёт', lead: 'Игроки РФ и запада, платформы, no-code, фриланс.' },
  { id: 'prices', label: 'Сколько стоит', lead: 'Лестница цен РФ и запада на одну и ту же работу.' },
  { id: 'channels', label: 'Как продают', lead: 'Каналы до ЛПР и что в них работает.' },
  { id: 'insights', label: 'Выводы', lead: 'Что из этого следует для нас: где свободно, где занято, что делать.' }
];

export const AI_MARKET_KIND_LABEL: Record<AiMarketKind, string> = {
  principle: 'первооснова',
  segment: 'сегмент',
  industry: 'отрасль',
  usecase: 'сценарий',
  service: 'услуга',
  subservice: 'подуслуга',
  niche: 'ниша',
  question: 'вопрос',
  pain: 'боль',
  failure: 'отказ',
  player: 'игрок',
  price: 'цена',
  channel: 'канал',
  insight: 'вывод',
  metric: 'цифра'
};
