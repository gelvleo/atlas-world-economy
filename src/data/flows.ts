import type { MoneyFlow, EraKey } from '../types';

// Потоки денег — ориентировочные оценки масштабов, не платёжный баланс.

export const FLOWS: MoneyFlow[] = [
  { id: 'f-health-data-ai', from: 'health_data', to: 'medical_ai', value: 'данные для clinical AI', valueNum: 45, label: 'данные → medical AI', description: 'Качественные и контекстные медицинские данные превращаются в модели клинической поддержки; это инфраструктурный поток, а не revenue health data.', era: 'e2026' },
  { id: 'f-medical-ai-diagnostics', from: 'medical_ai', to: 'diagnostics', value: 'модели в диагностическом workflow', valueNum: 35, label: 'medical AI → диагностика', description: 'Ценность появляется, когда модель встроена в workflow и подтверждает улучшение клинического исхода.', era: 'e2026' },
  { id: 'f-diagnostics-care', from: 'diagnostics', to: 'care_delivery', value: 'маршрутизация и лечение', valueNum: 60, label: 'диагностика → care delivery', description: 'Результат диагностики направляет пациента в конкретный маршрут помощи, а не заканчивается на отчёте модели.', era: 'e2026' },
  {
    id: 'f-software-agents',
    from: 'software_engineering',
    to: 'agent_platforms',
    value: 'проектные бюджеты и интеграции',
    valueNum: 140,
    label: 'инженерия агентских систем',
    description: 'Компании платят за проектирование, интеграцию и эксплуатацию агентских систем. Основная маржа постепенно уходит от часов к результату и надёжности.',
    era: 'e2026'
  },
  {
    id: 'f-health-data',
    from: 'healthtech',
    to: 'data',
    value: 'цифровые клинические данные',
    valueNum: 90,
    label: 'данные здоровья',
    description: 'Healthtech создаёт и структурирует данные, которые становятся входом для диагностики, исследований и персонального сопровождения.',
    era: 'e2026'
  },
  {
    id: 'f-femtech-health',
    from: 'femtech',
    to: 'healthtech',
    value: 'вертикальные продукты и care',
    valueNum: 35,
    label: 'женское здоровье в digital health',
    description: 'Femtech превращает недообслуженные потребности женского здоровья в отдельные продукты, сервисы и потоки данных.',
    era: 'e2026'
  },
  {
    id: 'f-longevity-care',
    from: 'longevity',
    to: 'healthcare',
    value: 'превентивное сопровождение',
    valueNum: 55,
    label: 'управляемое долголетие',
    description: 'Рынок движется от лечения эпизода к регулярному измерению рисков, профилактике и сопровождению поведения.',
    era: 'e2026'
  },
  {
    id: 'f-mental-health',
    from: 'mental_health',
    to: 'healthcare',
    value: 'цифровая поддержка и терапия',
    valueNum: 70,
    label: 'mental health care delivery',
    description: 'Цифровые сервисы расширяют доступ к навигации, поддержке и терапии, но требуют клинических границ и безопасности.',
    era: 'e2026'
  },
  {
    id: 'f-chip-usa',
    from: 'japan_korea',
    to: 'usa',
    value: 'десятки $ млрд/год',
    valueNum: 80,
    label: 'чипы и память',
    description: 'США — крупнейший потребитель передовых чипов и памяти: их закупают гиперскейлеры для ИИ-дата-центров.',
    era: 'e2026'
  },
  {
    id: 'f-electronics-world',
    from: 'china',
    to: 'usa',
    value: '~$400-450 млрд/год',
    valueNum: 430,
    label: 'электроника и товары',
    description: 'Классический поток: китайская сборка → американский потребитель.',
    era: 'e2026'
  },
  {
    id: 'f-rareearth-china',
    from: 'china',
    to: 'eu',
    value: 'критичные материалы',
    valueNum: 20,
    label: 'редкоземы и магниты',
    description: 'Европа зависит от китайской переработки редкоземов.',
    era: 'e2026'
  },
  {
    id: 'f-energy-eu',
    from: 'usa',
    to: 'eu',
    value: 'сотни $ млрд/год',
    valueNum: 120,
    label: 'СПГ и энергия',
    description: 'После разрыва с российским газом США стали главным поставщиком СПГ в Европу.',
    era: 'e2026'
  },
  {
    id: 'f-fert-food',
    from: 'energy',
    to: 'agriculture',
    value: 'газ → удобрения → еда',
    valueNum: 90,
    label: 'энергия в еду',
    description: 'Цена газа определяет цену удобрений, а те — урожай и цены на еду.',
    era: 'e2026'
  },
  {
    id: 'f-capital-tech',
    from: 'finance',
    to: 'ai_infra',
    value: 'сотни $ млрд capex',
    valueNum: 350,
    label: 'капитал в ИИ-стройку',
    description: 'Рынки капитала направляются в дата-центры, чипы и энергию.',
    era: 'e2026'
  },
  {
    id: 'f-vc-startups',
    from: 'usa',
    to: 'ai_agents',
    value: 'большая часть мирового VC',
    valueNum: 100,
    label: 'венчур в ИИ',
    description: 'Подавляющая доля мировых венчурных денег уходит в ИИ-стартапы.',
    era: 'e2026'
  },
  {
    id: 'f-it-india',
    from: 'usa',
    to: 'india',
    value: '~$100+ млрд/год',
    valueNum: 110,
    label: 'оплата IT-услуг',
    description: 'Американские и европейские компании платят Индии за разработку и поддержку.',
    era: 'e2026'
  },
  {
    id: 'f-cloud-world',
    from: 'eu',
    to: 'usa',
    value: 'десятки $ млрд/год',
    valueNum: 60,
    label: 'подписки на облака и софт',
    description: 'Европейский бизнес платит американским облакам и SaaS-вендорам.',
    era: 'e2026'
  },
  {
    id: 'f-services-2010',
    from: 'usa',
    to: 'it_outsourcing',
    value: 'базовый поток 2010-х',
    valueNum: 70,
    label: 'офшоринг 2010-х',
    description: 'В 2010-х главным каналом был классический офшоринг.',
    era: 'e2010'
  },
  {
    id: 'f-media-attention',
    from: 'media',
    to: 'ai_content',
    value: 'реклама и подписки',
    valueNum: 250,
    label: 'экономика внимания',
    description: 'Рекламные бюджеты перетекают туда, где контент дешевле и персональнее.',
    era: 'e2026'
  },
  {
    id: 'f-health-ai',
    from: 'healthcare',
    to: 'ai_impact',
    value: 'инвестиции в ИИ-медицину',
    valueNum: 40,
    label: 'деньги в ИИ-диагностику',
    description: 'Здравоохранение — крупнейший заказчик ИИ после техсектора.',
    era: 'e2026'
  },
  {
    id: 'f-green-capex',
    from: 'finance',
    to: 'green_energy',
    value: '~$2 трлн/год',
    valueNum: 500,
    label: 'зелёные инвестиции',
    description: 'Инвестиции в чистую энергетику (~$2 трлн/год).',
    era: 'e2026'
  },
  {
    id: 'f-logistics-trade',
    from: 'china',
    to: 'eu',
    value: '~80% торговли — морем',
    valueNum: 300,
    label: 'товары в Европу',
    description: 'Китай → Европа: крупнейший торговый коридор планеты.',
    era: 'e2026'
  }
];

export const FLOW_ERA_FILTER: { key: EraKey | 'all'; label: string }[] = [
  { key: 'all', label: 'Все потоки' },
  { key: 'e2010', label: '2010-е' },
  { key: 'e2026', label: 'Сейчас (2026)' }
];
