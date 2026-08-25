// ATLAS — домен «Русскоязычный рынок онлайн-образования и инфобизнеса».
//
// ОТДЕЛЬНЫЙ ПЕРИМЕТР. Все суммы здесь — рубли РФ и СНГ, они НЕ складываются
// с долларовыми агрегатами мировой экономики на «Обзоре» и в «Потоках денег».
// Признак домена — поле domain: 'ru-edtech' на узлах и потоках.
//
// Источник данных: отчёт deep research «Рынок EdTech-приложений и платформы»
// (две вкладки, 913 строк). Вкладка 1 — исследование под наш продукт (сноски 1–42
// с URL). Вкладка 2 — макро-картина рынка 2023–2026 (сносок нет, поэтому
// её числа помечены как proxy).

import type {
  DependencyChain,
  DependencyLink,
  EcoNode,
  EvidenceRef,
  MoneyFlow
} from '../types';

// ─── Источники ────────────────────────────────────────────────────────────────
// kind проставлен честно: official — госреестры и законы, company — данные
// компании о себе (тарифы, платформенная аналитика), analyst — отраслевой обзор,
// proxy — косвенная оценка или источник, который в отчёте не назван поимённо.

export const EDTECH_EVIDENCE: Record<string, EvidenceRef> = {
  gcAnalytics2025: {
    id: 'gc-analytics-2025',
    label: 'GetCourse — аналитика рынка онлайн-школ 2025',
    url: 'https://getcourse.ru/magazine/analitika_2025',
    date: '2025',
    kind: 'company',
    metric: '168 млрд ₽ оборота школ на платформе, база 19 000+ школ и авторов',
    scope: 'только проекты на GetCourse; платформа считает свой оборот, не рынок целиком'
  },
  gcNiches2025: {
    id: 'gc-niches-2025',
    label: 'GetCourse — аналитика по нишам 2025',
    url: 'https://getcourse.ru/magazine/analitika-po-nisham-getcourse-2025',
    date: '2025',
    kind: 'company',
    metric: 'здоровье +30% за полугодие, саморазвитие +45%, языки +41%, эзотерика >6,5 млрд ₽',
    scope: 'ниши в разрезе одной платформы; темпы — полугодие к полугодию'
  },
  gcMarketShift: {
    id: 'gc-market-shift-2025',
    label: 'GetCourse — BNPL, средние чеки и мобильный трафик',
    url: 'https://getcourse.ru/magazine/kak_menyaetsya_rynok_online_obrazovaniya',
    date: '2025',
    kind: 'company',
    metric: '>75% трафика со смартфонов; доля рассрочек 60–75% на чеках 50–300 тыс. ₽',
    scope: 'данные платформы о поведении её школ и учеников'
  },
  gcTelegram: {
    id: 'gc-telegram-2025',
    label: 'GetCourse / GetInsight — выручка школ через Telegram',
    url: 'https://getcourse.ru/magazine/rost-vyruchki-dlya-online-shkol-cherez-telegram',
    date: '2025',
    kind: 'company',
    metric: '+55% выручки через Telegram в I полугодии 2025, свыше 3,4 млрд ₽',
    scope: 'канальная выручка школ GetCourse, не весь рынок'
  },
  smartRanking: {
    id: 'smart-ranking-edtech',
    label: 'Smart Ranking — рейтинг и тренды EdTech',
    url: 'https://smartranking.ru/ru/analytics/edtechs/',
    date: '2025',
    kind: 'analyst',
    metric: 'топ-100 EdTech РФ: 154 млрд ₽ за 2025, рост замедлился до 12% г/г',
    scope: 'только топ-100 компаний, институциональный EdTech без инфобизнеса'
  },
  skillboxRating: {
    id: 'skillbox-edtech-rating-2025',
    label: 'Skillbox Media — рейтинг EdTech-компаний',
    url: 'https://skillbox.ru/media/edtech/opublikovan-reyting-edtech-kompaniy-za-pervyy-kvartal-2025-goda/',
    date: '2025',
    kind: 'analyst',
    metric: 'детское образование +31,6–32,6% г/г и 38% выручки топ-100',
    scope: 'рейтинговый периметр топ-100, издание принадлежит участнику рынка'
  },
  vakasPlatforms: {
    id: 'vakas-platforms-2025',
    label: 'Vakas-tools — обзор тарифов LMS-платформ',
    url: 'https://vakas-tools.ru/blog/obzor-populiarnyh-platform-dlia-zaniatii-onlain-shkoly/',
    date: '2025',
    kind: 'analyst',
    metric: 'GetCourse 5 900 – 133 800 ₽/мес, Zenclass 3 200 – 6 800 ₽/мес, «Антитренинги» 3 100 – 12 600 ₽/мес',
    scope: 'публичные прайсы на дату обзора; сетка тарифов меняется'
  },
  kinescopePricing: {
    id: 'kinescope-pricing',
    label: 'Kinescope — тарифы видеоплатформы',
    url: 'https://kinescope.ru/pricing',
    date: '2026',
    kind: 'company',
    metric: 'хранение 1,5–1,9 ₽/ГБ, CDN 0,7–1,9 ₽/ГБ, транскодирование 0,8 ₽/мин',
    scope: 'публичный прайс провайдера'
  },
  prodamusRates: {
    id: 'prodamus-rates',
    label: 'Prodamus — тарифы сервиса',
    url: 'https://prodamus.ru/rates',
    date: '2026',
    kind: 'company',
    metric: '3,8% базово, 3,5% от 500 тыс. ₽, 3,1% от 1 млн ₽, 2,9% от 4 млн ₽ в месяц',
    scope: 'публичный прайс шлюза; доля рынка 50–60% — оценка отчёта, не Prodamus'
  },
  prodamusInstallments: {
    id: 'prodamus-installments',
    label: 'Prodamus — рассрочки и кредиты для клиентов',
    url: 'https://prodamus.ru/oplata-v-rassrochku',
    date: '2026',
    kind: 'company',
    metric: 'дисконт банка: 8,5–10,5% на 6 мес., 13–16% на 12 мес., до 24–28% на 24 мес.; BNPL 4–6%',
    scope: 'условия партнёрских банков через один шлюз'
  },
  salebotRates: {
    id: 'salebot-rates-2026',
    label: 'Salebot — изменение тарифов (анонс вендора)',
    url: 'https://vk.ru/wall-155867893_10454',
    date: '02.2026',
    kind: 'company',
    metric: 'тариф «Инфобизнес» 2 999 – 3 999 ₽/мес, с доп. подключениями до 5 000 – 7 000 ₽/мес',
    scope: 'анонс в соцсети вендора, не прайс-страница'
  },
  botHelpPricing: {
    id: 'bothelp-pricing',
    label: 'BotHelp — тарифы конструктора ботов',
    url: 'https://bothelp.io/ru/pricing',
    date: '2026',
    kind: 'company',
    metric: '2 399 – 9 900 ₽/мес в зависимости от размера базы',
    scope: 'публичный прайс'
  },
  teamBDev: {
    id: 'team-b-dev-cost-2026',
    label: 'Team-B — стоимость разработки мобильного приложения 2026',
    url: 'https://team-b.ru/blog/stoimost-razrabotki-mobilnogo-prilozheniya/',
    date: '2026',
    kind: 'company',
    metric: 'базовый релиз 1,8–3,8 млн ₽, срок 3–7 мес., ставка middle 3 000 – 3 800 ₽/час',
    scope: 'прайс студии заказной разработки, заинтересованной стороны'
  },
  purrwebEdu: {
    id: 'purrweb-edu',
    label: 'Purrweb — разработка образовательных платформ',
    url: 'https://www.purrweb.com/ru/uslugi/razrabotka-obrazovatelnykh-prilozheniy/',
    date: '2026',
    kind: 'company',
    metric: 'образовательные платформы — от 7,5 млн ₽',
    scope: 'прайс студии'
  },
  gurucanCompare: {
    id: 'gurucan-compare',
    label: 'Gurucan — сравнение сервисов для онлайн-школы',
    url: 'https://gurucan.ru/gurucan-competitors',
    date: '2026',
    kind: 'company',
    metric: 'Gurucan от 12 790 ₽/мес + плата за сборку; Kajabi / Skool $99–$499/мес',
    scope: 'сравнение написано конкурентом, цены зарубежных сервисов — пересказ'
  },
  edtechsYoutube: {
    id: 'edtechs-2024-events',
    label: 'ED Tech — топ-10 событий edtech-рынка 2024',
    url: 'https://edtechs.ru/analitika-i-intervyu/top-10-sobytij-edtech-rynka-2024-goda/',
    date: '2024',
    kind: 'analyst',
    metric: 'замедление YouTube в РФ (август 2024) как событие года для видеоуроков',
    scope: 'отраслевой обзор, без количественной оценки потерь охвата'
  },
  cbrBlacklist: {
    id: 'cbr-blacklist',
    label: 'Банк России — список компаний с признаками нелегальной деятельности',
    url: 'https://www.cbr.ru/inside/BlackList/',
    date: '2025',
    kind: 'official',
    metric: 'более 6 500 субъектов с признаками пирамид и нелегального финрынка (2024–2025)',
    scope: 'предупредительный список регулятора, не приговор суда'
  },
  fedsfmRegistry: {
    id: 'fedsfm-registry',
    label: 'Росфинмониторинг — перечни и реестры',
    url: 'https://www.fedsfm.ru/news/5142',
    date: '2025',
    kind: 'official',
    metric: 'перечень лиц, причастных к экстремистской деятельности; проверка учредителей',
    scope: 'обязательный фильтр перед подписанием договора'
  },
  fz176: {
    id: 'fz-176-vat-usn',
    label: 'Федеральный закон № 176-ФЗ (НДС на УСН, амнистия за дробление)',
    url: '',
    date: '01.01.2025',
    kind: 'official',
    metric: 'НДС 5% при обороте 60–250 млн ₽, 7% при 250–450 млн ₽; ОСНО свыше 450 млн ₽',
    scope: 'URL в отчёте не приведён; текст закона проверять в официальном источнике'
  },
  fz152: {
    id: 'fz-152-pd-fines',
    label: '152-ФЗ «О персональных данных» — оборотные штрафы за утечки',
    url: '',
    date: '2024–2025',
    kind: 'official',
    metric: 'штрафы за утечки выросли до 15–18 млн ₽; контроль трансграничной передачи',
    scope: 'URL в отчёте не приведён; вилка штрафа — как её называет отчёт'
  },
  appleDeveloperRu: {
    id: 'apple-developer-ru',
    label: 'Клерк.ру — регистрация Apple Developer для разработчиков из России',
    url: 'https://www.klerk.ru/blogs/easypaymentsonline/673270/',
    date: '2026',
    kind: 'proxy',
    metric: '$99/год, сложности с D-U-N-S и оплатой картами иностранных банков',
    scope: 'блог-пост платёжного сервиса, не документация Apple'
  },
  tgPayBots: {
    id: 'tg-pay-bots-commission',
    label: 'Комиссии ботов-посредников платных Telegram-клубов (Tribute, Paywall, Nemiling)',
    url: '',
    date: '2025–2026',
    kind: 'proxy',
    metric: 'плоская комиссия 10–20% от входящего оборота сообщества',
    scope: 'в отчёте сноска ведёт на хаб Хабра без конкретной публикации — источник не подтверждён'
  },
  botConstructorsFreelance: {
    id: 'freelance-tma-price',
    label: 'DTF — обзор конструкторов чат-ботов и фриланс-сборок',
    url: 'https://dtf.ru/id2419219/4949403-konstruktory-chat-botov-telegram-vkontakte',
    date: '2025',
    kind: 'proxy',
    metric: 'частная сборка Telegram Mini App 30 000 – 60 000 ₽, срок 2–4 недели',
    scope: 'пользовательский обзор на UGC-площадке'
  },
  studioOffer: {
    id: 'comuni-offer-2026',
    label: 'Наш прайс: CLUBS и «Фабрика» (внутренние данные студии)',
    url: '',
    date: '2026',
    kind: 'company',
    metric: 'CLUBS 125 000 / 165 000 ₽, «Фабрика» 140 000 – 200 000 ₽; обслуживание 4 900 / 7 900 ₽/мес',
    scope: 'собственные цены, внешним источником не подтверждаются'
  },
  tab2Macro: {
    id: 'report-tab2-macro',
    label: 'Отчёт deep research, вкладка 2 — макро-картина рынка 2023–2026',
    url: '',
    date: '2026',
    kind: 'proxy',
    metric: 'GMV 377 → 442 млрд ₽, CAGR +5,4%; доля серого контура 20% → 13–14%',
    scope: 'вкладка 2 не содержит сносок: числа приняты как оценка автора отчёта, не подтверждены источником'
  },
  tab2Players: {
    id: 'report-tab2-players',
    label: 'Отчёт deep research, вкладка 2 — реестр игроков и юрисдикций',
    url: '',
    date: '2026',
    kind: 'proxy',
    metric: '«Синергия» 16,1 млрд ₽, Skillbox 12,9 млрд ₽, Skyeng 12,8 млрд ₽, GetCourse 6,8 млрд ₽ SaaS',
    scope: 'обороты и процессуальные статусы даны без ссылок на отчётность или судебные акты'
  },
  tab2Prognosis: {
    id: 'report-tab2-forecast',
    label: 'Отчёт deep research — прогноз рынка на 2026',
    url: '',
    date: '2026',
    kind: 'forecast',
    metric: 'GMV 442 млрд ₽ в 2026; институциональный EdTech 168 млрд ₽; серый контур 60 млрд ₽',
    scope: 'прогнозная колонка таблицы, методика экстраполяции в отчёте не раскрыта'
  }
};

