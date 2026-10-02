// Карта Вьетнама: дерево из data/vn-market/*.json. Тот же движок и формат, что у
// карты рынка ИИ-внедрений; корни и слои свои (см. data/vn-market/core.json).
// Деньги в долларах и донгах, как в источнике; с рублёвыми доменами не складывается.

import type { AiMarketFile, AiMarketLayer } from './ai-market.types';
import { buildTree } from './market-tree';

const files = import.meta.glob<AiMarketFile>('../../data/vn-market/*.json', {
  eager: true,
  import: 'default'
});

export const VN_MARKET_TREE = buildTree(files);

export const VN_MARKET_LAYERS: { id: AiMarketLayer; label: string; lead: string }[] = [
  { id: 'principles', label: 'Первоосновы', lead: 'Почему во Вьетнам идут деньги и люди и из чего сделана эта страна для иностранца.' },
  { id: 'demand', label: 'Кто едет и что растёт', lead: 'Сегменты людей и рынки с цифрами: туризм, недвижимость, кофе, дуриан, FDI.' },
  { id: 'services', label: 'Что нужно иностранцу', lead: 'Виза, жильё, компания, банк, транспорт, школа, врач: цена, срок, кто делает.' },
  { id: 'adjacent', label: 'Наши ниши', lead: 'Где Vietnam Data OS зарабатывает: данные, контент, агенты для малого бизнеса, обзвон.' },
  { id: 'questions', label: 'Что спрашивают люди', lead: 'Вопросы туристов, релокантов, инвесторов и местных владельцев дословно, из наших чатов и из сети.' },
  { id: 'failures', label: 'Где ломается', lead: 'Виза, обман с арендой, земля, деньги, здоровье, дорога, климат, язык.' },
  { id: 'supply', label: 'Кто продаёт', lead: 'Застройщики, банки, платформы, агентства, сообщества.' },
  { id: 'prices', label: 'Сколько стоит', lead: 'Жизнь, аренда, покупка, земля, бизнес, виза, школа, врач, транспорт по городам.' },
  { id: 'channels', label: 'Где люди', lead: 'Telegram, Facebook, Zalo, TikTok, YouTube, карты: где искать аудиторию и клиентов.' },
  { id: 'insights', label: 'Выводы', lead: 'Что из этого следует для Vietnam Data OS и для Леонида.' }
];