// ─── Узлы домена ──────────────────────────────────────────────────────────────
// kind взят из существующего словаря NodeKind, новых видов не заводим:
// «сектор» — ниши, полосы выручки и регуляторные события,
// «продукт» — платформы и наш оффер, «технология» — платёжная и видео-инфраструктура,
// «услуга» — люди и посредники рынка.

export const EDTECH_NODES: EcoNode[] = [
  // Спрос
  {
    id: 'ru_student',
    name: 'Ученик онлайн-школы',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '🎓',
    value: 'платит 100% первичных денег',
    color: '#7ec8ff',
    description:
      'Конечный покупатель курса или клубной подписки. Более 75% его трафика — смартфон, поэтому мобильный вход перестал быть опцией.',
    facts: [
      '>75% пользовательского трафика школ приходит со смартфонов',
      'На чеках 50–300 тыс. ₽ 60–75% оплат идут через рассрочку',
      'Одобряемость BNPL — 85–95%: кредитной проверки почти нет'
    ],
    related: ['ru_band_15_80', 'ru_installments', 'ru_bnpl', 'ru_tg_club'],
    tags: ['ru-edtech', 'спрос'],
    evidence: [EDTECH_EVIDENCE.gcMarketShift, EDTECH_EVIDENCE.prodamusInstallments]
  },

  // Полосы выручки школ
  {
    id: 'ru_band_3_15',
    name: 'Школы 3–15 млн ₽ в год',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '🌱',
    value: '6 800 – 7 500 проектов (~38% рынка)',
    valueNum: 7,
    color: '#8fd3a8',
    description:
      'Соло-эксперты с внешними продюсерами: 3–4 запуска в год, чек курса 10–35 тыс. ₽, техника отдана фрилансерам.',
    facts: [
      'Бюджет на инфраструктуру 25 000 – 45 000 ₽ в месяц',
      'Штатных технических специалистов нет',
      'Инвестиция 150 000 ₽ требует обоснования ростом мобильной конверсии'
    ],
    related: ['ru_getcourse', 'ru_lms_alt', 'ru_factory', 'ru_niche_eso'],
    tags: ['ru-edtech', 'icp'],
    evidence: [EDTECH_EVIDENCE.vakasPlatforms, EDTECH_EVIDENCE.gcMarketShift]
  },
  {
    id: 'ru_band_15_80',
    name: 'Школы 15–80 млн ₽ в год — наш ICP',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '🎯',
    value: '2 300 – 2 700 системных школ',
    valueNum: 2.5,
    color: '#ffb454',
    description:
      'Основной целевой сегмент: 6–10 запусков в год или клубная модель, 1–2 технических специалиста, полностью зависимая от GetCourse инфраструктура.',
    facts: [
      'Совокупная стоимость владения стеком — 1,1–1,9 млн ₽ в год',
      'ФОТ технических рук 45 000 – 80 000 ₽ в месяц',
      'Расходы на LMS, видео и ботов 45 000 – 75 000 ₽ в месяц',
      'Половину выручки дают премиальные тарифы с чеком 100 000+ ₽',
      'Внедрение «Фабрики» окупается за 2–3 месяца'
    ],
    related: ['ru_getcourse', 'ru_kinescope', 'ru_techspec', 'ru_factory', 'ru_traffic', 'ru_producers'],
    tags: ['ru-edtech', 'icp'],
    evidence: [EDTECH_EVIDENCE.vakasPlatforms, EDTECH_EVIDENCE.gcMarketShift, EDTECH_EVIDENCE.kinescopePricing]
  },
  {
    id: 'ru_band_80_500',
    name: 'Школы 80–500 млн ₽ в год',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '🏢',
    value: '280 – 350 игроков',
    valueNum: 0.3,
    color: '#c792ea',
    description:
      'Зрелый средний инфобизнес с собственным техотделом. Приложение покупают не ради экономии на лицензии, а ради LTV, доходимости и push-канала.',
    facts: [
      'Тарифы «Бизнес» / «VIP» / «Tesla» — 86 300 – 133 800 ₽ в месяц',
      'Расход на технику 2,5–5,0 млн ₽ в год',
      'Мотив покупки — доставляемость push вместо падающих Telegram и email'
    ],
    related: ['ru_getcourse', 'ru_factory', 'ru_traffic'],
    tags: ['ru-edtech', 'icp'],
    evidence: [EDTECH_EVIDENCE.vakasPlatforms]
  },
  {
    id: 'ru_band_500',
    name: 'EdTech-холдинги свыше 500 млн ₽',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '🏛️',
    value: '40 – 60 компаний, 45–50% рынка',
    valueNum: 0.05,
    color: '#9aa7ff',
    description:
      '«Синергия», Skillbox, Skyeng, «Яндекс Практикум», «Умскул». Собственная микросервисная разработка; для студии — только подряд на R&D-модули.',
    facts: [
      '«Синергия» 16,1 млрд ₽, Skillbox 12,9 млрд ₽, Skyeng 12,8 млрд ₽, «Яндекс Практикум» 8,8 млрд ₽',
      'Школы с оборотом свыше 30 млн ₽ в месяц — 0,7% субъектов, но основная масса выручки',
      'Расход на технику свыше 25 млн ₽ в год; продукт студии неприменим'
    ],
    related: ['ru_getcourse', 'ru_traffic', 'ru_tax176'],
    tags: ['ru-edtech', 'tier-1'],
    evidence: [EDTECH_EVIDENCE.tab2Players, EDTECH_EVIDENCE.smartRanking]
  },

  // Ниши
  {
    id: 'ru_niche_health',
    name: 'Здоровье, нутрициология, фитнес',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '🥗',
    value: '24,5 млрд ₽ (GetCourse, 2025)',
    valueNum: 24.5,
    color: '#64e0b4',
    description:
      'Вторая ниша рынка по обороту. Клубы и подписки дают 40–55% выручки, потребление тренировок и дневников питания — только со смартфона.',
    facts: [
      'Рост +30% за полугодие',
      'Чек курса 15 000 – 45 000 ₽, клубный взнос 2 500 – 6 000 ₽ в месяц',
      'LTV клиента 5–11 месяцев',
      'Мобильное приложение и Telegram Mini App здесь критичны'
    ],
    related: ['ru_band_15_80', 'ru_tg_club', 'ru_factory'],
    tags: ['ru-edtech', 'ниша'],
    evidence: [EDTECH_EVIDENCE.gcNiches2025, EDTECH_EVIDENCE.gcMarketShift]
  },
  {
    id: 'ru_niche_psy',
    name: 'Психология, коучинг, личностный рост',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '🧠',
    value: '17,7 – 17,9 млрд ₽',
    valueNum: 17.8,
    color: '#b39ddb',
    description:
      'Чек модулей 35–120 тыс. ₽, клубы терапевтической поддержки 3 000 – 7 500 ₽ в месяц. Подписка даёт 30–40% денежного потока системных школ.',
    facts: [
      'Саморазвитие растёт на 45%',
      'Рекуррент — 30–40% денежного потока',
      'Клубная механика требует автосписаний и удержания'
    ],
    related: ['ru_band_15_80', 'ru_tg_club', 'ru_factory'],
    tags: ['ru-edtech', 'ниша'],
    evidence: [EDTECH_EVIDENCE.gcNiches2025]
  },
  {
    id: 'ru_niche_digital',
    name: 'Digital-профессии',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '💻',
    value: '30,1 – 30,2 млрд ₽',
    valueNum: 30.15,
    color: '#6ea8fe',
    description:
      'Крупнейшая ниша по обороту, почти 3 000 школ. Разовые продажи флагманов с чеком 60–180 тыс. ₽ на банковских рассрочках и BNPL.',
    facts: [
      'Подписочная доля не выше 10–15%',
      'Курсы по прикладному ИИ растут на 15–60%',
      'Высокий чек = зависимость от кредитного брокера'
    ],
    related: ['ru_band_15_80', 'ru_installments', 'ru_bnpl'],
    tags: ['ru-edtech', 'ниша'],
    evidence: [EDTECH_EVIDENCE.gcAnalytics2025, EDTECH_EVIDENCE.gcMarketShift]
  },
  {
    id: 'ru_niche_kids',
    name: 'Детское образование, ЕГЭ и ОГЭ',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '📚',
    value: '32,0 млрд ₽ (2024)',
    valueNum: 32,
    color: '#ffd479',
    description:
      'Самая быстрорастущая часть институционального EdTech: подписка на учебный год, пакетные модули, высокий LTV.',
    facts: [
      'Рост +22,0% (2024/2025) и +31,6–32,6% г/г в рейтинге топ-100',
      '38% выручки топ-100 EdTech-компаний',
      'Требует юридического контура: акцепт оферты законным представителем'
    ],
    related: ['ru_band_500', 'ru_pdn152', 'ru_band_15_80'],
    tags: ['ru-edtech', 'ниша'],
    evidence: [EDTECH_EVIDENCE.skillboxRating, EDTECH_EVIDENCE.tab2Macro]
  },
  {
    id: 'ru_niche_lang',
    name: 'Иностранные языки и хобби',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '🗣️',
    value: '12,5 млрд ₽ (2024), +41% за полугодие',
    valueNum: 12.5,
    color: '#80cbc4',
    description:
      'Микроподписка на пакеты уроков 4 000 – 12 000 ₽ в месяц с LTV от 6 до 18 месяцев.',
    facts: [
      'Динамика +41% за полугодие по данным платформы',
      'Чек 6 000 – 25 000 ₽, продажи через автовебинары и сезонные скидки',
      'Приоритет внедрения — P2: низкая цена решения при низком чеке школы'
    ],
    related: ['ru_band_3_15', 'ru_factory'],
    tags: ['ru-edtech', 'ниша'],
    evidence: [EDTECH_EVIDENCE.gcNiches2025, EDTECH_EVIDENCE.tab2Macro]
  },
  {
    id: 'ru_niche_eso',
    name: 'Эзотерика, астрология, таро',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '🔮',
    value: 'свыше 6,5 млрд ₽',
    valueNum: 6.5,
    color: '#ce93d8',
    description:
      'Маржинальность выше среднерыночной, до 50% выручки рекуррентная. Образовательную лицензию получить нельзя — отсюда юрисдикционный арбитраж.',
    facts: [
      'Чек курсов 15 000 – 50 000 ₽, клуб прогнозов 1 500 – 4 000 ₽ в месяц',
      'Доля рекуррентной выручки до 50%',
      'Без лицензии проекты уходят в иностранные юрисдикции'
    ],
    related: ['ru_tg_club', 'ru_tax176', 'ru_band_3_15'],
    tags: ['ru-edtech', 'ниша'],
    evidence: [EDTECH_EVIDENCE.gcNiches2025, EDTECH_EVIDENCE.tab2Macro]
  },
  {
    id: 'ru_niche_sellers',
    name: 'Бизнес, селлерство, крипта',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '📦',
    value: '24,5 млрд ₽ (2024), −15%',
    valueNum: 24.5,
    color: '#ef9a9a',
    description:
      'Единственная ниша в минусе: закредитованность аудитории, рост комиссий маркетплейсов и уголовные дела подорвали конверсию высокочековых наставничеств.',
    facts: [
      'Чек 90 000 – 350 000 ₽, LTV 110 000 – 420 000 ₽',
      'Спад −15,0% за 2024/2025',
      'Нишa с наибольшей плотностью риск-флагов при отборе клиентов'
    ],
    related: ['ru_cbr_filter', 'ru_installments', 'ru_band_15_80'],
    tags: ['ru-edtech', 'ниша'],
    evidence: [EDTECH_EVIDENCE.tab2Macro, EDTECH_EVIDENCE.cbrBlacklist]
  },

  // Клубы и платформы
  {
    id: 'ru_tg_club',
    name: 'Платный Telegram-клуб',
    kind: 'service',
    domain: 'ru-edtech',
    emoji: '💬',
    value: '3 000+ платных каналов',
    valueNum: 3,
    color: '#4fc3f7',
    description:
      'Рекуррентное сообщество на ботах-посредниках. Модельный клуб: 600 участников × 3 500 ₽ = 2,1 млн ₽ оборота в месяц.',
    facts: [
      'Комиссия ботов-посредников — 10–20% всего входящего оборота',
      'При 10% владелец отдаёт 210 000 ₽ в месяц (2,52 млн ₽ в год)',
      'Переход на своё решение окупает 150 000 ₽ за 33 дня'
    ],
    related: ['ru_tg_paybots', 'ru_factory', 'ru_prodamus', 'ru_niche_psy'],
    tags: ['ru-edtech', 'icp'],
    evidence: [EDTECH_EVIDENCE.tgPayBots, EDTECH_EVIDENCE.prodamusRates]
  },
  {
    id: 'ru_getcourse',
    name: 'GetCourse',
    kind: 'product',
    domain: 'ru-edtech',
    emoji: '🧩',
    value: '6,8 млрд ₽ SaaS-выручки; 168 млрд ₽ оборота школ',
    valueNum: 6.8,
    color: '#ffa726',
    description:
      'Монопольный инфраструктурный хаб русскоязычного инфобизнеса: LMS, рассылки, собственный платёжный модуль. Главный источник постоянных издержек ICP.',
    facts: [
      '19 000+ школ и авторов на платформе',
      'Тарифы от 5 900 ₽ («Старт») до 133 800 ₽ («Tesla») в месяц',
      'Своего бренда в App Store школа не получает — только общее приложение Chatium',
      'Риск блокировки аккаунта и полная зависимость от тарифной сетки'
    ],
    related: ['ru_band_15_80', 'ru_lms_alt', 'ru_factory', 'ru_acquiring'],
    tags: ['ru-edtech', 'платформа'],
    evidence: [EDTECH_EVIDENCE.gcAnalytics2025, EDTECH_EVIDENCE.vakasPlatforms, EDTECH_EVIDENCE.tab2Players]
  },
  {
    id: 'ru_lms_alt',
    name: 'Zenclass, «Антитренинги», Skillspace, Bizon365',
    kind: 'product',
    domain: 'ru-edtech',
    emoji: '🗂️',
    value: '3 100 – 12 600 ₽/мес',
    valueNum: 0.1,
    color: '#a5d6a7',
    description:
      'Дешёвые LMS-конструкторы с более узким функционалом. Берут школы, которым тариф GetCourse стал дороже пользы.',
    facts: [
      'Zenclass 3 200 – 6 800 ₽/мес, «Антитренинги» 3 100 – 12 600 ₽/мес',
      'Нет нативного мобильного приложения под брендом школы',
      'Данные и база остаются на стороне сервиса'
    ],
    related: ['ru_getcourse', 'ru_band_3_15', 'ru_factory'],
    tags: ['ru-edtech', 'платформа'],
    evidence: [EDTECH_EVIDENCE.vakasPlatforms]
  },
  {
    id: 'ru_tg_paybots',
    name: 'Tribute, Paywall, Nemiling',
    kind: 'product',
    domain: 'ru-edtech',
    emoji: '🤖',
    value: 'комиссия 10–20% оборота',
    valueNum: 0.15,
    color: '#f48fb1',
    description:
      'Боты-посредники, продающие доступ в закрытые каналы. Берут плоский процент со всего входящего потока, независимо от объёма.',
    facts: [
      'Плоская комиссия 10–20% от всего оборота сообщества',
      'Для клуба на 2,1 млн ₽/мес это 210 000 ₽ ежемесячно',
      'Оплата без фискализации — отдельный регуляторный риск владельца'
    ],
    related: ['ru_tg_club', 'ru_factory', 'ru_prodamus'],
    tags: ['ru-edtech', 'платформа'],
    evidence: [EDTECH_EVIDENCE.tgPayBots]
  },
  {
    id: 'ru_kinescope',
    name: 'Kinescope и защищённый видеохостинг',
    kind: 'tech',
    domain: 'ru-edtech',
    emoji: '🎬',
    value: '1,5–1,9 ₽ за ГБ хранения',
    valueNum: 0.2,
    color: '#82b1ff',
    description:
      'Отечественная видеоплатформа с DRM и адаптивным HLS. Стала обязательной после замедления YouTube: бесплатно раздавать уроки больше негде.',
    facts: [
      'Хранение 1,5–1,9 ₽/ГБ, CDN 0,7–1,9 ₽/ГБ, транскодирование 0,8 ₽/мин',
      'Школа с видеотекой 400 часов и 1 500 студентов платит 9 000 – 22 000 ₽ в месяц',
      'Годовой расход 108 000 – 264 000 ₽'
    ],
    related: ['ru_band_15_80', 'ru_youtube_slow', 'ru_factory'],
    tags: ['ru-edtech', 'инфраструктура'],
    evidence: [EDTECH_EVIDENCE.kinescopePricing]
  },
  {
    id: 'ru_bots_crm',
    name: 'Salebot, BotHelp и рассылки',
    kind: 'tech',
    domain: 'ru-edtech',
    emoji: '📨',
    value: '2 399 – 9 900 ₽/мес',
    valueNum: 0.07,
    color: '#80deea',
    description:
      'Конструкторы воронок и коммуникационные CRM. Отдельная абонентская плата поверх LMS и отдельная точка отказа при запуске.',
    facts: [
      'Salebot «Инфобизнес» 2 999 – 3 999 ₽/мес, с доп. каналами до 5 000 – 7 000 ₽/мес',
      'BotHelp 2 399 – 9 900 ₽/мес по размеру базы',
      'Годовой расход школы 60 000 – 84 000 ₽'
    ],
    related: ['ru_band_15_80', 'ru_techspec', 'ru_factory'],
    tags: ['ru-edtech', 'инфраструктура'],
    evidence: [EDTECH_EVIDENCE.salebotRates, EDTECH_EVIDENCE.botHelpPricing]
  },

  // Платёжный контур
  {
    id: 'ru_prodamus',
    name: 'Prodamus',
    kind: 'tech',
    domain: 'ru-edtech',
    emoji: '💳',
    value: '2,9–3,8% РФ · 50–60% школ',
    valueNum: 3.3,
    color: '#69f0ae',
    description:
      'Самый распространённый шлюз малых и средних школ. Встроенная облачная касса по 54-ФЗ снимает расход на фискальный накопитель.',
    facts: [
      'Ставка снижается с 3,8% до 2,9% при обороте от 4 млн ₽ в месяц',
      'Международные карты — 7,9–10%',
      'Поддерживает рекуррентный биллинг клубов'
    ],
    related: ['ru_band_15_80', 'ru_tg_club', 'ru_factory', 'ru_installments'],
    tags: ['ru-edtech', 'платежи'],
    evidence: [EDTECH_EVIDENCE.prodamusRates]
  },
  {
    id: 'ru_acquiring',
    name: 'ЮKassa, CloudPayments, банковский эквайринг',
    kind: 'tech',
    domain: 'ru-edtech',
    emoji: '🏦',
    value: '2,4–3,5% с оборота',
    valueNum: 3,
    color: '#4db6ac',
    description:
      'Шлюзы средних и крупных проектов. CloudPayments — лидер сложных рекуррентных списаний, требует связки с CloudKassir.',
    facts: [
      'ЮKassa и CloudPayments 2,8–3,5%, Т-Банк 2,6–3,2%, Сбер 2,4–3,0%',
      'Доля у школ: ЮKassa 20–30%, Т-Банк 25–35%, Сбер 15–20%',
      'Фискализация по 54-ФЗ — обязательное требование к интеграции'
    ],
    related: ['ru_band_15_80', 'ru_prodamus', 'ru_factory'],
    tags: ['ru-edtech', 'платежи'],
    evidence: [EDTECH_EVIDENCE.prodamusRates, EDTECH_EVIDENCE.tab2Macro]
  },
  {
    id: 'ru_installments',
    name: 'Банковские рассрочки и кредитные брокеры',
    kind: 'tech',
    domain: 'ru-edtech',
    emoji: '🧾',
    value: 'дисконт 8,5–28% от чека',
    valueNum: 18,
    color: '#ffab91',
    description:
      'Механизм высокого чека: банк платит школе сразу, удерживая субсидию беспроцентного периода. Рост ключевой ставки удвоил этот дисконт.',
    facts: [
      '6 мес. — 8,5–10,5%, 12 мес. — 13–16%, 24 мес. — до 24–28%',
      'В 2023 дисконт на 24 месяца был 10–12%, к 2025 вырос до 18–26%',
      'На чеках 60–250 тыс. ₽ рассрочка занимает 65–82% транзакций'
    ],
    related: ['ru_student', 'ru_band_15_80', 'ru_niche_digital', 'ru_prodamus'],
    tags: ['ru-edtech', 'платежи'],
    evidence: [EDTECH_EVIDENCE.prodamusInstallments, EDTECH_EVIDENCE.gcMarketShift]
  },
  {
    id: 'ru_bnpl',
    name: 'BNPL: «Долями», «Сплит», «Плати частями»',
    kind: 'tech',
    domain: 'ru-edtech',
    emoji: '🪙',
    value: 'комиссия 4–6%',
    valueNum: 5,
    color: '#ffe082',
    description:
      'Оплата в четыре платежа на чеках 1–50 тыс. ₽ (до 150 тыс. ₽ в «Яндекс Сплит»). Драйвер повторных покупок при жёсткой кредитной политике банков.',
    facts: [
      'Одобряемость 85–95% — классической кредитной проверки нет',
      'Комиссия сервиса со школы 4–6%',
      'На малых чеках доля BNPL 8–15%'
    ],
    related: ['ru_student', 'ru_band_15_80', 'ru_niche_lang'],
    tags: ['ru-edtech', 'платежи'],
    evidence: [EDTECH_EVIDENCE.prodamusInstallments]
  },
  {
    id: 'ru_cis_pay',
    name: 'Kaspi Pay, Freedom Pay, ЕРИП',
    kind: 'tech',
    domain: 'ru-edtech',
    emoji: '🌐',
    value: '1,8–3,0% · 5–10% оборота школ',
    valueNum: 2.4,
    color: '#a5b4fc',
    description:
      'Контур СНГ. В Казахстане экосистема Kaspi даёт до 75% оплат локальных курсов, в Беларуси обязателен ЕРИП.',
    facts: [
      'Внутренний рынок Казахстана — свыше 20 млрд тенге в год',
      'Трансграничный приём вне контура банков РФ стоит 4,5–7,0%',
      'Требует обработки платежей в тенге'
    ],
    related: ['ru_band_15_80', 'ru_prodamus'],
    tags: ['ru-edtech', 'платежи'],
    evidence: [EDTECH_EVIDENCE.tab2Macro]
  },

  // Каналы и посредники
  {
    id: 'ru_traffic',
    name: 'Платный трафик: Telegram Ads, VK, Директ',
    kind: 'service',
    domain: 'ru-edtech',
    emoji: '📣',
    value: '30–42% валовой выручки',
    valueNum: 36,
    color: '#f06292',
    description:
      'Крупнейшая статья расходов запуска. Стоимость целевого лида выросла на 35–40% за 2024–2025.',
    facts: [
      'Аллокация 30,0–42,0% валовой выручки',
      'Лидогенерация из заблокированных соцсетей упала на 20% г/г',
      'Выручка через Telegram выросла на 55% — свыше 3,4 млрд ₽ за полугодие'
    ],
    related: ['ru_band_15_80', 'ru_producers', 'ru_telegram_shift'],
    tags: ['ru-edtech', 'каналы'],
    evidence: [EDTECH_EVIDENCE.gcTelegram, EDTECH_EVIDENCE.tab2Macro]
  },
  {
    id: 'ru_producers',
    name: 'Продюсерские центры и запусковые агентства',
    kind: 'service',
    domain: 'ru-edtech',
    emoji: '🎬',
    value: '3–8 школ на агентство',
    valueNum: 5,
    color: '#ba68c8',
    description:
      'Главный партнёрский канал: одно агентство ведёт 3–8 экспертов с частотой 4–6 запусков в год. Забирает до 50% чистой EBITDA запуска.',
    facts: [
      'Агентская комиссия студии — 20% чека внедрения (28 000 – 40 000 ₽)',
      'White-Label позволяет агентству продавать за 250 000 – 350 000 ₽',
      'Первые 20 внедрений планируются через 10–15 агентств'
    ],
    related: ['ru_band_15_80', 'ru_factory', 'ru_traffic'],
    tags: ['ru-edtech', 'каналы'],
    evidence: [EDTECH_EVIDENCE.studioOffer, EDTECH_EVIDENCE.tab2Macro]
  },
  {
    id: 'ru_techspec',
    name: 'Технические специалисты GetCourse и Salebot',
    kind: 'service',
    domain: 'ru-edtech',
    emoji: '🛠️',
    value: '5 000+ практикующих; 45–120 тыс. ₽/мес',
    valueNum: 5,
    color: '#90a4ae',
    description:
      'Руки, которыми держится стек школы, и одновременно агенты влияния: они перегружены рутинной вёрсткой и нестабильными интеграциями.',
    facts: [
      'Проектная занятость 45 000 – 75 000 ₽/мес, штат — 80 000 – 120 000 ₽/мес',
      'Годовой ФОТ технических рук школы 540 000 – 1 080 000 ₽',
      'Бонус за рекомендацию — 25 000 ₽ за закрытую сделку'
    ],
    related: ['ru_band_15_80', 'ru_getcourse', 'ru_bots_crm', 'ru_factory'],
    tags: ['ru-edtech', 'каналы'],
    evidence: [EDTECH_EVIDENCE.studioOffer, EDTECH_EVIDENCE.vakasPlatforms]
  },

  // Регуляторные триггеры
  {
    id: 'ru_tax176',
    name: 'Налоговая реформа: НДС на УСН (176-ФЗ)',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '⚖️',
    value: 'нагрузка с 6% до 11–13%',
    valueNum: 12,
    color: '#ff8a65',
    description:
      'С 01.01.2025 обороты свыше 60 млн ₽ на УСН облагаются НДС. Амнистия за дробление действует только при консолидации выручки на одном юрлице.',
    facts: [
      '60–250 млн ₽ — НДС 5%; 250–450 млн ₽ — НДС 7%; свыше 450 млн ₽ — ОСНО',
      'Сетки из десятков ИП потеряли экономический смысл',
      'Продукту нужен единый реестр транзакций и прозрачный биллинг'
    ],
    related: ['ru_band_15_80', 'ru_band_80_500', 'ru_factory', 'ru_niche_eso'],
    tags: ['ru-edtech', 'регулирование'],
    evidence: [EDTECH_EVIDENCE.fz176]
  },
  {
    id: 'ru_pdn152',
    name: 'Штрафы за утечки персональных данных (152-ФЗ)',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '🔐',
    value: 'штраф до 15–18 млн ₽',
    valueNum: 16,
    color: '#ef5350',
    description:
      'Хранение базы учеников на непрозрачном зарубежном SaaS стало финансовым риском. Школы уводят PostgreSQL на серверы в своей юрисдикции.',
    facts: [
      'Задело школы с базами свыше 10 000 учеников',
      'Усилен контроль трансграничной передачи данных',
      'Ответ продукта — полная изоляция ПДн на сервере клиента'
    ],
    related: ['ru_band_15_80', 'ru_factory', 'ru_niche_kids'],
    tags: ['ru-edtech', 'регулирование'],
    evidence: [EDTECH_EVIDENCE.fz152]
  },
  {
    id: 'ru_youtube_slow',
    name: 'Замедление YouTube в РФ',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '📉',
    value: 'август 2024',
    valueNum: 1,
    color: '#bdbdbd',
    description:
      'Бесплатная раздача защищённых уроков перестала работать: охваты упали, архивы поехали на отечественные видеоплатформы с DRM.',
    facts: [
      'Задело все школы с видеоуроками',
      'Спровоцировало миграцию на Kinescope и аналоги',
      'Требование к продукту — свой плеер с DRM и адаптивной полосой'
    ],
    related: ['ru_kinescope', 'ru_band_15_80'],
    tags: ['ru-edtech', 'регулирование'],
    evidence: [EDTECH_EVIDENCE.edtechsYoutube, EDTECH_EVIDENCE.kinescopePricing]
  },
  {
    id: 'ru_telegram_shift',
    name: 'Переток аудитории в Telegram',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '✈️',
    value: '+55% выручки школ',
    valueNum: 55,
    color: '#4fc3f7',
    description:
      'На фоне блокировок Meta Telegram стал главной точкой входа. Mini App открывает урок в один клик прямо из чата сообщества.',
    facts: [
      'Свыше 3,4 млрд ₽ выручки школ через Telegram за I полугодие 2025',
      'Лидогенерация из заблокированных соцсетей упала на 20% г/г',
      'Telegram Mini App стал обязательным форматом входа'
    ],
    related: ['ru_traffic', 'ru_factory', 'ru_tg_club'],
    tags: ['ru-edtech', 'регулирование'],
    evidence: [EDTECH_EVIDENCE.gcTelegram]
  },
  {
    id: 'ru_stores',
    name: 'Барьеры App Store и Google Play',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '🚧',
    value: '$99 в год + модерация',
    valueNum: 99,
    color: '#9e9e9e',
    description:
      'Оплата аккаунта разработчика картой иностранного банка, верификация D-U-N-S и риск отклонения сборки. Отсюда спрос на PWA, Telegram Mini App и RuStore.',
    facts: [
      'Комиссия Apple 30% на внутренние покупки обходится через веб-оплату',
      'Публикация в RuStore и PWA не зависит от политики зарубежных сторов',
      'Сопровождение публикации — платный апселл 35 000 – 50 000 ₽'
    ],
    related: ['ru_factory', 'ru_band_80_500'],
    tags: ['ru-edtech', 'регулирование'],
    evidence: [EDTECH_EVIDENCE.appleDeveloperRu]
  },
  {
    id: 'ru_cbr_filter',
    name: 'Риск-фильтр: реестры ЦБ и Росфинмониторинга',
    kind: 'sector',
    domain: 'ru-edtech',
    emoji: '🛑',
    value: '>6 500 субъектов в списке ЦБ',
    valueNum: 6.5,
    color: '#e53935',
    description:
      'Обязательная проверка до подписания договора. Присутствие проекта или учредителей в реестрах — безусловный отказ в сотрудничестве.',
    facts: [
      'Пирамиды, бинарные опционы и алгоритмический трейдинг — стоп',
      'Медицинские курсы без лицензии Росздравнадзора или Рособрнадзора — стоп',
      'Детские продукты без акцепта законного представителя — стоп',
      'Проверка по kad.arbitr.ru, ФССП и перечням Росфинмониторинга'
    ],
    related: ['ru_niche_sellers', 'ru_niche_health', 'ru_factory'],
    tags: ['ru-edtech', 'регулирование'],
    evidence: [EDTECH_EVIDENCE.cbrBlacklist, EDTECH_EVIDENCE.fedsfmRegistry]
  },

  // Альтернативы и наш продукт
  {
    id: 'ru_custom_dev',
    name: 'Студии заказной разработки',
    kind: 'product',
    domain: 'ru-edtech',
    emoji: '🏗️',
    value: '1,8–3,8 млн ₽ · 3–7 месяцев',
    valueNum: 2.8,
    color: '#8d6e63',
    description:
      'Purrweb, Appcraft, Inostudio, Team-B. Для 95% онлайн-школ бюджет и срок заградительные.',
    facts: [
      'Платформа со сложной аналитикой — 6–10 млн ₽',
      'Образовательные платформы у Purrweb — от 7,5 млн ₽',
      'Ставка middle-инженера 3 000 – 3 800 ₽/час'
    ],
    related: ['ru_factory', 'ru_band_500'],
    tags: ['ru-edtech', 'конкурент'],
    evidence: [EDTECH_EVIDENCE.teamBDev, EDTECH_EVIDENCE.purrwebEdu]
  },
  {
    id: 'ru_whitelabel',
    name: 'White-Label SaaS и зарубежные платформы',
    kind: 'product',
    domain: 'ru-edtech',
    emoji: '🏷️',
    value: 'от 12 790 ₽/мес · $99–499/мес',
    valueNum: 0.15,
    color: '#7986cb',
    description:
      'Gurucan и аналоги дают приложение, но не исходный код. Kajabi, Skool, Circle и Whop не принимают карты банков РФ и не закрывают 54-ФЗ и 152-ФЗ.',
    facts: [
      'Gurucan — от 12 790 ₽/мес плюс единоразовая плата за сборку',
      'Международные платформы $1 200 – $6 000 в год',
      'Зависимость от проприетарного облака, база данных недоступна'
    ],
    related: ['ru_factory', 'ru_pdn152'],
    tags: ['ru-edtech', 'конкурент'],
    evidence: [EDTECH_EVIDENCE.gurucanCompare, EDTECH_EVIDENCE.botConstructorsFreelance]
  },
  {
    id: 'ru_factory',
    name: 'Наш продукт: CLUBS и «Фабрика»',
    kind: 'product',
    domain: 'ru-edtech',
    emoji: '🏭',
    value: '125–200 тыс. ₽ · запуск 72 часа',
    valueNum: 0.165,
    color: '#ffd54f',
    description:
      'Нативное ядро React Native, веб и Telegram Mini App, LMS, рекуррентный биллинг и рассылки. Занимает пустое место между тарифом LMS и заказной студией.',
    facts: [
      'CLUBS 125 000 / 165 000 ₽, «Фабрика» 140 000 – 200 000 ₽',
      'Обслуживание 4 900 ₽/мес на сервере клиента, 7 900 ₽/мес на нашем',
      'Дешевле заказной студии примерно в 15 раз, быстрее — в десятки раз',
      'Исходный код и база PostgreSQL остаются у заказчика',
      'Апселлы: публикация в сторах 35–50 тыс. ₽, AI-тьютор 25–40 тыс. ₽, SLA 80/120 тыс. ₽ в месяц'
    ],
    related: ['ru_band_15_80', 'ru_tg_club', 'ru_getcourse', 'ru_prodamus', 'ru_kinescope', 'ru_producers'],
    tags: ['ru-edtech', 'наш продукт'],
    evidence: [EDTECH_EVIDENCE.studioOffer, EDTECH_EVIDENCE.vakasPlatforms, EDTECH_EVIDENCE.teamBDev]
  }
];

// ─── Потоки денег ─────────────────────────────────────────────────────────────
// Рублёвые суммы модельной школы с оборотом 35 млн ₽ в год (блок Б отчёта)
// и модельного клуба 600 × 3 500 ₽ (приложение отчёта).

export const EDTECH_FLOWS: MoneyFlow[] = [
  {
    id: 'ru-f-student-school',
    from: 'ru_student',
    to: 'ru_band_15_80',
    value: '35 млн ₽ в год (модельная школа)',
    valueNum: 35,
    label: 'оплата курсов',
    domain: 'ru-edtech',
    description:
      'Первичные деньги рынка. Более 75% покупок начинаются со смартфона, на чеках 50–300 тыс. ₽ 60–75% оплат идут через рассрочку.'
  },
  {
    id: 'ru-f-student-installments',
    from: 'ru_student',
    to: 'ru_installments',
    value: '65–82% транзакций на чеках 60–250 тыс. ₽',
    valueNum: 20,
    label: 'заявка на рассрочку',
    domain: 'ru-edtech',
    description:
      'Ученик берёт потребительский кредит, а проценты банку компенсирует школа дисконтом к цене курса.'
  },
  {
    id: 'ru-f-installments-school',
    from: 'ru_installments',
    to: 'ru_band_15_80',
    value: 'чек минус 8,5–28% дисконта',
    valueNum: 18,
    label: 'выплата банка школе',
    domain: 'ru-edtech',
    description:
      'Банк платит сразу, удерживая субсидию беспроцентного периода. Рост ключевой ставки поднял дисконт с 10–12% в 2023 до 18–26% в 2025.'
  },
  {
    id: 'ru-f-school-traffic',
    from: 'ru_band_15_80',
    to: 'ru_traffic',
    value: '10,5 – 14,7 млн ₽ в год (30–42%)',
    valueNum: 12.6,
    label: 'закупка трафика',
    domain: 'ru-edtech',
    description:
      'Крупнейшая статья запуска: Telegram Ads, посевы у блогеров, VK и контекст. Стоимость лида выросла на 35–40% за два года.'
  },
  {
    id: 'ru-f-school-getcourse',
    from: 'ru_band_15_80',
    to: 'ru_getcourse',
    value: '382 800 – 501 600 ₽ в год',
    valueNum: 0.44,
    label: 'лицензия LMS',
    domain: 'ru-edtech',
    description:
      'Тарифы «Продюсер» и «Гуру» — 31 900 – 41 800 ₽ в месяц. Именно этот платёж «Фабрика» заменяет на 4 900 ₽ в месяц.'
  },
  {
    id: 'ru-f-school-kinescope',
    from: 'ru_band_15_80',
    to: 'ru_kinescope',
    value: '108 000 – 264 000 ₽ в год',
    valueNum: 0.19,
    label: 'видеохостинг и CDN',
    domain: 'ru-edtech',
    description:
      'Видеотека 400 часов и 1 500 активных студентов дают 9 000 – 22 000 ₽ в месяц по модели фактического потребления.'
  },
  {
    id: 'ru-f-school-techspec',
    from: 'ru_band_15_80',
    to: 'ru_techspec',
    value: '540 000 – 1 080 000 ₽ в год',
    valueNum: 0.81,
    label: 'ФОТ технических рук',
    domain: 'ru-edtech',
    description:
      'Администраторы GetCourse и Salebot на проектной занятости или в штате. Автоматизация доступов высвобождает до половины этого времени.'
  },
  {
    id: 'ru-f-school-bots',
    from: 'ru_band_15_80',
    to: 'ru_bots_crm',
    value: '60 000 – 84 000 ₽ в год',
    valueNum: 0.07,
    label: 'боты и рассылки',
    domain: 'ru-edtech',
    description:
      'Отдельная абонентская плата поверх LMS за конструкторы воронок и коммуникационные CRM.'
  },
  {
    id: 'ru-f-school-acquiring',
    from: 'ru_band_15_80',
    to: 'ru_acquiring',
    value: '2,2 – 3,8 млн ₽ в год',
    valueNum: 3,
    label: 'эквайринг и банковские комиссии',
    domain: 'ru-edtech',
    description:
      'Совокупные выплаты шлюзам и банкам-партнёрам при обороте 35 млн ₽: эквайринг 2,4–3,5% плюс дисконты рассрочек.'
  },
  {
    id: 'ru-f-school-producers',
    from: 'ru_band_15_80',
    to: 'ru_producers',
    value: '50% чистой EBITDA запуска',
    valueNum: 0.5,
    label: 'доля продюсера',
    domain: 'ru-edtech',
    description:
      'Типовой сплит 50/50 при равном участии; в модели продюсерского центра полного цикла эксперт получает роялти 20–30%.'
  },
  {
    id: 'ru-f-club-paybots',
    from: 'ru_tg_club',
    to: 'ru_tg_paybots',
    value: '210 000 ₽ в месяц (2,52 млн ₽ в год)',
    valueNum: 2.52,
    label: 'комиссия бота-посредника',
    domain: 'ru-edtech',
    description:
      'Плоские 10% с оборота 2,1 млн ₽ в месяц. Комиссия не снижается с ростом клуба — она пропорциональна всему потоку.'
  },
  {
    id: 'ru-f-school-factory',
    from: 'ru_band_15_80',
    to: 'ru_factory',
    value: '125 000 – 200 000 ₽ единоразово + 4 900 ₽/мес',
    valueNum: 0.165,
    label: 'внедрение своего приложения',
    domain: 'ru-edtech',
    description:
      'Разовый платёж вместо ежемесячного тарифа. Замещает поток в GetCourse и половину нагрузки на техспеца: экономия 62 000 ₽ в месяц.'
  },
  {
    id: 'ru-f-club-factory',
    from: 'ru_tg_club',
    to: 'ru_factory',
    value: '150 000 ₽ единоразово',
    valueNum: 0.15,
    label: 'суверенный биллинг клуба',
    domain: 'ru-edtech',
    description:
      'Заменяет комиссию 10–20% на эквайринг 3,1% плюс 4 900 ₽ за сервер. Экономия свыше 136 000 ₽ в месяц окупает внедрение за 33 дня.'
  },
  {
    id: 'ru-f-factory-prodamus',
    from: 'ru_factory',
    to: 'ru_prodamus',
    value: '2,9–3,8% с оборота',
    valueNum: 3.3,
    label: 'эквайринг вместо комиссии платформы',
    domain: 'ru-edtech',
    description:
      'Прямая интеграция шлюза: 96,2–97,1% чека доходит до расчётного счёта школы, а чек уходит в ФНС встроенной облачной кассой.'
  },
  {
    id: 'ru-f-partner-fee',
    from: 'ru_factory',
    to: 'ru_producers',
    value: '28 000 – 40 000 ₽ с проекта',
    valueNum: 0.034,
    label: 'агентская комиссия 20%',
    domain: 'ru-edtech',
    description:
      'Плата партнёрскому каналу вместо холодного B2B-трафика. Альтернатива — White-Label с наценкой агентства до 250–350 тыс. ₽.'
  }
];

// ─── Цепочки зависимостей ─────────────────────────────────────────────────────

export const EDTECH_CHAINS: DependencyChain[] = [
  {
    id: 'ru-chain-launch',
    title: 'Трафик → запуск → платформа → удержание → отток',
    nodes: ['ru_traffic', 'ru_producers', 'ru_band_15_80', 'ru_getcourse', 'ru_student'],
    summary: 'Классический цикл запуска и место, где он начал ломаться.',
    insight:
      'Трафик забирает 30–42% выручки и дорожает на 35–40% за два года, продюсер — половину EBITDA, платформа — фиксированный тариф. Маржинальность запусков сжалась с 50–60% до 15–25%, поэтому выживание переехало из «привести ещё лидов» в «удержать базу и снять постоянные издержки».'
  },
  {
    id: 'ru-chain-regulation',
    title: 'Регуляторный триггер → требование к учёту → спрос на своё приложение',
    nodes: ['ru_tax176', 'ru_pdn152', 'ru_band_15_80', 'ru_factory'],
    summary: 'Почему рынок начал покупать суверенную инфраструктуру.',
    insight:
      'НДС на УСН убил сетки из десятков ИП и потребовал единого реестра транзакций, а штрафы до 18 млн ₽ сделали хранение базы учеников на чужом SaaS финансовым риском. Требование «единый прозрачный биллинг плюс своя PostgreSQL» — это ровно спецификация продукта, а не пожелание.'
  },
  {
    id: 'ru-chain-video',
    title: 'Замедление YouTube → миграция видео → цена гигабайта',
    nodes: ['ru_youtube_slow', 'ru_kinescope', 'ru_band_15_80', 'ru_student'],
    summary: 'Как бесплатный видеохостинг превратился в постоянную статью расходов.',
    insight:
      'С августа 2024 бесплатно раздавать уроки негде. Видео переехало на платформы с DRM по цене 1,5–1,9 ₽ за гигабайт хранения — 108 000 – 264 000 ₽ в год для средней школы. Скорость плеера теперь прямо влияет на доходимость студента.'
  },
  {
    id: 'ru-chain-installment',
    title: 'Высокий чек → рассрочка → банковский дисконт → сжатие маржи',
    nodes: ['ru_student', 'ru_installments', 'ru_band_15_80', 'ru_producers'],
    summary: 'Кредитный механизм высокого чека и его цена для школы.',
    insight:
      'На чеках 60–250 тыс. ₽ 65–82% продаж идут в рассрочку, а школа платит за это дисконтом 13–28%. При росте ключевой ставки дисконт почти удвоился — именно он, а не налоги, съел маржу высокочековых ниш.'
  },
  {
    id: 'ru-chain-club',
    title: 'Комиссия бота → своё приложение → окупаемость за месяц',
    nodes: ['ru_tg_club', 'ru_tg_paybots', 'ru_factory', 'ru_prodamus'],
    summary: 'Самый короткий расчёт окупаемости на рынке.',
    insight:
      'Клуб на 600 подписчиков по 3 500 ₽ отдаёт боту-посреднику 210 000 ₽ в месяц. Свой контур с эквайрингом 3,1% и сервером за 4 900 ₽ стоит около 70 000 ₽ — разница 140 000 ₽ в месяц возвращает 150 000 ₽ внедрения за 33 дня.'
  }
];

export const EDTECH_LINKS: DependencyLink[] = [
  {
    id: 'ru-d1',
    from: 'ru_getcourse',
    to: 'ru_band_15_80',
    label: 'тариф платформы держит постоянные издержки',
    description:
      'От 21 100 до 86 300 ₽ в месяц независимо от того, был запуск или нет. Смена тарифа — единственный быстрый рычаг на постоянных расходах.',
    strength: 'critical'
  },
  {
    id: 'ru-d2',
    from: 'ru_tax176',
    to: 'ru_band_80_500',
    label: 'НДС ломает схему дробления',
    description:
      'Рост фискальной нагрузки с 6% до 11–13% валового дохода вынуждает консолидировать выручку на одном юрлице и вести единый учёт оплат.',
    strength: 'critical'
  },
  {
    id: 'ru-d3',
    from: 'ru_installments',
    to: 'ru_niche_digital',
    label: 'дисконт банка съедает маржу высокого чека',
    description:
      'Ниша с чеком 60–180 тыс. ₽ живёт на рассрочках, где школа теряет 13–28% номинала. Это главный расход после трафика.',
    strength: 'critical'
  },
  {
    id: 'ru-d4',
    from: 'ru_youtube_slow',
    to: 'ru_kinescope',
    label: 'блокировка канала породила платный хостинг',
    description:
      'Замедление YouTube в августе 2024 перевело видеоархивы школ на отечественные платформы с DRM и потреблением по гигабайтам.',
    strength: 'strong'
  },
  {
    id: 'ru-d5',
    from: 'ru_telegram_shift',
    to: 'ru_factory',
    label: 'Telegram делает Mini App обязательным',
    description:
      'Рост выручки через Telegram на 55% сделал Mini App основной точкой входа: урок открывается в один клик прямо из чата сообщества.',
    strength: 'strong'
  },
  {
    id: 'ru-d6',
    from: 'ru_tg_paybots',
    to: 'ru_tg_club',
    label: 'плоская комиссия наказывает за рост',
    description:
      '10–20% берутся со всего оборота и не снижаются с масштабом: чем крупнее клуб, тем дороже посредник в абсолютных деньгах.',
    strength: 'critical'
  },
  {
    id: 'ru-d7',
    from: 'ru_traffic',
    to: 'ru_band_15_80',
    label: 'стоимость лида задаёт юнит-экономику',
    description:
      'Рост CPL на 35–40% за 2024–2025 сжал маржинальность запусков с 50–60% до 15–25% и перевёл фокус на LTV и рекуррент.',
    strength: 'critical'
  },
  {
    id: 'ru-d8',
    from: 'ru_pdn152',
    to: 'ru_whitelabel',
    label: 'штрафы обесценивают зарубежный SaaS',
    description:
      'Требование локализации баз и штрафы до 18 млн ₽ выводят Kajabi, Skool и подобные платформы из практики российских школ.',
    strength: 'strong'
  },
  {
    id: 'ru-d9',
    from: 'ru_techspec',
    to: 'ru_factory',
    label: 'техспецы решают, что купит школа',
    description:
      'Более 5 000 практикующих администраторов формируют выбор стека. Бонус 25 000 ₽ за сделку превращает их из тормоза во входной канал.',
    strength: 'moderate'
  },
  {
    id: 'ru-d10',
    from: 'ru_stores',
    to: 'ru_factory',
    label: 'барьеры сторов двигают к PWA и Mini App',
    description:
      'Пошлина $99, D-U-N-S и риск отклонения сборки делают триаду «Telegram Mini App + PWA + RuStore» рабочим обходом.',
    strength: 'moderate'
  },
  {
    id: 'ru-d11',
    from: 'ru_cbr_filter',
    to: 'ru_niche_sellers',
    label: 'риск-фильтр отсекает целую нишу',
    description:
      'Наставничества с обещанием дохода концентрируют попадания в реестр ЦБ; проверка до договора важнее размера чека.',
    strength: 'strong'
  }
];

// ─── Динамика рынка 2023–2026 (вкладка 2 отчёта) ──────────────────────────────

export interface EdtechTrendRow {
  segment: string;
  y2023: number;
  y2024: number;
  y2025: number;
  y2026: number;
  cagr: string;
  note: string;
}

export const EDTECH_TREND: EdtechTrendRow[] = [
  {
    segment: 'Институциональный EdTech (топ-100)',
    y2023: 119,
    y2024: 144.5,
    y2025: 154,
    y2026: 168,
    cagr: '+12,2%',
    note: 'Лицензированные платформы; рост замедлился до 12% г/г.'
  },
  {
    segment: 'Оборот школ на GetCourse',
    y2023: 158,
    y2024: 165,
    y2025: 168,
    y2026: 178,
    cagr: '+4,0%',
    note: 'Плато: платформа перешла в зрелую фазу, 19 000+ школ.'
  },
  {
    segment: 'Независимый белый сегмент',
    y2023: 25,
    y2024: 30.5,
    y2025: 33,
    y2026: 36,
    cagr: '+12,9%',
    note: 'Свои LMS, Prodamus, кастомные платформы — наш прямой периметр.'
  },
  {
    segment: 'Серый и теневой контур',
    y2023: 75,
    y2024: 85,
    y2025: 70,
    y2026: 60,
    cagr: '−7,2%',
    note: 'Доля упала с 20% до 13–14%: проверки ФНС, 115-ФЗ, уголовные дела.'
  },
  {
    segment: 'Совокупный GMV рынка',
    y2023: 377,
    y2024: 425,
    y2025: 425,
    y2026: 442,
    cagr: '+5,4%',
    note: 'Свыше 86% оборота проходит через фискализированный контур.'
  }
];

// ─── Т1. Сегменты ICP ─────────────────────────────────────────────────────────

export interface EdtechSegment {
  id: string;
  band: string;
  niche: string;
  players: string;
  avgCheck: string;
  launches: string;
  platform: string;
  techStaff: string;
  techCostYear: string;
  payback: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  nodeId: string;
}

export const EDTECH_SEGMENTS: EdtechSegment[] = [
  { id: 's1', band: '15–80 млн ₽', niche: 'Здоровье и фитнес', players: '650–800', avgCheck: '15–45 тыс. ₽', launches: '6–10', platform: 'GetCourse / Zenclass', techStaff: 'да, аутсорс', techCostYear: '0,9–1,4 млн ₽', payback: '1,8–2,5 мес', priority: 'P0', nodeId: 'ru_niche_health' },
  { id: 's2', band: '15–80 млн ₽', niche: 'Психология и коучинг', players: '600–750', avgCheck: '25–60 тыс. ₽', launches: '6–8', platform: 'GetCourse', techStaff: 'да, 1 человек', techCostYear: '1,1–1,6 млн ₽', payback: '2,0–3,0 мес', priority: 'P0', nodeId: 'ru_niche_psy' },
  { id: 's3', band: '3–15 млн ₽', niche: 'Закрытые Telegram-клубы', players: '1 800–2 300', avgCheck: '2,5–5 тыс. ₽/мес', launches: 'рекуррент', platform: 'Paywall / Tribute', techStaff: 'нет, боты', techCostYear: '0,3–0,6 млн ₽ комиссий', payback: '1,2–1,8 мес', priority: 'P0', nodeId: 'ru_tg_club' },
  { id: 's4', band: '15–80 млн ₽', niche: 'Digital-профессии', players: '700–850', avgCheck: '45–120 тыс. ₽', launches: '4–8', platform: 'GetCourse', techStaff: 'да, 1–2 человека', techCostYear: '1,2–1,8 млн ₽', payback: '2,2–3,2 мес', priority: 'P1', nodeId: 'ru_niche_digital' },
  { id: 's5', band: '80–500 млн ₽', niche: 'Мультинишевые школы', players: '280–350', avgCheck: '35–150 тыс. ₽', launches: 'регулярно', platform: 'GetCourse (VIP)', techStaff: 'да, отдел', techCostYear: '2,5–5,0 млн ₽', payback: '<1 мес на LTV', priority: 'P1', nodeId: 'ru_band_80_500' },
  { id: 's6', band: '3–15 млн ₽', niche: 'Хобби, эзотерика, языки', players: '2 500–3 200', avgCheck: '8–25 тыс. ₽', launches: '3–5', platform: 'GetCourse / Tilda', techStaff: 'фриланс', techCostYear: '0,4–0,7 млн ₽', payback: '3,5–5,0 мес', priority: 'P2', nodeId: 'ru_niche_eso' },
  { id: 's7', band: '> 500 млн ₽', niche: 'Крупный EdTech', players: '40–60', avgCheck: '60–200 тыс. ₽', launches: 'конвейер', platform: 'in-house LMS', techStaff: 'да, ИТ-штат', techCostYear: '> 25 млн ₽', payback: 'не применимо', priority: 'P3', nodeId: 'ru_band_500' }
];

// ─── Т2. Лестница цен: конкуренты и альтернативы ──────────────────────────────

export interface EdtechCompetitor {
  id: string;
  name: string;
  type: string;
  entry: string;
  monthly: string;
  time: string;
  scope: string;
  buyer: string;
  argument: string;
  ours?: boolean;
  nodeId?: string;
}

export const EDTECH_COMPETITORS: EdtechCompetitor[] = [
  { id: 'c0', name: '«Фабрика» / CLUBS', type: 'агентская сборка', entry: '125–200 тыс. ₽', monthly: '4 900 – 7 900 ₽', time: '72 часа', scope: 'React Native + Telegram Mini App + веб + LMS + рекуррент', buyer: 'школы 15–80 млн ₽, Telegram-клубы', argument: 'быстрее студий в десятки раз, дешевле в 15 раз, код и база у клиента', ours: true, nodeId: 'ru_factory' },
  { id: 'c1', name: 'GetCourse / Chatium', type: 'LMS-конструктор', entry: '0 ₽, входит в тариф', monthly: '21 100 – 86 300 ₽', time: '1–3 дня', scope: 'доступ к контенту через общее приложение Chatium', buyer: 'все, кто уже на GetCourse', argument: 'нет своего бренда в сторе, высокий постоянный тариф', nodeId: 'ru_getcourse' },
  { id: 'c2', name: 'Заказная студия (Purrweb, Inostudio)', type: 'custom dev', entry: '1,8–3,8 млн ₽', monthly: '50 000 – 100 000 ₽', time: '3–6 месяцев', scope: 'ТЗ, дизайн, бэкенд, iOS и Android под ключ', buyer: 'корпорации, EdTech свыше 100 млн ₽', argument: 'избыточный бюджет, долгий срок, риск срыва запуска', nodeId: 'ru_custom_dev' },
  { id: 'c3', name: 'Фриланс Telegram Mini App', type: 'частная разработка', entry: '30–60 тыс. ₽', monthly: '0 – 5 000 ₽', time: '2–4 недели', scope: 'простой веб-интерфейс в боте', buyer: 'начинающие эксперты', argument: 'нет мобильного приложения, нет LMS, нет гарантий', nodeId: 'ru_whitelabel' },
  { id: 'c4', name: 'Gurucan', type: 'White-Label SaaS', entry: 'от 12 790 ₽ + плата за сборку', monthly: 'от 12 790 ₽', time: '2–4 недели', scope: 'SaaS-платформа плюс приложение под заказ', buyer: 'блогеры, эксперты', argument: 'подписочная зависимость от SaaS, нет исходного кода', nodeId: 'ru_whitelabel' },
  { id: 'c5', name: 'Kajabi / Skool', type: 'зарубежные платформы', entry: '$99 – $499 в месяц', monthly: '$1 200 – $6 000 в год', time: '1–2 дня', scope: 'англоязычный комьюнити-движок', buyer: 'международные авторы', argument: 'нет оплат картами РФ, нет 54-ФЗ, нарушение 152-ФЗ', nodeId: 'ru_whitelabel' }
];

// ─── Т3. Платёжный контур ─────────────────────────────────────────────────────

export interface EdtechGateway {
  id: string;
  name: string;
  fee: string;
  recurrent: string;
  installment: string;
  geo: string;
  share: string;
  requirement: string;
  nodeId: string;
}

export const EDTECH_GATEWAYS: EdtechGateway[] = [
  { id: 'g1', name: 'Prodamus', fee: '2,9–3,8% РФ · 7,9–10% мир', recurrent: 'да, встроен', installment: 'да, мультибанк', geo: 'РФ, СНГ, весь мир', share: '50–60%', requirement: 'обработчик webhook-статусов, автопривязка карт', nodeId: 'ru_prodamus' },
  { id: 'g2', name: 'Т-Банк (эквайринг + «Долями»)', fee: '2,6–3,2% · BNPL 4–6%', recurrent: 'да', installment: 'да, до 500 тыс. ₽', geo: 'РФ', share: '25–35%', requirement: 'протокол T-Pay, виджет «Долями»', nodeId: 'ru_bnpl' },
  { id: 'g3', name: 'Сбербанк («Плати частями»)', fee: '2,4–3,0% · BNPL 4–5%', recurrent: 'да', installment: 'да, до 300 тыс. ₽', geo: 'РФ', share: '15–20%', requirement: 'SberPay API и кредитный брокер Сбера', nodeId: 'ru_bnpl' },
  { id: 'g4', name: 'CloudPayments', fee: '2,8–3,5%', recurrent: 'да, лидер', installment: 'нет', geo: 'РФ, СНГ', share: '10–15%', requirement: 'синхронизация подписок и CloudKassir', nodeId: 'ru_acquiring' },
  { id: 'g5', name: 'ЮKassa', fee: '2,8–3,5%', recurrent: 'да', installment: 'да, ЮMoney', geo: 'РФ', share: '20–30%', requirement: 'фискализация по 54-ФЗ через API', nodeId: 'ru_acquiring' },
  { id: 'g6', name: 'Kaspi Pay / Freedom Pay', fee: '1,8–3,0%', recurrent: 'ограниченно', installment: 'да, Kaspi Red', geo: 'Казахстан', share: '5–10%', requirement: 'обработка платежей в тенге', nodeId: 'ru_cis_pay' }
];

// ─── Т4. Триггеры спроса ──────────────────────────────────────────────────────

export interface EdtechTrigger {
  id: string;
  event: string;
  date: string;
  whom: string;
  pain: string;
  answer: string;
  nodeId: string;
}

export const EDTECH_TRIGGERS: EdtechTrigger[] = [
  { id: 't1', event: 'Налоговая реформа: НДС на УСН', date: '01.01.2025', whom: 'школы с оборотом свыше 60 млн ₽', pain: 'риск проверок за дробление, нужен единый реестр оплат', answer: 'единая база PostgreSQL и прозрачный биллинг', nodeId: 'ru_tax176' },
  { id: 't2', event: 'Замедление YouTube в РФ', date: 'август 2024', whom: 'все школы с видеоуроками', pain: 'ученики не могут смотреть контент, падает NPS', answer: 'интеграция Kinescope: быстрый плеер с DRM', nodeId: 'ru_youtube_slow' },
  { id: 't3', event: 'Рост трафика в Telegram (+55%)', date: '2024–2025', whom: 'продюсеры и инфобизнес', pain: 'конверсии из заблокированных соцсетей упали, лид дорожает', answer: 'Telegram Mini App, открывающий урок в один клик', nodeId: 'ru_telegram_shift' },
  { id: 't4', event: 'Ужесточение штрафов по 152-ФЗ', date: '2024–2025', whom: 'школы с базами свыше 10 000 учеников', pain: 'штраф до 18 млн ₽ за хранение ПДн на стороннем SaaS', answer: 'полная изоляция персональных данных на сервере клиента', nodeId: 'ru_pdn152' },
  { id: 't5', event: 'Барьеры App Store и Google Play', date: '2024–2026', whom: 'школы, которым нужно мобильное приложение', pain: 'пошлина $99, отклонение сборок, комиссия 30%', answer: 'PWA + Telegram Mini App + RuStore, публикация через студию', nodeId: 'ru_stores' }
];

// ─── Т5. Каналы и партнёры ────────────────────────────────────────────────────

export interface EdtechChannel {
  id: string;
  name: string;
  type: string;
  reach: string;
  approach: string;
  reward: string;
  priority: 'P0' | 'P1' | 'P2';
  nodeId: string;
}

export const EDTECH_CHANNELS: EdtechChannel[] = [
  { id: 'ch1', name: 'Продюсерские агентства', type: 'B2B-партнёр', reach: '3–8 школ на агентство', approach: 'питч через экономию ФОТ и рост LTV запусков', reward: '20% с чека внедрения (30–40 тыс. ₽)', priority: 'P0', nodeId: 'ru_producers' },
  { id: 'ch2', name: 'Техспецы GetCourse и Salebot', type: 'агенты влияния', reach: '5 000+ специалистов в чатах', approach: 'предложение снять рутину вёрстки и интеграций', reward: '25 000 ₽ фикс за переданного платящего клиента', priority: 'P0', nodeId: 'ru_techspec' },
  { id: 'ch3', name: 'Владельцы Telegram-клубов', type: 'прямой B2B', reach: '3 000+ платных каналов', approach: 'калькулятор экономии на комиссии 10%', reward: 'демонстрация окупаемости 150 тыс. ₽ за 1–2 месяца', priority: 'P0', nodeId: 'ru_tg_club' },
  { id: 'ch4', name: 'EdTech-конференции', type: 'офлайн и ивенты', reach: '1 000–3 000 участников', approach: 'стенд с генерацией Mini App за 15 минут', reward: 'прямой сбор контактов ЛПР на демо-стенде', priority: 'P1', nodeId: 'ru_producers' },
  { id: 'ch5', name: 'Нишевые Telegram-каналы по инфобизу', type: 'медиа-трафик', reach: '10 000 – 50 000 охвата', approach: 'кейсы миграции с разбором юнит-экономики', reward: 'CPL / CPA за квалифицированный лид', priority: 'P2', nodeId: 'ru_traffic' }
];

// ─── Окупаемость: главный экономический вывод отчёта ──────────────────────────
// Числа не захардкожены: срок считается из статей экономии, чтобы вилка
// не разъехалась при правке исходных данных (блок Б и приложение отчёта).

const PRICE_FACTORY = 150_000; // базовая стоимость внедрения, ₽
const SAVE_LMS = 36_900 - 4_900; // тариф «Продюсер»/«Гуру» минус обслуживание студии
const SAVE_TECH = 30_000; // высвобождение до 50% времени техспеца
const CLUB_GMV = 600 * 3_500; // модельный клуб: 600 подписчиков × 3 500 ₽
const CLUB_BOT_FEE = CLUB_GMV * 0.1; // плоская комиссия бота-посредника, 10%
const CLUB_OWN_COST = CLUB_GMV * 0.031 + 4_900; // эквайринг Prodamus 3,1% + сервер

const months = (save: number) => PRICE_FACTORY / save;

export interface EdtechPayback {
  id: string;
  title: string;
  saveMonth: number;
  months: number;
  days: number;
  basis: string;
}

export const EDTECH_PAYBACK: EdtechPayback[] = [
  {
    id: 'p-school',
    title: 'Школа 35 млн ₽: базовый сценарий',
    saveMonth: SAVE_LMS + SAVE_TECH,
    months: months(SAVE_LMS + SAVE_TECH),
    days: months(SAVE_LMS + SAVE_TECH) * 30,
    basis: 'Экономия на тарифе LMS (36 900 → 4 900 ₽) плюс высвобождение половины времени техспеца.'
  },
  {
    id: 'p-school-conservative',
    title: 'Школа 35 млн ₽: консервативно, без экономии ФОТ',
    saveMonth: SAVE_LMS,
    months: months(SAVE_LMS),
    days: months(SAVE_LMS) * 30,
    basis: 'Учитывается только разница в стоимости тарифов LMS, работа техспеца остаётся как есть.'
  },
  {
    id: 'p-club',
    title: 'Telegram-клуб 600 × 3 500 ₽',
    saveMonth: CLUB_BOT_FEE - CLUB_OWN_COST,
    months: months(CLUB_BOT_FEE - CLUB_OWN_COST),
    days: months(CLUB_BOT_FEE - CLUB_OWN_COST) * 30,
    basis: 'Комиссия бота-посредника 10% (210 000 ₽) против эквайринга 3,1% и сервера 4 900 ₽.'
  }
];

// Стоимость владения текущим стеком школы 15–80 млн ₽ — статьи блока Б.
export const EDTECH_SCHOOL_COSTS = [
  { id: 'cost-lms', label: 'Лицензия GetCourse', year: '382 800 – 501 600 ₽', month: '31 900 – 41 800 ₽', nodeId: 'ru_getcourse' },
  { id: 'cost-video', label: 'Видеохостинг Kinescope', year: '108 000 – 264 000 ₽', month: '9 000 – 22 000 ₽', nodeId: 'ru_kinescope' },
  { id: 'cost-tech', label: 'Технический специалист', year: '540 000 – 1 080 000 ₽', month: '45 000 – 120 000 ₽', nodeId: 'ru_techspec' },
  { id: 'cost-bots', label: 'Боты и рассылки', year: '60 000 – 84 000 ₽', month: '2 999 – 9 900 ₽', nodeId: 'ru_bots_crm' },
  { id: 'cost-acq', label: 'Эквайринг и банковские дисконты', year: '2,2 – 3,8 млн ₽', month: '2,4–3,5% + дисконт рассрочки', nodeId: 'ru_acquiring' },
  { id: 'cost-traffic', label: 'Трафик и платный маркетинг', year: '30–42% валовой выручки', month: 'рост CPL на 35–40% за два года', nodeId: 'ru_traffic' }
];
