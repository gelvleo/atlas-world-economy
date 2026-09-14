// ATLAS. Домен «Вьетнам и провинция Lâm Đồng».
//
// ОТДЕЛЬНЫЙ ПЕРИМЕТР, третий по счёту. Деньги домена считаются в долларах США:
// все MoneyFlow здесь долларовые. Донговые величины лежат справочными полями
// узлов и в потоки не входят - валюты в одном периметре не смешиваются.
// С мировым периметром суммы домена не складываются: мировой считает мировые
// рынки и добавленную стоимость, этот - страновые обороты.
//
// ВНУТРИ ДОМЕНА два уровня, и они между собой тоже не складываются:
//   - национальный: Вьетнам целиком, источники Нацстатслужба (nso.gov.vn),
//     World Bank API, вьетнамская таможня в перепечатках;
//   - региональный: провинция Lâm Đồng, источник - её статуправление
//     (thongkelamdong.nso.gov.vn), деньги в донгах с долларом рядом.
// Строка «экспорт кофе Вьетнама 8,9 млрд $» и строка «урожай кофе Lâm Đồng
// 1,03 млн т» - разные сущности: выручка страны и физический объём региона.
//
// АДМИНИСТРАТИВНАЯ ОГОВОРКА. С 1 июля 2025 Lâm Đồng объединена с Bình Thuận и
// Đắk Nông (резолюция 202/2025/QH15). Статистика 2025 года идёт по новым
// границам, 2024 и раньше - по старым, а сопоставимой базы 2024 по новому
// периметру не публикует никто. Поэтому у каждого регионального узла в scope
// написано, к какому периметру относится число. Драконий фрукт в списке
// урожаев провинции - прямое доказательство слияния: это культура Bình Thuận,
// в горах Đà Lạt она не растёт.
//
// Исходник разведки: docs/research/vietnam-data-os/atlas-vietnam-flows.md в
// репозитории HERMES_LIFESTYLE_OS, сбор 14.09.2026.

import type {
  DependencyChain,
  DependencyLink,
  EcoNode,
  EvidenceRef,
  MoneyFlow
} from '../types';

/** Справочный курс донга осенью 2026. Только для пересказа величины, не для сумм. */
export const VND_PER_USD = 26_300;

/** Миллиарды донгов в миллиарды долларов по справочному курсу. */
export const vndBnToUsdBn = (vndBn: number) => (vndBn * 1e9) / VND_PER_USD / 1e9;

// ─── Источники ────────────────────────────────────────────────────────────────

export const VN_EVIDENCE: Record<string, EvidenceRef> = {
  wbGdp: {
    id: 'wb-vnm-gdp',
    label: 'World Bank API, ВВП Вьетнама в текущих долларах',
    url: 'https://api.worldbank.org/v2/country/VNM/indicator/NY.GDP.MKTP.CD?format=json',
    date: '2025',
    kind: 'official',
    metric: 'ВВП 514,70 млрд $ (2025), 476,32 млрд $ (2024)',
    scope: 'живой запрос к API 14.09.2026; с донговой строкой Нацстатслужбы не совпадает из-за курса пересчёта'
  },
  wbGrowth: {
    id: 'wb-vnm-growth',
    label: 'World Bank API, рост ВВП и структура добавленной стоимости',
    url: 'https://api.worldbank.org/v2/country/VNM/indicator/NY.GDP.MKTP.KD.ZG?format=json',
    date: '2025',
    kind: 'official',
    metric: 'рост 8,02 %; сельское хозяйство 11,64 %, промышленность 37,65 %, услуги 42,74 %',
    scope: 'доли считаются от добавленной стоимости, а не от ВВП: до 100 % не дополняются, остаток это налоги за вычетом субсидий'
  },
  wbTrade: {
    id: 'wb-vnm-trade',
    label: 'World Bank API, экспорт и импорт товаров и услуг',
    url: 'https://api.worldbank.org/v2/country/VNM/indicator/NE.EXP.GNFS.CD?format=json',
    date: '2025',
    kind: 'official',
    metric: 'экспорт 505,66 млрд $, импорт 474,00 млрд $',
    scope: 'вместе с услугами, поэтому больше товарных чисел Нацстатслужбы; два ряда не смешивать'
  },
  nsoPress: {
    id: 'nso-press-2025',
    label: 'Нацстатслужба Вьетнама, пресс-релиз по итогам 2025 года',
    url: 'https://www.nso.gov.vn/en/data-and-statistics/2026/01/press-release-social-economic-situation-in-the-fourth-quarter-and-2025/',
    date: '01.2026',
    kind: 'official',
    metric: 'экспорт товаров 475,04 млрд $, импорт 455,01 млрд $, сальдо +20,03 млрд $, ПИИ 38,42 / 27,62 млрд $, розница 7 008,9 трлн VND, CPI 3,31 %',
    scope: 'проверено отдельным запросом лида 14.09.2026; сайт gso.gov.vn больше не отдаёт данные, рабочий адрес nso.gov.vn'
  },
  vnnPartners: {
    id: 'vnn-partners-2025',
    label: 'Viet Nam News, торговый баланс по партнёрам за 2025',
    url: 'https://vietnamnews.vn/economy/1753208/viet-nam-runs-trade-surplus-of-over-20-billion-in-2025.html',
    date: '01.2026',
    kind: 'official',
    metric: 'экспорт в США 153,2 млрд $, импорт из Китая 186 млрд $, профицит с США 133,9, дефицит с Китаем 115,6, с Кореей 31,6, с АСЕАН 14,2',
    scope: 'перепечатка данных таможни и Нацстатслужбы'
  },
  tradeint: {
    id: 'tradeint-vnm',
    label: 'TradeInt, экспорт Вьетнама по направлениям',
    url: 'https://tradeint.com/insights/vietnam-export-data/',
    date: '2025',
    kind: 'proxy',
    metric: 'Китай 70,45 млрд $, Корея 28,94 млрд $, Япония 26,77 млрд $',
    scope: 'коммерческий агрегатор, не первичный источник; косвенно сходится: 186 минус дефицит 115,6 даёт 70,4'
  },
  vnnElectronics: {
    id: 'vnn-electronics-2025',
    label: 'Viet Nam News, экспорт электроники за 2025',
    url: 'https://vietnamnews.vn/economy/1764334/electronics-exports-surpass-107-billion-in-2025.html',
    date: '2026',
    kind: 'official',
    metric: '107,75 млрд $ всего, в США 42,09 млрд $ (+81,4 %), в Китай 16,89 млрд $',
    scope: 'данные таможни'
  },
  lefaso: {
    id: 'lefaso-footwear',
    label: 'VnEconomy по ассоциации Lefaso, экспорт обуви',
    url: 'https://en.vneconomy.vn/vietnams-footwear-exports-gain-29-bln-in-2025.htm',
    date: '2026',
    kind: 'official',
    metric: 'около 29 млрд $ (+5 %), США 11,01 млрд $, ЕС 6,88 млрд $',
    scope: 'отраслевая ассоциация о своей отрасли'
  },
  moitTextile: {
    id: 'moit-textile-2025',
    label: 'Минпромторг Вьетнама, экспорт текстиля и одежды',
    url: 'https://asemconnectvietnam.gov.vn/default.aspx?ZID1=8&ID1=2&ID8=146457',
    date: '2026',
    kind: 'official',
    metric: 'около 46 млрд $ (+5,8 %), в США 17,8 млрд $',
    scope: ''
  },
  vpWood: {
    id: 'vp-wood-2025',
    label: 'VietnamPlus, рекордный экспорт древесины',
    url: 'https://en.vietnamplus.vn/vietnams-wood-exports-reach-record-17-billion-usd-in-value-post336361.vnp',
    date: '2026',
    kind: 'official',
    metric: 'дерево и изделия 17,2 млрд $, лесная продукция целиком 18,5 млрд $',
    scope: 'данные министерства сельского хозяйства'
  },
  customsCoffee: {
    id: 'customs-coffee-2025',
    label: 'Вьетнамская таможня, рекордный экспорт кофе',
    url: 'https://www.vietnam.vn/en/xuat-khau-ca-phe-viet-nam-dat-ky-luc-8-9-ty-usd-thach-thuc-tu-rao-can-san-pham-tho',
    date: '2026',
    kind: 'official',
    metric: '1,59 млн т на 8,9 млрд $ (+58,8 % по стоимости)',
    scope: 'заголовок источника сам называет ограничение: рекорд достигнут на сырьевом продукте'
  },
  coffeePrice: {
    id: 'coffee-price-2425',
    label: 'VietnamNet, средняя цена экспорта кофе',
    url: 'https://vietnamnet.vn/en/vietnam-s-coffee-exports-hit-record-usd-8-4-billion-in-2025-2456173.html',
    date: '10.2025',
    kind: 'proxy',
    metric: '5 610 $ за тонну (+52,7 %); сезон 10.2024-09.2025, свыше 1,5 млн т на 8,4 млрд $; Европа 47,2 % объёма',
    scope: 'сезонный ряд, с календарным годом не складывается'
  },
  vpFruit: {
    id: 'vp-fruit-2025',
    label: 'VietnamPlus, рекорд экспорта фруктов и овощей',
    url: 'https://en.vietnamplus.vn/vietnams-fruit-vegetable-exports-hit-record-in-2025-post335153.vnp',
    date: '01.2026',
    kind: 'official',
    metric: 'около 8,5 млрд $ всего, дуриан свыше 4 млрд $, в Китай около 5 млрд $ за 11 месяцев',
    scope: ''
  },
  xinhuaDurian: {
    id: 'xinhua-durian-2025',
    label: 'Синьхуа, экспорт дуриана в Китай',
    url: 'https://english.news.cn/asiapacific/20260108/6470ea40fa0947698e09efc32f1f0752/c.html',
    date: '01.2026',
    kind: 'official',
    metric: '885 тыс. т на 3,24 млрд $ за 11 месяцев 2025',
    scope: 'сезонность жёсткая: за первые 4 месяца 2025 экспорт падал до 130 млн $ против 500 млн годом ранее'
  },
  vpRice: {
    id: 'vp-rice-2025',
    label: 'VietnamPlus, экспорт риса',
    url: 'https://en.vietnamplus.vn/vietnam-exports-over-8-million-tonnes-of-rice-earning-41-billion-usd-in-2025-post335754.vnp',
    date: '01.2026',
    kind: 'official',
    metric: '8,06 млн т на 4,1 млрд $',
    scope: ''
  },
  vnnSeafood: {
    id: 'vnn-seafood-2025',
    label: 'Viet Nam News, экспорт морепродуктов',
    url: 'https://vietnamnews.vn/economy/1753208/viet-nam-runs-trade-surplus-of-over-20-billion-in-2025.html',
    date: '01.2026',
    kind: 'official',
    metric: '11,29 млрд $',
    scope: ''
  },
  ustr: {
    id: 'ustr-framework-2025',
    label: 'USTR, рамочное соглашение о торговле с Вьетнамом',
    url: 'https://ustr.gov/about/policy-offices/press-office/fact-sheets/2025/october/fact-sheet-united-states-and-viet-nam-reach-framework-agreement-reciprocal-fair-and-balanced-trade',
    date: '10.2025',
    kind: 'official',
    metric: 'взаимный тариф 20 % сохраняется; товарооборот 123,5 млрд $ по счёту США за 2024',
    scope: 'счёт США и счёт Вьетнама расходятся на десятки миллиардов: разные периметры, сравнивать нельзя'
  },
  vpFdi: {
    id: 'vp-fdi-2025',
    label: 'VietnamPlus, ПИИ по странам-источникам',
    url: 'https://en.vietnamplus.vn/fdi-inflows-into-vietnam-exceed-38-billion-usd-in-2025-post335419.vnp',
    date: '01.2026',
    kind: 'official',
    metric: 'Сингапур 4,84, Китай 3,64, Гонконг 1,73, Япония 1,62, Тайвань 0,97, Корея 0,90 млрд $',
    scope: 'разбивка только по новым регистрациям (17,32 млрд $), а не по всему объёму 38,42 млрд $'
  },
  vpRemit: {
    id: 'vp-remit-2025',
    label: 'VietnamPlus, переводы диаспоры в Хошимин',
    url: 'https://en.vietnamplus.vn/remittances-to-ho-chi-minh-city-exceed-103-billion-usd-in-2025-post336515.vnp',
    date: '2026',
    kind: 'official',
    metric: '10,34 млрд $ (+8,3 %), около 60 % общенационального потока',
    scope: 'по стране за 2025 официального числа нет ни у одного источника; 17,2 млрд $ это расчёт 10,34 / 0,60'
  },
  vpTourism: {
    id: 'vp-tourism-2025',
    label: 'VietnamPlus, рекорд въездного туризма',
    url: 'https://en.vietnamplus.vn/international-arrivals-to-vietnam-hit-new-record-in-2025-up-over-20-post335449.vnp',
    date: '01.2026',
    kind: 'official',
    metric: '21,17 млн прибытий (+20,4 %); Китай 5,3 млн, Россия 690 тыс. (+196,9 %); размещение и питание 843,1 трлн VND (32 млрд $)',
    scope: 'Нацстатслужба даёт 21,17 млн, управление туризма называло 21,5 млн; в домене берём Нацстатслужбу'
  },
  tuoiTreRu: {
    id: 'tuoitre-russians',
    label: 'Tuoi Tre News, поток российских туристов',
    url: 'https://news.tuoitre.vn/vietnam-russia-promote-visa-free-travel-to-boost-two-way-tourism-103260908182021128.htm',
    date: '09.2026',
    kind: 'official',
    metric: 'свыше 1 млн россиян за 8 месяцев 2026 (+165,7 %); безвизовый режим 45 дней с августа 2023',
    scope: 'поток идёт на побережье: Кханьхоа одна забрала 279 тыс. за 8 месяцев 2025'
  },
  sbvCredit: {
    id: 'sbv-credit-2025',
    label: 'Центробанк Вьетнама, итоги кредитования',
    url: 'https://en.vietnamplus.vn/credit-growth-nears-18-in-2025-central-bank-post335108.vnp',
    date: '12.2025',
    kind: 'official',
    metric: 'остаток кредита 18,4 квадриллиона VND (около 670 млрд $), рост 17,87 %',
    scope: 'замер на 24.12.2025; цель регулятора была 16 %, подняли по ходу года'
  },
  budget2025: {
    id: 'vn-budget-2025',
    label: 'VietnamNet, доходы госбюджета за 2025',
    url: 'https://vietnamnet.vn/en/vietnam-s-2025-boom-growth-tops-8-amid-liquidity-pressure-and-credit-surge-2478264.html',
    date: '02.2026',
    kind: 'official',
    metric: '101,3 млрд $ к середине декабря, свыше 30 % сверх плана; розница +8 %',
    scope: 'замер на середину декабря, а не на конец года'
  },
  econSea: {
    id: 'econ-sea-2025',
    label: 'e-Conomy SEA 2025 (Google, Temasek, Bain) в изложении VIR',
    url: 'https://vir.com.vn/vietnams-digital-economy-to-touch-39-billion-in-2025-141430.html',
    date: '11.2025',
    kind: 'analyst',
    metric: 'цифровая экономика 39 млрд $ GMV: торговля 25, медиа 6, транспорт и еда 5, тревел 4',
    scope: 'GMV, а не выручка; методика отчёта своя и с официальной статистикой не совпадает'
  },
  metricEcom: {
    id: 'metric-ecom-2025',
    label: 'Metric.vn, обороты четырёх маркетплейсов',
    url: 'https://en.vneconomy.vn/2025-revenue-for-top-4-e-commerce-giants-estimated-at-165-bln.htm',
    date: '01.2026',
    kind: 'company',
    metric: '429,66 трлн VND (около 16,5 млрд $): Shopee 56,04 %, TikTok Shop 41,31 %, Lazada и Tiki около 2,65 %; продавцов 601,8 тыс. (−7,43 %)',
    scope: 'замер сервиса аналитики о своём рынке; Q&Me за май 2025 - апрель 2026 даёт 13,6 млрд $, периоды разные, не складывать'
  },
  moitEcom: {
    id: 'moit-ecom',
    label: 'Минпромторг и VECOM, размер электронной торговли',
    url: 'https://www.vietnam-briefing.com/news/vietnams-e-commerce-sector-outlook-in-2026.html/',
    date: '2026',
    kind: 'official',
    metric: 'розничная электронная торговля около 31 млрд $ (2025); VECOM считает шире и даёт 38,5 млрд $',
    scope: 'две методики на один рынок; строки друг с другом не складываются'
  },
  itOutsourcing: {
    id: 'vnn-it-outsourcing',
    label: 'Viet Nam News, рынок IT-аутсорсинга',
    url: 'https://vietnamnews.vn/economy/1690004/it-outsourcing-fetchs-nearly-us-700-million.html',
    date: '01.2025',
    kind: 'analyst',
    metric: '698 млн $ в 2025, прогноз 880 млн $ к 2028 при росте 16,38 % в год',
    scope: 'узкий периметр аутсорсинга, а не всей IT-отрасли; зарплата инженера около 1/10 мировой средней'
  },
  aiMarket: {
    id: 'bcompany-ai-vn',
    label: 'B&Company, рынок ИИ Вьетнама и состояние внедрений',
    url: 'https://b-company.jp/vietnam-ai-market-update-to-2025/',
    date: '01.2026',
    kind: 'analyst',
    metric: 'рынок 0,75 млрд $ (2024), прогноз 2,0 млрд $ к 2030; внедрили 73 %, в эксплуатации 13,8 %, со стратегией 36,5 %, без навыков 46,4 %',
    scope: 'сводка аналитической фирмы; 5-е место в АСЕАН по готовности к ИИ по Oxford Insights, балл 54,5'
  },
  misaPrice: {
    id: 'misa-oneai-price',
    label: 'MISA, запуск платформы AMIS OneAI',
    url: 'https://www.vietnam.vn/en/misa-ra-mat-nen-tang-ai-hop-nhat-misa-amis-oneai',
    date: '09.2025',
    kind: 'company',
    metric: '500 тыс. VND в месяц (около 19 $) на организацию без лимита числа мест',
    scope: 'заявление вендора о своём прайсе; это цена доступа к моделям, а не внедрения'
  },
  smeBarrier: {
    id: 'vnn-sme-barrier',
    label: 'VietnamNet, цифровизация малого и среднего бизнеса',
    url: 'https://vietnamnet.vn/en/vietnam-s-smes-risk-falling-behind-in-digital-transformation-race-2436204.html',
    date: '08.2025',
    kind: 'analyst',
    metric: 'свыше 600 тыс. компаний, 97 % всего бизнеса; 68 % называют цену главным барьером; типовой софт 50-200 млн VND в год',
    scope: 'опрос ассоциации малого и среднего бизнеса, выборка не раскрыта'
  },
  aiDevPrice: {
    id: 'seraphim-ai-price',
    label: 'Seraphim, цены на разработку ИИ во Вьетнаме',
    url: 'https://seraphim.vn/pages/vietnam-ai-development',
    date: '2026',
    kind: 'company',
    metric: 'от 10 тыс. $ за простой чат-бот до 100 тыс. $ и выше за корпоративное решение; ставка 25-60 $ в час',
    scope: 'прайс подрядчика о себе, а не замер рынка'
  },
  vamaAuto: {
    id: 'vama-auto-2025',
    label: 'VietnamPlus по ассоциации VAMA, авторынок',
    url: 'https://en.vietnamplus.vn/vietnams-auto-market-surges-24-vinfast-sets-new-record-post332427.vnp',
    date: '11.2025',
    kind: 'company',
    metric: 'члены VAMA 289 331 шт. за 10 месяцев (+9,5 %), VinFast 124 264 шт.',
    scope: 'данные ассоциации о своих членах; рынок целиком около 604 тыс. шт. за год по вторичным сводкам'
  },
  realEstate: {
    id: 'gpg-vn-prices',
    label: 'Global Property Guide и Vietnam Briefing, рынок жилья',
    url: 'https://www.globalpropertyguide.com/asia/vietnam/price-history',
    date: '2026',
    kind: 'analyst',
    metric: 'Ханой около 4 332 $ за м² (рост 22-36 %), Хошимин около 3 752 $ (+8,8 %); ПИИ в недвижимость 3,67 млрд $',
    scope: 'первичный рынок застройщиков, а не сделки целиком'
  },
  expats: {
    id: 'vn-expats-proxy',
    label: 'Сводка по числу иностранцев во Вьетнаме',
    url: 'https://www.myvietnamvisa.com/living-in-vietnam-a-guide-to-moving-to-vietnam-as-an-expat.html',
    date: '2025',
    kind: 'proxy',
    metric: '83,5-100 тыс. иностранцев, 0,08-0,1 % населения',
    scope: 'вилка из вторичной сводки, первичный реестр не назван'
  },
  expatServices: {
    id: 'vn-expat-services-price',
    label: 'Viet An Law и Tân Văn Lang, цены на регистрацию и разрешение на работу',
    url: 'https://vietanlaw.com/cost-of-company-registration/',
    date: '2026',
    kind: 'company',
    metric: 'регистрация компании с иностранным участием 1 000-3 000 $ услуг при госпошлине около 4 $; разрешение на работу 4,23-9 млн VND',
    scope: 'прайсы юридических агентств о себе'
  },

  // ─── Региональные источники ────────────────────────────────────────────────

  merger: {
    id: 'ld-merger-202-2025',
    label: 'Резолюция 202/2025/QH15 о слиянии провинций',
    url: 'https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-202-2025-qh15-ve-sap-xep-don-vi-hanh-chinh-cap-tinh-119250612174148722.htm',
    date: '12.06.2025',
    kind: 'official',
    metric: 'Đắk Nông, Bình Thuận и Lâm Đồng объединены в Lâm Đồng с центром в Đà Lạt, работа с 01.07.2025',
    scope: 'принята 96,44 % голосов; новая провинция крупнейшая в стране'
  },
  mergerSize: {
    id: 'ld-merger-size',
    label: 'Справочник по новой Lâm Đồng: площадь, население, коммуны',
    url: 'https://thuvienphapluat.vn/phap-luat/ho-tro-phap-luat/bang-tra-cuu-day-du-124-xa-phuong-moi-tinh-lam-dong-sau-sap-nhap-chi-tiet-day-du-danh-sach-xa-phuon-159611-223978.html',
    date: '2025',
    kind: 'official',
    metric: '24 233,07 км², 3 872 999 человек, 124 единицы низового уровня',
    scope: 'старая Lâm Đồng была 9 781,20 км² и 1 595 597 человек'
  },
  ldGrdp: {
    id: 'ld-grdp-2025',
    label: 'Статуправление Lâm Đồng, итоги GRDP за 2025',
    url: 'https://thongkelamdong.nso.gov.vn/tin-tuc/10052',
    date: '01.2026',
    kind: 'official',
    metric: 'рост GRDP 6,42 %; на душу 105,24 млн VND (4 047,6 $), +12,7 %; производительность 186,02 млн VND',
    scope: 'объединённый периметр; проверено отдельным запросом лида 14.09.2026; абсолютного GRDP в деньгах источник не печатает'
  },
  ldSocio: {
    id: 'ld-socio-2025',
    label: 'Статуправление Lâm Đồng, социально-экономические итоги 2025',
    url: 'https://thongkelamdong.nso.gov.vn/tin-tuc/10051',
    date: '01.2026',
    kind: 'official',
    metric: 'структура 38,59 / 20,87 / 35,83 %; бюджет 31 319 млрд VND; кофе 328 650 га и 1 028 393 т; туризм 20 733,1 тыс. визитов и 56 610,6 млрд VND',
    scope: 'объединённый периметр; проверено отдельным запросом лида 14.09.2026'
  },
  ldCoffeeShare: {
    id: 'ld-coffee-share',
    label: 'VietnamPlus, доля Lâm Đồng в кофе страны',
    url: 'https://www.vietnamplus.vn/khong-gian-gia-tri-quoc-gia-cho-caphe-viet-nam-post1088545.vnp',
    date: '2025',
    kind: 'official',
    metric: '44 % площади и 48,3 % урожая кофе Вьетнама',
    scope: 'сезон 2024-25, объединённый периметр; первое место в стране'
  },
  ldFlowers: {
    id: 'ld-flowers',
    label: 'Nhân Dân, цветоводство Đà Lạt',
    url: 'https://nhandan.vn/tao-chuoi-gia-tri-cao-cho-nganh-hoa-da-lat-post858798.html',
    date: '2024',
    kind: 'official',
    metric: 'около 10 800 га, свыше 4,4 млрд стеблей в год, экспорт 494 млн стеблей (11,2 %) в 23 страны',
    scope: 'старый периметр; выручку экспорта в долларах источник не даёт, есть только цель 217 млн $ к 2030'
  },
  ldSilk: {
    id: 'ld-silk',
    label: 'Báo Lâm Đồng, шелководство провинции',
    url: 'https://baolamdong.vn/kinh-te/202505/khi-cay-dau-tam-tang-ca-3-tieu-chi-a231387/',
    date: '05.2025',
    kind: 'official',
    metric: '70 % площади шелковицы и 80 % коконов страны; экспорт около 180 млн $ в год, второе место после кофе',
    scope: 'старый периметр'
  },
  ldTourismRev: {
    id: 'ld-tourism-rev-2025',
    label: 'SGGP, выручка от туризма Lâm Đồng за 2025',
    url: 'https://www.sggp.org.vn/lam-dong-doanh-thu-tu-du-lich-nam-2025-hon-56000-ty-dong-post832252.html',
    date: '01.2026',
    kind: 'official',
    metric: '56 610,6 млрд VND: размещение 11 007,3, питание 45 599, турагентства 648,3; цель 2026 свыше 25 млн визитов',
    scope: 'объединённый периметр, но сам источник слияния не оговаривает'
  },
  ldTourism2024: {
    id: 'ld-tourism-2024',
    label: 'VietnamPlus, десятимиллионный турист Lâm Đồng в 2024',
    url: 'https://www.vietnamplus.vn/lam-dong-chao-don-khach-du-lich-thu-10-trieu-trong-nam-2024-post1004935.vnp',
    date: '12.2024',
    kind: 'official',
    metric: '10 млн визитов, 600 тыс. иностранцев (+50 %), выручка около 18 000 млрд VND; 3 070 средств размещения на 43 684 номера',
    scope: 'старый периметр: с числами 2025 по объединённой провинции не сравнивается'
  },
  ldAirport: {
    id: 'ld-lienkhuong',
    label: 'Dân Trí, аэропорт Liên Khương закрывается на полгода',
    url: 'https://dantri.com.vn/thoi-su/san-bay-lien-khuong-dong-cua-6-thang-du-lich-da-lat-tim-huong-thich-nghi-20260305082255291.htm',
    date: '03.2026',
    kind: 'official',
    metric: 'свыше 12 млн пассажиров за 2020-2025, пик около 3 млн в год выше проектной мощности; ремонт 04.03-25.08.2026 за 1 032 млрд VND',
    scope: 'международный статус с июня 2024, первый в Тэйнгуен; расширение до 5 млн пассажиров запланировано к 2030'
  },
  ldHighway: {
    id: 'ld-highway-tanphu',
    label: 'Tuổi Trẻ и Báo Lâm Đồng, скоростная дорога Tân Phú - Bảo Lộc',
    url: 'https://tuoitre.vn/khoi-cong-cao-toc-tan-phu-bao-loc-vao-ngay-19-12-2025121611303771.htm',
    date: '12.2025',
    kind: 'official',
    metric: 'около 66 км, свыше 18 000 млрд VND, старт 19.12.2025, срок 25 месяцев; участок Bảo Lộc - Liên Khương 73,62 км за 19 521 млрд VND',
    scope: 'через 4 месяца после старта работы не начались, передано 27 % площадки: объявленные сроки и площадка расходятся'
  },
  ldLand: {
    id: 'ld-land-prices',
    label: 'VnEconomy, таблица цен на землю Народного комитета Lâm Đồng',
    url: 'https://vneconomy.vn/lam-dong-gia-dat-o-do-thi-tai-huyen-duc-trong-va-da-lat-duoc-dieu-chinh-cao-nhat.htm',
    date: '2024',
    kind: 'official',
    metric: 'Đà Lạt до 72,8 млн VND за м², Đức Trọng до 72 млн, Lâm Hà до 21,6 млн',
    scope: 'государственная таблица для расчёта налогов и компенсаций, а не рыночные сделки; действовала до 31.12.2025, новой не найдено'
  },
  ldLandMarket: {
    id: 'ld-land-market',
    label: 'Smartland, обзор рынка недвижимости Đà Lạt',
    url: 'https://smartland.vn/phan-tich-thi-truong-bat-dong-san-da-lat-2025/',
    date: '2025',
    kind: 'proxy',
    metric: 'в среднем 45 млн VND за м², центральные улицы 260-540 млн',
    scope: 'данные брокера о своём рынке, независимой проверки нет'
  },
  nomadsDalat: {
    id: 'nomads-dalat',
    label: 'Nomads.com, стоимость жизни в Đà Lạt',
    url: 'https://nomads.com/cost-of-living/in/da-lat',
    date: '09.2026',
    kind: 'proxy',
    metric: 'однокомнатная в центре 285 $, экспат 934 $ в месяц, место в коворкинге 107 $, интернет 10 Мбит/с',
    scope: 'краудсорсинг сервиса для цифровых кочевников; в самом Đà Lạt коворкингов практически нет'
  },
  nsoRegions: {
    id: 'nso-regions-2025',
    label: 'Нацстатслужба, рост GRDP 34 провинций за 2025',
    url: 'https://www.nso.gov.vn/tin-tuc-thong-ke/2026/01/thong-cao-bao-chi-ve-ket-qua-tang-truong-tong-san-pham-tren-dia-ban-grdp-cua-34-tinh-thanh-pho-nam-2025/',
    date: '01.2026',
    kind: 'official',
    metric: 'макрорегион Nam Trung Bộ и Tây Nguyên вырос на 7,74 % и дал 9,56 % общего роста; провинции на сырьевом экспорте и добыче страдают от мировых цен',
    scope: 'отдельной строки по Lâm Đồng релиз не содержит, проверено лидом'
  },
  ld2024: {
    id: 'ld-grdp-2024',
    label: 'SGGP, GRDP Lâm Đồng за 2024',
    url: 'https://www.sggp.org.vn/grdp-nam-2024-cua-lam-dong-xep-thu-61-ca-nuoc-post776583.html',
    date: '12.2024',
    kind: 'official',
    metric: 'рост 4,02 %, 61-е место из 63; доходы бюджета 13 175,3 млрд VND (93,1 % плана), расходы 15 442,2',
    scope: 'старый периметр и старое деление страны на 63 провинции'
  }
};

// ─── Узлы домена ──────────────────────────────────────────────────────────────

export const VIETNAM_NODES: EcoNode[] = [
  // Уровень страны
  {
    id: 'vn',
    name: 'Вьетнам',
    kind: 'country',
    value: '$514,7 млрд ВВП',
    valueNum: 514.7,
    description: 'Сборочный цех региона: экспорт почти равен ВВП, три четверти его делают иностранные компании.',
    facts: [
      'ВВП 514,70 млрд $, рост 8,02 % (2025)',
      'Экспорт товаров 475,04 млрд $, импорт 455,01 млрд $, сальдо +20,03 млрд $',
      'Экспорт иностранного сектора 367,09 млрд $, это 77,3 % всего экспорта',
      'Население 101,60 млн, ВВП на душу 5 066 $',
      'Инфляция 3,31 %, доходы бюджета 101,3 млрд $ к середине декабря'
    ],
    related: ['vn_us', 'vn_cn', 'vn_lamdong', 'vn_services', 'vn_agro', 'vn_industry'],
    tags: ['вьетнам', 'vietnam'],
    evidence: [VN_EVIDENCE.wbGdp, VN_EVIDENCE.nsoPress, VN_EVIDENCE.wbTrade, VN_EVIDENCE.budget2025],
    domain: 'vietnam'
  },
  {
    id: 'vn_lamdong',
    name: 'Провинция Lâm Đồng',
    kind: 'country',
    value: '+6,42 % GRDP',
    valueNum: 15.5,
    description: 'Крупнейшая провинция страны после слияния трёх. Растёт медленнее Вьетнама, потому что продаёт сырьё.',
    facts: [
      'Рост GRDP 6,42 % против 8,02 % по стране (2025)',
      'Структура: сельское хозяйство 38,59 %, промышленность 20,87 %, услуги 35,83 %',
      'GRDP на душу 105,24 млн VND (4 047,6 $), это 80 % от среднего по стране',
      'Расчётный GRDP около 407,6 трлн VND (15,5 млрд $): абсолютного числа не печатает никто',
      'Площадь 24 233,07 км², население 3 872 999 человек',
      'Доходы бюджета 31 319 млрд VND, 110,86 % плана'
    ],
    related: ['vn', 'vn_ld_coffee', 'vn_ld_tourism', 'vn_ld_budget', 'vn_ld_flowers', 'vn_ld_land'],
    tags: ['lam dong', 'лам донг', 'далат', 'da lat'],
    evidence: [VN_EVIDENCE.ldGrdp, VN_EVIDENCE.ldSocio, VN_EVIDENCE.merger, VN_EVIDENCE.mergerSize, VN_EVIDENCE.nsoRegions],
    domain: 'vietnam'
  },

  // Партнёры
  {
    id: 'vn_us',
    name: 'США как рынок сбыта',
    kind: 'country',
    value: '$153,2 млрд экспорта',
    valueNum: 153.2,
    description: 'Крупнейший покупатель. Оплачивает почти весь дефицит Вьетнама перед Китаем и Кореей.',
    facts: [
      'Экспорт Вьетнама в США 153,2 млрд $ (+28,1 %)',
      'Профицит Вьетнама с США 133,9 млрд $ (+28,2 %)',
      'Взаимный тариф 20 % сохранён рамочным соглашением октября 2025',
      'По счёту США это третий по величине товарный дефицит страны'
    ],
    related: ['vn', 'vn_electronics', 'vn_textiles', 'vn_footwear'],
    tags: ['сша', 'тарифы'],
    evidence: [VN_EVIDENCE.vnnPartners, VN_EVIDENCE.ustr],
    domain: 'vietnam'
  },
  {
    id: 'vn_cn',
    name: 'Китай как поставщик',
    kind: 'country',
    value: '$186 млрд импорта',
    valueNum: 186,
    description: 'Источник комплектующих и покупатель фруктов. Дефицит с ним растёт быстрее профицита с США.',
    facts: [
      'Импорт из Китая 186,0 млрд $, крупнейший источник',
      'Дефицит с Китаем 115,6 млрд $ (+39,6 %)',
      'Экспорт в Китай около 70,45 млрд $, товарооборот 256,4 млрд $',
      'Китай забирает дуриан на 3,24 млрд $ и фрукты-овощи почти на 5 млрд $'
    ],
    related: ['vn', 'vn_electronics', 'vn_durian', 'vn_fruitveg'],
    tags: ['китай'],
    evidence: [VN_EVIDENCE.vnnPartners, VN_EVIDENCE.tradeint, VN_EVIDENCE.xinhuaDurian],
    domain: 'vietnam'
  },
  {
    id: 'vn_eu',
    name: 'Евросоюз как рынок',
    kind: 'country',
    value: '$56 млрд экспорта',
    valueNum: 56,
    description: 'Второй платёжеспособный рынок и главный покупатель вьетнамского кофе.',
    facts: [
      'Экспорт в ЕС свыше 56 млрд $ (+8,6 %), товарооборот 73,8 млрд $',
      'Профицит с ЕС 38,6 млрд $ (+10,1 %)',
      'Европа забирает 47,2 % объёма кофе и 46,7 % его стоимости',
      'Обувь в ЕС 6,88 млрд $'
    ],
    related: ['vn', 'vn_coffee', 'vn_footwear'],
    tags: ['ес', 'европа'],
    evidence: [VN_EVIDENCE.vnnPartners, VN_EVIDENCE.coffeePrice, VN_EVIDENCE.lefaso],
    domain: 'vietnam'
  },
  {
    id: 'vn_kr',
    name: 'Южная Корея',
    kind: 'country',
    value: 'дефицит $31,6 млрд',
    valueNum: 31.6,
    description: 'Второй после Китая источник дефицита и крупный инвестор через заводы Samsung.',
    facts: [
      'Дефицит Вьетнама с Кореей 31,6 млрд $ (+4,3 %)',
      'Экспорт в Корею около 28,94 млрд $',
      'Новые ПИИ из Кореи 0,90 млрд $ (5,2 % новых регистраций)',
      'Импорта из Кореи официальным числом нет: расчёт около 60,5 млрд $'
    ],
    related: ['vn', 'vn_fdi', 'vn_electronics'],
    tags: ['корея'],
    evidence: [VN_EVIDENCE.vnnPartners, VN_EVIDENCE.tradeint, VN_EVIDENCE.vpFdi],
    domain: 'vietnam'
  },
  {
    id: 'vn_jp',
    name: 'Япония',
    kind: 'country',
    value: '$26,8 млрд экспорта',
    valueNum: 26.8,
    description: 'Ровный партнёр без перекоса: профицит символический и сжимается.',
    facts: [
      'Экспорт в Японию около 26,77 млрд $',
      'Профицит с Японией 2,1 млрд $ (−30,1 %)',
      'Новые ПИИ из Японии 1,62 млрд $ (9,4 %)',
      'Турпоток из Японии вырос на 14,4 %'
    ],
    related: ['vn', 'vn_fdi', 'vn_tourism'],
    tags: ['япония'],
    evidence: [VN_EVIDENCE.tradeint, VN_EVIDENCE.vnnPartners, VN_EVIDENCE.vpFdi],
    domain: 'vietnam'
  },
  {
    id: 'vn_asean',
    name: 'АСЕАН',
    kind: 'country',
    value: 'дефицит $14,2 млрд',
    valueNum: 14.2,
    description: 'Соседи, у которых Вьетнам покупает больше, чем продаёт, и разрыв растёт быстрее всех.',
    facts: [
      'Дефицит с АСЕАН 14,2 млрд $ (+42,4 %), самый быстрый рост среди направлений',
      'Экспорта в АСЕАН отдельным числом не публикует никто'
    ],
    related: ['vn'],
    tags: ['асеан'],
    evidence: [VN_EVIDENCE.vnnPartners],
    domain: 'vietnam'
  },
  {
    id: 'vn_sg',
    name: 'Сингапур как инвестор',
    kind: 'country',
    value: '$4,84 млрд новых ПИИ',
    valueNum: 4.84,
    description: 'Первый источник новых инвестиций, во многом транзитная юрисдикция для капитала.',
    facts: [
      'Новые ПИИ 4,84 млрд $, это 27,9 % новых регистраций',
      'База разбивки 17,32 млрд $ новых проектов, а не весь объём 38,42 млрд $'
    ],
    related: ['vn', 'vn_fdi'],
    tags: ['сингапур'],
    evidence: [VN_EVIDENCE.vpFdi],
    domain: 'vietnam'
  },
  {
    id: 'vn_hktw',
    name: 'Гонконг и Тайвань',
    kind: 'country',
    value: '$2,7 млрд новых ПИИ',
    valueNum: 2.7,
    description: 'Две юрисдикции, через которые в страну заходит китайский по происхождению капитал.',
    facts: [
      'Гонконг 1,73 млрд $ (10 %), Тайвань 0,97 млрд $ (5,6 %)',
      'Вместе с материковым Китаем это 36,6 % новых регистраций'
    ],
    related: ['vn', 'vn_fdi', 'vn_cn'],
    tags: ['гонконг', 'тайвань'],
    evidence: [VN_EVIDENCE.vpFdi],
    domain: 'vietnam'
  },

  // Секторы страны
  {
    id: 'vn_agro',
    name: 'Сельское хозяйство Вьетнама',
    kind: 'sector',
    value: '11,64 % добавленной стоимости',
    valueNum: 11.64,
    description: 'Малая доля в экономике страны и главная опора её отдельных провинций.',
    facts: [
      'Доля в добавленной стоимости 11,64 % (2025)',
      'В Lâm Đồng та же отрасль занимает 38,59 % экономики',
      'Экспорт: кофе 8,9, фрукты-овощи 8,5, морепродукты 11,29, рис 4,1 млрд $'
    ],
    related: ['vn', 'vn_coffee', 'vn_durian', 'vn_rice', 'vn_seafood', 'vn_lamdong'],
    tags: ['сельское хозяйство'],
    evidence: [VN_EVIDENCE.wbGrowth, VN_EVIDENCE.vpFruit, VN_EVIDENCE.customsCoffee],
    domain: 'vietnam'
  },
  {
    id: 'vn_industry',
    name: 'Промышленность Вьетнама',
    kind: 'sector',
    value: '37,65 % добавленной стоимости',
    valueNum: 37.65,
    description: 'Сборка чужих компонентов в чужие бренды: 88,7 % экспорта это продукция переработки.',
    facts: [
      'Доля в добавленной стоимости 37,65 % (2025)',
      'Продукция переработки 421,47 млрд $, это 88,7 % экспорта',
      'Новые ПИИ в обработку 9,8 млрд $, 56,5 % новых регистраций'
    ],
    related: ['vn', 'vn_electronics', 'vn_textiles', 'vn_footwear', 'vn_wood', 'vn_fdi'],
    tags: ['промышленность'],
    evidence: [VN_EVIDENCE.wbGrowth, VN_EVIDENCE.vnnPartners, VN_EVIDENCE.vpFdi],
    domain: 'vietnam'
  },
  {
    id: 'vn_services',
    name: 'Услуги Вьетнама',
    kind: 'sector',
    value: '42,74 % добавленной стоимости',
    valueNum: 42.74,
    description: 'Крупнейший сектор страны: туризм, торговля, финансы, разработка.',
    facts: [
      'Доля в добавленной стоимости 42,74 % (2025)',
      'Розничный товарооборот и услуги 7 008,9 трлн VND (+9,2 %)',
      'В Lâm Đồng услуги растут быстрее всего: +8,28 % против +5,10 % у сельского хозяйства'
    ],
    related: ['vn', 'vn_tourism', 'vn_ecom', 'vn_it', 'vn_banking'],
    tags: ['услуги'],
    evidence: [VN_EVIDENCE.wbGrowth, VN_EVIDENCE.nsoPress, VN_EVIDENCE.ldSocio],
    domain: 'vietnam'
  },
  {
    id: 'vn_tourism',
    name: 'Туризм Вьетнама',
    kind: 'service',
    value: '21,17 млн прибытий',
    valueNum: 32,
    description: 'Рекордный въезд и рекордная зависимость от двух-трёх рынков.',
    facts: [
      'Международные прибытия 21,17 млн (+20,4 %), выше уровня 2019 на 17,8 %',
      'Размещение и питание 843,1 трлн VND (32 млрд $), турагентства 93,9 трлн VND',
      'Китай 5,3 млн (около 25 %), Корея на втором месте с падением 5,2 %',
      'Россия 690 тыс. (+196,9 %), крупнейший европейский рынок'
    ],
    related: ['vn', 'vn_services', 'vn_ld_tourism', 'vn_m_ru_tourism'],
    tags: ['туризм'],
    evidence: [VN_EVIDENCE.vpTourism, VN_EVIDENCE.tuoiTreRu],
    domain: 'vietnam'
  },
  {
    id: 'vn_ecom',
    name: 'Электронная торговля',
    kind: 'service',
    value: '~$31 млрд розницы',
    valueNum: 31,
    description: 'Дуополия Shopee и TikTok Shop: рынок растёт, а продавцов становится меньше.',
    facts: [
      'Розничная электронная торговля около 31 млрд $ (2025), по VECOM 38,5 млрд $',
      'Обороты четырёх площадок 429,66 трлн VND (около 16,5 млрд $), +34,75 %',
      'Shopee 56,04 %, TikTok Shop 41,31 %, Lazada и Tiki вместе около 2,65 %',
      'Активных продавцов 601,8 тыс., минус 7,43 % за год'
    ],
    related: ['vn', 'vn_services', 'vn_m_ai_smb'],
    tags: ['e-commerce', 'shopee', 'tiktok'],
    evidence: [VN_EVIDENCE.moitEcom, VN_EVIDENCE.metricEcom, VN_EVIDENCE.econSea],
    domain: 'vietnam'
  },
  {
    id: 'vn_it',
    name: 'IT-отрасль Вьетнама',
    kind: 'service',
    value: '$698 млн аутсорсинга',
    valueNum: 0.698,
    description: 'Дешёвые руки для чужих задач: ставка инженера около десятой доли мировой средней.',
    facts: [
      'Рынок IT-аутсорсинга 698 млн $ (2025), прогноз 880 млн $ к 2028',
      'Ставка разработчика ИИ 25-60 $ в час, на 30-50 % ниже западной',
      'Цифровая экономика целиком 39 млрд $ GMV'
    ],
    related: ['vn', 'vn_ai', 'vn_services', 'vn_m_ai_smb'],
    tags: ['it', 'аутсорсинг'],
    evidence: [VN_EVIDENCE.itOutsourcing, VN_EVIDENCE.aiDevPrice, VN_EVIDENCE.econSea],
    domain: 'vietnam'
  },
  {
    id: 'vn_ai',
    name: 'Рынок ИИ Вьетнама',
    kind: 'tech',
    value: '$0,75 млрд (2024)',
    valueNum: 0.75,
    description: 'Внедрили почти все, работает у одной седьмой. Разрыв и есть рынок.',
    facts: [
      'Рынок 0,75 млрд $ (2024), прогноз 2,0 млрд $ к 2030',
      'Внедрили ИИ хоть как-то 73 % компаний, довели до эксплуатации 13,8 %',
      'Описанная стратегия есть у 36,5 %, своих навыков нет у 46,4 %',
      '5-е место в АСЕАН по готовности к ИИ, балл 54,5'
    ],
    related: ['vn', 'vn_it', 'vn_m_ai_smb'],
    tags: ['ии', 'ai'],
    evidence: [VN_EVIDENCE.aiMarket],
    domain: 'vietnam'
  },
  {
    id: 'vn_banking',
    name: 'Банковский кредит',
    kind: 'sector',
    value: '~$670 млрд остатка',
    valueNum: 670,
    description: 'Кредит растёт вдвое быстрее ВВП: экономику разгоняют займами.',
    facts: [
      'Остаток кредита 18,4 квадриллиона VND, около 670 млрд $ (24.12.2025)',
      'Рост 17,87 % при цели регулятора 16 %',
      'Депозиты выросли только на 14 %: разрыв покрывают ликвидностью'
    ],
    related: ['vn', 'vn_services', 'vn_realestate'],
    tags: ['кредит', 'банки'],
    evidence: [VN_EVIDENCE.sbvCredit, VN_EVIDENCE.budget2025],
    domain: 'vietnam'
  },
  {
    id: 'vn_fdi',
    name: 'Прямые иностранные инвестиции',
    kind: 'sector',
    value: '$27,6 млрд реализовано',
    valueNum: 27.62,
    description: 'Реализованные ПИИ на максимуме за пять лет, а зарегистрированные почти не растут.',
    facts: [
      'Зарегистрировано 38,42 млрд $ (+0,5 %), реализовано 27,62 млрд $ (+9,0 %)',
      'Новых проектов на 17,32 млрд $, обработка забирает 56,5 %',
      'Недвижимость 3,67 млрд $, около 21 % новой регистрации',
      'Разбивку по странам публикуют только по новым проектам'
    ],
    related: ['vn', 'vn_sg', 'vn_cn', 'vn_hktw', 'vn_kr', 'vn_jp', 'vn_realestate'],
    tags: ['пии', 'fdi'],
    evidence: [VN_EVIDENCE.nsoPress, VN_EVIDENCE.vpFdi, VN_EVIDENCE.realEstate],
    domain: 'vietnam'
  },
  {
    id: 'vn_remit',
    name: 'Переводы диаспоры',
    kind: 'sector',
    value: '~$17,2 млрд (оценка)',
    valueNum: 17.2,
    description: 'Поток размером с две трети реализованных ПИИ, который не считает ни один официальный ряд по стране.',
    facts: [
      'Хошимин 10,34 млрд $ (+8,3 %), около 60 % общенационального потока',
      'По стране за 2025 официального числа нет: 17,2 млрд $ это расчёт 10,34 / 0,60',
      'За 2024 вице-премьер называл около 16 млрд $',
      'В World Bank API индикатор переводов по Вьетнаму пустой'
    ],
    related: ['vn', 'vn_banking', 'vn_realestate'],
    tags: ['переводы', 'диаспора'],
    evidence: [VN_EVIDENCE.vpRemit, VN_EVIDENCE.wbGdp],
    domain: 'vietnam'
  },
  {
    id: 'vn_realestate',
    name: 'Недвижимость Вьетнама',
    kind: 'sector',
    value: '~$4 332 за м² в Ханое',
    valueNum: 4.332,
    description: 'Два рынка в одной стране: Ханой разогнался, Хошимин стоит.',
    facts: [
      'Ханой около 4 332 $ за м² на первичке, рост 22-36 % за год',
      'Хошимин около 3 752 $ за м², рост 8,8 %',
      'ПИИ в недвижимость 3,67 млрд $, второй сектор после обработки'
    ],
    related: ['vn', 'vn_fdi', 'vn_banking', 'vn_ld_land'],
    tags: ['недвижимость'],
    evidence: [VN_EVIDENCE.realEstate],
    domain: 'vietnam'
  },
  {
    id: 'vn_autos',
    name: 'Автомобили и мотоциклы',
    kind: 'product',
    value: '~604 тыс. авто за год',
    valueNum: 0.604,
    description: 'Автомобиль остаётся роскошью: мотоциклов продают впятеро больше.',
    facts: [
      'Члены VAMA 289 331 шт. за 10 месяцев 2025 (+9,5 %)',
      'VinFast 124 264 шт. за те же 10 месяцев, рекорд для вьетнамского производителя',
      'Рынок целиком около 604 тыс. шт. за год по вторичным сводкам',
      'Мотоциклов свыше 3 млн шт. в год'
    ],
    related: ['vn', 'vn_industry', 'vn_services'],
    tags: ['авто', 'vinfast'],
    evidence: [VN_EVIDENCE.vamaAuto],
    domain: 'vietnam'
  },

  // Товарные группы
  {
    id: 'vn_electronics',
    name: 'Электроника и телефоны',
    kind: 'product',
    value: '$107,75 млрд экспорта',
    valueNum: 107.75,
    description: 'Главная статья экспорта и главный канал зависимости от китайских компонентов.',
    facts: [
      'Компьютеры, электроника и компоненты 107,75 млрд $',
      'В США 42,09 млрд $ (+81,4 %), в Китай 16,89 млрд $ (+33,6 %)',
      'Телефоны и компоненты 52,6 млрд $ за 11 месяцев',
      'Машины и оборудование около 53,4 млрд $ за 11 месяцев'
    ],
    related: ['vn', 'vn_us', 'vn_cn', 'vn_industry', 'vn_kr'],
    tags: ['электроника'],
    evidence: [VN_EVIDENCE.vnnElectronics],
    domain: 'vietnam'
  },
  {
    id: 'vn_textiles',
    name: 'Текстиль и одежда',
    kind: 'product',
    value: '~$46 млрд экспорта',
    valueNum: 46,
    description: 'Вторая опора экспорта и первая по числу занятых.',
    facts: ['Экспорт около 46 млрд $ (+5,8 %)', 'В США 17,8 млрд $ (+10,7 %)'],
    related: ['vn', 'vn_us', 'vn_industry'],
    tags: ['текстиль'],
    evidence: [VN_EVIDENCE.moitTextile],
    domain: 'vietnam'
  },
  {
    id: 'vn_footwear',
    name: 'Обувь и кожгалантерея',
    kind: 'product',
    value: '~$29 млрд экспорта',
    valueNum: 29,
    description: 'Отрасль, для которой тариф США в 20 % значит больше, чем для электроники.',
    facts: ['Экспорт около 29 млрд $ (+5 %)', 'США 11,01 млрд $, ЕС 6,88 млрд $'],
    related: ['vn', 'vn_us', 'vn_eu', 'vn_industry'],
    tags: ['обувь', 'кожа'],
    evidence: [VN_EVIDENCE.lefaso],
    domain: 'vietnam'
  },
  {
    id: 'vn_wood',
    name: 'Дерево и мебель',
    kind: 'product',
    value: '$17,2 млрд экспорта',
    valueNum: 17.2,
    description: 'Единственная крупная статья, где Вьетнам продаёт готовое изделие, а не сборку.',
    facts: [
      'Дерево и изделия 17,2 млрд $ (+6 %)',
      'Лесная продукция целиком 18,5 млрд $ (+6,6 %)'
    ],
    related: ['vn', 'vn_us', 'vn_industry'],
    tags: ['мебель', 'дерево'],
    evidence: [VN_EVIDENCE.vpWood],
    domain: 'vietnam'
  },
  {
    id: 'vn_coffee',
    name: 'Кофе Вьетнама',
    kind: 'product',
    value: '$8,9 млрд экспорта',
    valueNum: 8.9,
    description: 'Рекорд, поставленный ценой, а не объёмом: сырьё по мировому прайсу.',
    facts: [
      'Экспорт 1,59 млн т на 8,9 млрд $ (+58,8 % по стоимости)',
      'Средняя цена 5 610 $ за тонну (+52,7 %) в сезон 2024-25',
      'Европа берёт 47,2 % объёма и 46,7 % стоимости',
      'Заголовок таможни называет ограничение прямо: барьер сырьевого продукта'
    ],
    related: ['vn', 'vn_eu', 'vn_agro', 'vn_ld_coffee', 'vn_m_agroexport'],
    tags: ['кофе'],
    evidence: [VN_EVIDENCE.customsCoffee, VN_EVIDENCE.coffeePrice],
    domain: 'vietnam'
  },
  {
    id: 'vn_durian',
    name: 'Дуриан',
    kind: 'product',
    value: '>$4 млрд экспорта',
    valueNum: 4,
    description: 'Половина фруктового экспорта страны и одна кнопка отключения в руках Китая.',
    facts: [
      'Экспорт свыше 4 млрд $, почти половина всего фруктового экспорта',
      'В Китай 885 тыс. т на 3,24 млрд $ за 11 месяцев',
      'За первые 4 месяца 2025 экспорт падал до 130 млн $ против 500 млн годом ранее',
      'В Lâm Đồng 44 283,5 га и 290 266 т (+11,34 %)'
    ],
    related: ['vn', 'vn_cn', 'vn_agro', 'vn_fruitveg', 'vn_ld_durian'],
    tags: ['дуриан'],
    evidence: [VN_EVIDENCE.vpFruit, VN_EVIDENCE.xinhuaDurian, VN_EVIDENCE.ldSocio],
    domain: 'vietnam'
  },
  {
    id: 'vn_fruitveg',
    name: 'Фрукты и овощи',
    kind: 'product',
    value: '~$8,5 млрд экспорта',
    valueNum: 8.5,
    description: 'Группа, в которой один товар и один покупатель решают всё.',
    facts: [
      'Экспорт около 8,5 млрд $ за год',
      'В Китай около 5 млрд $ за 11 месяцев (+15 %)',
      'Дуриан один даёт свыше 4 млрд $ из 8,5'
    ],
    related: ['vn', 'vn_cn', 'vn_durian', 'vn_agro', 'vn_ld_veg'],
    tags: ['фрукты', 'овощи'],
    evidence: [VN_EVIDENCE.vpFruit],
    domain: 'vietnam'
  },
  {
    id: 'vn_seafood',
    name: 'Морепродукты',
    kind: 'product',
    value: '$11,29 млрд экспорта',
    valueNum: 11.29,
    description: 'Крупнейшая по деньгам статья агроэкспорта, больше кофе и риса.',
    facts: ['Экспорт 11,29 млрд $'],
    related: ['vn', 'vn_agro'],
    tags: ['морепродукты'],
    evidence: [VN_EVIDENCE.vnnSeafood],
    domain: 'vietnam'
  },
  {
    id: 'vn_rice',
    name: 'Рис',
    kind: 'product',
    value: '$4,1 млрд экспорта',
    valueNum: 4.1,
    description: 'Восемь миллионов тонн по цене около 509 $ за тонну: объём есть, наценки нет.',
    facts: ['Экспорт 8,06 млн т на 4,1 млрд $'],
    related: ['vn', 'vn_agro'],
    tags: ['рис'],
    evidence: [VN_EVIDENCE.vpRice],
    domain: 'vietnam'
  },

  // Регион
  {
    id: 'vn_ld_coffee',
    name: 'Кофе Lâm Đồng',
    kind: 'product',
    value: '1,03 млн т урожая',
    valueNum: 1.03,
    description: 'Почти половина кофе страны растёт здесь, а цену назначают в Лондоне и Нью-Йорке.',
    facts: [
      'Площадь 328 650 га (+1,03 %), урожай 1 028 393 т (+5,57 %)',
      'Это 44 % площади и 48,3 % урожая кофе Вьетнама, первое место в стране',
      'Арабика Cầu Đạt около Đà Lạt это примерно 3 % производства страны',
      'Периметр объединённой провинции: числа 2025 уже включают Đắk Nông'
    ],
    related: ['vn_lamdong', 'vn_coffee', 'vn_m_agroexport', 'vn_ld_budget'],
    tags: ['кофе', 'арабика'],
    evidence: [VN_EVIDENCE.ldSocio, VN_EVIDENCE.ldCoffeeShare],
    domain: 'vietnam'
  },
  {
    id: 'vn_ld_flowers',
    name: 'Цветы Đà Lạt',
    kind: 'product',
    value: '4,4 млрд стеблей в год',
    valueNum: 4.4,
    description: 'Отрасль с именем и без валютной выручки: на экспорт уходит каждый девятый стебель.',
    facts: [
      'Около 10 800 га, свыше 4,4 млрд стеблей в год',
      'Экспорт 494 млн стеблей, это 11,2 % объёма, в 23 страны',
      'Выручки экспорта в долларах не публикует никто',
      'Цель на 2030: 5,4 млрд стеблей и 217 млн $ экспорта'
    ],
    related: ['vn_lamdong', 'vn_ld_veg', 'vn_m_agroexport'],
    tags: ['цветы', 'далат'],
    evidence: [VN_EVIDENCE.ldFlowers],
    domain: 'vietnam'
  },
  {
    id: 'vn_ld_veg',
    name: 'Овощи и фрукты Lâm Đồng',
    kind: 'product',
    value: '2,82 млн т овощей',
    valueNum: 2.82,
    description: 'Огород для всей южной части страны, работающий на внутренний рынок.',
    facts: [
      'Овощи 2 823 372 т за три сезона',
      'Чай 9 329,3 га и 116 699,1 т (−0,49 %)',
      'Авокадо 9 050,0 га (−1,56 %), урожая в тоннах источник не даёт',
      'Драконий фрукт 26 126 га и 577 731 т: культура Bình Thuận, в ряду только из-за слияния'
    ],
    related: ['vn_lamdong', 'vn_fruitveg', 'vn_ld_flowers'],
    tags: ['овощи', 'чай', 'авокадо'],
    evidence: [VN_EVIDENCE.ldSocio],
    domain: 'vietnam'
  },
  {
    id: 'vn_ld_durian',
    name: 'Дуриан Lâm Đồng',
    kind: 'product',
    value: '290 266 т урожая',
    valueNum: 0.29,
    description: 'Самая быстрорастущая культура региона, привязанная к одному покупателю.',
    facts: [
      'Площадь 44 283,5 га, урожай 290 266 т (+11,34 %)',
      'Страна вывозит дуриан в Китай на 3,24 млрд $ за 11 месяцев',
      'Провал экспорта в начале 2025 показал, чего стоит один покупатель'
    ],
    related: ['vn_lamdong', 'vn_durian', 'vn_cn'],
    tags: ['дуриан'],
    evidence: [VN_EVIDENCE.ldSocio, VN_EVIDENCE.xinhuaDurian],
    domain: 'vietnam'
  },
  {
    id: 'vn_ld_silk',
    name: 'Шелк Bảo Lộc',
    kind: 'product',
    value: '~$180 млн экспорта',
    valueNum: 0.18,
    description: 'Вторая экспортная статья региона после кофе и единственная с переработкой внутри.',
    facts: [
      '70 % площади шелковицы и 80 % коконов страны',
      'Экспорт около 180 млн $ в год',
      'Шелковица 11 320,4 га (+4,93 %)',
      'Bảo Lộc даёт около 1 000 т шёлка и 3,5 млн м² ткани в год'
    ],
    related: ['vn_lamdong', 'vn_m_agroexport'],
    tags: ['шелк', 'bao loc'],
    evidence: [VN_EVIDENCE.ldSilk, VN_EVIDENCE.ldSocio],
    domain: 'vietnam'
  },
  {
    id: 'vn_ld_tourism',
    name: 'Туризм Lâm Đồng',
    kind: 'service',
    value: '20,7 млн визитов',
    valueNum: 2.15,
    description: 'Объём есть, чека нет: около 104 $ с визита вместе с едой, иностранцев 6,2 %.',
    facts: [
      '20 733,1 тыс. визитов (+17,91 %), иностранцев 1 287 тыс. (+39,78 %)',
      'Выручка 56 610,6 млрд VND (около 2,15 млрд $), +24,1 %',
      'Размещение 11 007,3 млрд VND, питание 45 599, турагентства 648,3',
      'В 2024 по старым границам было 10 млн визитов и около 18 000 млрд VND',
      'Цель на 2026: свыше 25 млн визитов и около 1,6 млн иностранцев'
    ],
    related: ['vn_lamdong', 'vn_tourism', 'vn_m_rental', 'vn_ld_airport', 'vn_m_ru_tourism'],
    tags: ['туризм', 'далат'],
    evidence: [VN_EVIDENCE.ldSocio, VN_EVIDENCE.ldTourismRev, VN_EVIDENCE.ldTourism2024],
    domain: 'vietnam'
  },
  {
    id: 'vn_ld_budget',
    name: 'Бюджет Lâm Đồng',
    kind: 'sector',
    value: '31 319 млрд VND доходов',
    valueNum: 1.19,
    description: 'План перевыполнен, но база доходов та же самая: сырьё и приезжие.',
    facts: [
      'Доходы 31 319 млрд VND (около 1,19 млрд $), 110,86 % плана, +9,59 %',
      'В 2024 по старым границам было 13 175,3 млрд VND и только 93,1 % плана',
      'Новых предприятий 4 183 (+78,61 %), капитал 22 959 млрд VND'
    ],
    related: ['vn_lamdong', 'vn_ld_coffee', 'vn_ld_tourism'],
    tags: ['бюджет'],
    evidence: [VN_EVIDENCE.ldSocio, VN_EVIDENCE.ld2024],
    domain: 'vietnam'
  },
  {
    id: 'vn_ld_airport',
    name: 'Аэропорт Liên Khương',
    kind: 'service',
    value: 'закрыт 6 месяцев 2026',
    valueNum: 3,
    description: 'Единственные ворота региона по воздуху, выключенные на полсезона.',
    facts: [
      'Свыше 12 млн пассажиров за 2020-2025, около 77,8 тыс. взлётов-посадок',
      'Пик около 3 млн пассажиров в год, выше проектной мощности',
      'Международный статус с июня 2024, первый в Тэйнгуен',
      'Ремонт с 04.03 по 25.08.2026 за 1 032 млрд VND',
      'Расширение до 5 млн пассажиров и класса 4E запланировано к 2030'
    ],
    related: ['vn_lamdong', 'vn_ld_tourism', 'vn_m_ru_tourism', 'vn_ld_highway'],
    tags: ['аэропорт', 'lien khuong'],
    evidence: [VN_EVIDENCE.ldAirport],
    domain: 'vietnam'
  },
  {
    id: 'vn_ld_highway',
    name: 'Скоростная дорога в Lâm Đồng',
    kind: 'service',
    value: '~140 км строится',
    valueNum: 1.43,
    description: 'Две очереди на 37,5 трлн донгов, объявленные и пока не построенные.',
    facts: [
      'Tân Phú - Bảo Lộc: около 66 км, свыше 18 000 млрд VND, старт 19.12.2025, срок 25 месяцев',
      'Через 4 месяца после старта работы не начаты, передано 27 % площадки',
      'Bảo Lộc - Liên Khương: 73,62 км, первая очередь 19 521 млрд VND, госдоля 39,76 %',
      'Вся трасса Dầu Giây - Liên Khương это 200,3 км в трёх участках'
    ],
    related: ['vn_lamdong', 'vn_ld_land', 'vn_ld_airport', 'vn_ld_tourism'],
    tags: ['дорога', 'инфраструктура'],
    evidence: [VN_EVIDENCE.ldHighway],
    domain: 'vietnam'
  },
  {
    id: 'vn_ld_land',
    name: 'Земля Lâm Đồng',
    kind: 'product',
    value: 'до 72,8 млн VND за м²',
    valueNum: 0.0028,
    description: 'Đà Lạt и Đức Trọng идут вровень, Lâm Hà втрое дешевле: разрыв закрывает дорога.',
    facts: [
      'Государственная таблица: Đà Lạt до 72,8 млн VND за м², Đức Trọng до 72, Lâm Hà до 21,6',
      'Это база для налогов и компенсаций, а не сделки; действовала до 31.12.2025',
      'Рынок Đà Lạt по оценке брокера около 45 млн VND за м², центр 260-540 млн',
      'Отдельных публикаций с ценами по Nam Ban нет'
    ],
    related: ['vn_lamdong', 'vn_realestate', 'vn_ld_highway', 'vn_m_rental'],
    tags: ['земля', 'lam ha', 'duc trong'],
    evidence: [VN_EVIDENCE.ldLand, VN_EVIDENCE.ldLandMarket],
    domain: 'vietnam'
  },

  // Микрокатегории
  {
    id: 'vn_m_ai_smb',
    name: 'ИИ-внедрения для малого бизнеса',
    kind: 'service',
    value: '$19 в месяц стоит доступ',
    valueNum: 0.019,
    description: 'Инструмент стоит дешевле обеда, а довести его до работы некому у половины компаний.',
    facts: [
      'MISA AMIS OneAI: 500 тыс. VND в месяц (около 19 $) на организацию без лимита мест',
      'Свыше 600 тыс. малых и средних компаний, это 97 % бизнеса страны',
      'Цену главным барьером называют 68 %, своих ИИ-навыков нет у 46,4 %',
      'Разработка: от 10 тыс. $ за простой чат-бот до 100 тыс. $ и выше за корпоративное',
      'Типовой софт для SMB стоит 50-200 млн VND в год (2 050-8 200 $)'
    ],
    related: ['vn_ai', 'vn_it', 'vn_ecom', 'vn'],
    tags: ['ии', 'smb', 'внедрение'],
    evidence: [VN_EVIDENCE.misaPrice, VN_EVIDENCE.smeBarrier, VN_EVIDENCE.aiMarket, VN_EVIDENCE.aiDevPrice],
    domain: 'vietnam'
  },
  {
    id: 'vn_m_expat_it',
    name: 'Услуги для экспатов',
    kind: 'service',
    value: '83,5-100 тыс. иностранцев',
    valueNum: 0.0001,
    description: 'Категория юридическая, а не айтишная: платят за бумаги, и платящих мало.',
    facts: [
      'Иностранцев в стране 83,5-100 тыс., это 0,08-0,1 % населения',
      'Регистрация компании с иностранным участием: услуги 1 000-3 000 $ при госпошлине около 4 $',
      'Разрешение на работу: услуги агентства 4,23-9 млн VND при госпошлине 400-600 тыс. VND',
      'Размера рынка IT-услуг для экспатов не публикует никто'
    ],
    related: ['vn', 'vn_m_rental', 'vn_it'],
    tags: ['экспаты'],
    evidence: [VN_EVIDENCE.expats, VN_EVIDENCE.expatServices],
    domain: 'vietnam'
  },
  {
    id: 'vn_m_ru_tourism',
    name: 'Русскоязычный туризм',
    kind: 'service',
    value: '690 тыс. россиян',
    valueNum: 0.69,
    description: 'Поток утроился за год и ушёл на побережье, мимо гор.',
    facts: [
      'Россия 689 714 человек за 2025 (+196,9 %), крупнейший европейский рынок',
      'Свыше 1 млн за 8 месяцев 2026 (+165,7 %)',
      'Кханьхоа одна забрала 279 тыс. за 8 месяцев 2025 при 30 рейсах в неделю в Камрань',
      'Безвизовый режим 45 дней действует с августа 2023',
      'Сколько россиян доезжает до Lâm Đồng, не публикует никто: разбивки по гражданству у провинции нет'
    ],
    related: ['vn_tourism', 'vn_ld_tourism', 'vn_ld_airport', 'vn_m_rental'],
    tags: ['россияне', 'туризм'],
    evidence: [VN_EVIDENCE.vpTourism, VN_EVIDENCE.tuoiTreRu, VN_EVIDENCE.ldSocio],
    domain: 'vietnam'
  },
  {
    id: 'vn_m_agroexport',
    name: 'Переработка агроэкспорта',
    kind: 'service',
    value: '$5 610 за тонну сырья',
    valueNum: 5.61,
    description: 'Регион отдаёт зерно по биржевой цене, а наценку за имя забирают обжарщики за границей.',
    facts: [
      'Регион даёт 44 % площади и 48,3 % урожая кофе страны',
      'Страна продаёт его сырьём по 5 610 $ за тонну',
      'Арабика Cầu Đạt около 3 % производства страны: единственная позиция с именем',
      'Шелк это вторая экспортная статья региона, около 180 млн $, и там переработка уже есть',
      'У цветов Đà Lạt на экспорт уходит 11,2 % объёма, выручки в долларах никто не публикует'
    ],
    related: ['vn_ld_coffee', 'vn_coffee', 'vn_ld_silk', 'vn_ld_flowers'],
    tags: ['кофе', 'переработка', 'экспорт'],
    evidence: [VN_EVIDENCE.ldCoffeeShare, VN_EVIDENCE.customsCoffee, VN_EVIDENCE.coffeePrice, VN_EVIDENCE.ldSilk],
    domain: 'vietnam'
  },
  {
    id: 'vn_m_rental',
    name: 'Долгая аренда в Đà Lạt',
    kind: 'service',
    value: '$285 за однокомнатную',
    valueNum: 0.285,
    description: 'Весь фонд заточен под выходные: длинного пребывания как продукта не существует.',
    facts: [
      'Однокомнатная в центре около 285 $ в месяц, полная жизнь экспата 934 $',
      'Место в коворкинге 107 $, но самих коворкингов в Đà Lạt практически нет',
      'Средняя скорость интернета 10 Мбит/с, оценка «медленно»',
      'Объявления по аренде идут в вилке 5-15 млн VND в месяц',
      '3 070 средств размещения и 43 684 номера дают 418 млн $ на 20,7 млн визитов'
    ],
    related: ['vn_ld_tourism', 'vn_ld_land', 'vn_m_expat_it', 'vn_m_ru_tourism'],
    tags: ['аренда', 'далат'],
    evidence: [VN_EVIDENCE.nomadsDalat, VN_EVIDENCE.ldLandMarket, VN_EVIDENCE.ldTourism2024],
    domain: 'vietnam'
  }
];

// ─── Потоки ───────────────────────────────────────────────────────────────────
// Все суммы в миллиардах долларов США. Национальные и региональные потоки в
// одном списке, но не складываются: у региональных в описании стоит периметр.

export const VIETNAM_FLOWS: MoneyFlow[] = [
  // Экспорт по партнёрам
  { id: 'vnf-us', from: 'vn', to: 'vn_us', value: '$153,2 млрд', valueNum: 153.2, label: 'Экспорт в США', description: 'Крупнейший рынок сбыта, рост 28,1 % за год. Профицит по этому направлению 133,9 млрд $ при тарифе 20 %.', domain: 'vietnam' },
  { id: 'vnf-cn-ex', from: 'vn', to: 'vn_cn', value: '$70,45 млрд', valueNum: 70.45, label: 'Экспорт в Китай', description: 'Число агрегатора, официального вьетнамского релиза с ним нет. Косвенно сходится: 186 млрд импорта минус дефицит 115,6 даёт 70,4.', domain: 'vietnam' },
  { id: 'vnf-eu', from: 'vn', to: 'vn_eu', value: '$56 млрд', valueNum: 56, label: 'Экспорт в ЕС', description: 'Рост 8,6 % за год, профицит 38,6 млрд $. Европа же главный покупатель вьетнамского кофе.', domain: 'vietnam' },
  { id: 'vnf-kr-ex', from: 'vn', to: 'vn_kr', value: '$28,94 млрд', valueNum: 28.94, label: 'Экспорт в Корею', description: 'Оценка агрегатора; за 11 месяцев официально 26,0 млрд $ с ростом 11,7 %.', domain: 'vietnam' },
  { id: 'vnf-jp-ex', from: 'vn', to: 'vn_jp', value: '$26,77 млрд', valueNum: 26.77, label: 'Экспорт в Японию', description: 'Профицит по направлению всего 2,1 млрд $ и он сжался на 30,1 %.', domain: 'vietnam' },

  // Импорт
  { id: 'vnf-cn-im', from: 'vn_cn', to: 'vn', value: '$186 млрд', valueNum: 186, label: 'Импорт из Китая', description: 'Крупнейший источник импорта. Дефицит 115,6 млрд $ вырос на 39,6 % за год: быстрее, чем профицит с США.', domain: 'vietnam' },
  { id: 'vnf-kr-im', from: 'vn_kr', to: 'vn', value: '$60,5 млрд (оценка)', valueNum: 60.5, label: 'Импорт из Кореи', description: 'Официального числа нет. Расчёт: экспорт 28,94 плюс дефицит 31,6. Компоненты для сборки, прежде всего электроника.', domain: 'vietnam' },

  // Товарные потоки
  { id: 'vnf-el-us', from: 'vn_electronics', to: 'vn_us', value: '$42,09 млрд', valueNum: 42.09, label: 'Электроника в США', description: 'Рост 81,4 % за год: самая быстрорастущая строка экспорта.', domain: 'vietnam' },
  { id: 'vnf-el-cn', from: 'vn_electronics', to: 'vn_cn', value: '$16,89 млрд', valueNum: 16.89, label: 'Электроника в Китай', description: 'Рост 33,6 %. Часть потока это возврат компонентов по кооперации.', domain: 'vietnam' },
  { id: 'vnf-tx-us', from: 'vn_textiles', to: 'vn_us', value: '$17,8 млрд', valueNum: 17.8, label: 'Текстиль в США', description: 'Рост 10,7 %. Для отрасли тариф 20 % ощутимее, чем для электроники: маржа тоньше.', domain: 'vietnam' },
  { id: 'vnf-fw-us', from: 'vn_footwear', to: 'vn_us', value: '$11,01 млрд', valueNum: 11.01, label: 'Обувь в США', description: 'Крупнейший рынок обуви. Вся отрасль вывезла около 29 млрд $ с ростом 5 %.', domain: 'vietnam' },
  { id: 'vnf-fw-eu', from: 'vn_footwear', to: 'vn_eu', value: '$6,88 млрд', valueNum: 6.88, label: 'Обувь в ЕС', description: 'Второй рынок обуви после США.', domain: 'vietnam' },
  { id: 'vnf-cof-eu', from: 'vn_coffee', to: 'vn_eu', value: '$4 млрд', valueNum: 4, label: 'Кофе в Европу', description: 'Европа берёт 47,2 % объёма и 46,7 % стоимости кофейного экспорта сезона 2024-25.', domain: 'vietnam' },
  { id: 'vnf-dur-cn', from: 'vn_durian', to: 'vn_cn', value: '$3,24 млрд', valueNum: 3.24, label: 'Дуриан в Китай', description: '885 тыс. тонн за 11 месяцев. В начале года тот же поток падал до 130 млн $ за четыре месяца: один покупатель это одна кнопка.', domain: 'vietnam' },

  // Инвестиции и переводы
  { id: 'vnf-fdi-sg', from: 'vn_sg', to: 'vn_fdi', value: '$4,84 млрд', valueNum: 4.84, label: 'Новые ПИИ из Сингапура', description: '27,9 % новых регистраций. База разбивки 17,32 млрд $ новых проектов, а не весь объём 38,42 млрд $.', domain: 'vietnam' },
  { id: 'vnf-fdi-cn', from: 'vn_cn', to: 'vn_fdi', value: '$3,64 млрд', valueNum: 3.64, label: 'Новые ПИИ из Китая', description: '21 % новых регистраций. Вместе с Гонконгом и Тайванем китайский по происхождению капитал даёт 36,6 %.', domain: 'vietnam' },
  { id: 'vnf-fdi-hktw', from: 'vn_hktw', to: 'vn_fdi', value: '$2,7 млрд', valueNum: 2.7, label: 'Новые ПИИ из Гонконга и Тайваня', description: 'Гонконг 1,73 млрд $ и Тайвань 0,97 млрд $.', domain: 'vietnam' },
  { id: 'vnf-fdi-jp', from: 'vn_jp', to: 'vn_fdi', value: '$1,62 млрд', valueNum: 1.62, label: 'Новые ПИИ из Японии', description: '9,4 % новых регистраций.', domain: 'vietnam' },
  { id: 'vnf-fdi-kr', from: 'vn_kr', to: 'vn_fdi', value: '$0,90 млрд', valueNum: 0.9, label: 'Новые ПИИ из Кореи', description: '5,2 % новых регистраций: для страны с заводами Samsung строка неожиданно скромная.', domain: 'vietnam' },
  { id: 'vnf-fdi-vn', from: 'vn_fdi', to: 'vn', value: '$27,62 млрд', valueNum: 27.62, label: 'Реализованные ПИИ', description: 'Максимум за пять лет, рост 9 %. Зарегистрировано при этом 38,42 млрд $ с ростом всего 0,5 %.', domain: 'vietnam' },
  { id: 'vnf-remit', from: 'vn_remit', to: 'vn', value: '$17,2 млрд (оценка)', valueNum: 17.2, label: 'Переводы диаспоры', description: 'Официального числа по стране за 2025 нет. Расчёт от Хошимина: 10,34 млрд $ это около 60 % потока.', domain: 'vietnam' },

  // Услуги
  { id: 'vnf-tour', from: 'vn_tourism', to: 'vn', value: '$32 млрд', valueNum: 32, label: 'Размещение и питание', description: '843,1 трлн VND за 2025, рост 14,6 %. Турагентские услуги отдельной строкой 93,9 трлн VND, в эту сумму входят не целиком.', domain: 'vietnam' },
  { id: 'vnf-ecom', from: 'vn_ecom', to: 'vn', value: '$16,5 млрд', valueNum: 16.5, label: 'Обороты маркетплейсов', description: '429,66 трлн VND на четырёх площадках, рост 34,75 %. Shopee 56,04 %, TikTok Shop 41,31 %.', domain: 'vietnam' },

  // Регион: периметр Lâm Đồng, с национальными строками не складывается
  { id: 'vnf-ld-tour', from: 'vn_ld_tourism', to: 'vn_lamdong', value: '$2,15 млрд', valueNum: 2.15, label: 'Выручка туризма региона', description: 'Периметр объединённой провинции: 56 610,6 млрд VND на 20,7 млн визитов, это около 104 $ с визита вместе с едой.', domain: 'vietnam' },
  { id: 'vnf-ld-stay', from: 'vn_m_rental', to: 'vn_ld_tourism', value: '$0,42 млрд', valueNum: 0.418, label: 'Из них размещение', description: '11 007,3 млрд VND из 56 610,6. Остальное еда: 45 599 млрд VND. Ночёвка в регионе стоит дешевле, чем поесть.', domain: 'vietnam' },
  { id: 'vnf-ld-budget', from: 'vn_lamdong', to: 'vn_ld_budget', value: '$1,19 млрд', valueNum: 1.19, label: 'Доходы бюджета провинции', description: '31 319 млрд VND, 110,86 % плана. Периметр объединённой провинции; за 2024 по старым границам было 13 175,3 млрд VND.', domain: 'vietnam' },
  { id: 'vnf-ld-silk', from: 'vn_ld_silk', to: 'vn', value: '$0,18 млрд', valueNum: 0.18, label: 'Экспорт шёлка региона', description: 'Вторая экспортная статья Lâm Đồng после кофе и единственная, где переработка идёт внутри провинции.', domain: 'vietnam' }
];

// Вклад региона в кофейный экспорт страны потоком НЕ записан намеренно: 48,3 %
// урожая это физический объём, а не доллары, и в долларовом списке такая строка
// читалась бы как сумма. Связь лежит в VIETNAM_LINKS (vnl-3, vnl-13).

// ─── Цепочки зависимостей ─────────────────────────────────────────────────────

export const VIETNAM_CHAINS: DependencyChain[] = [
  {
    id: 'vnc-coffee',
    title: 'Мировая цена кофе - урожай - экспорт - бюджет провинции',
    nodes: ['vn_ld_coffee', 'vn_coffee', 'vn_eu', 'vn_lamdong', 'vn_ld_budget'],
    summary: 'Регион растит почти половину кофе страны, страна продаёт его сырьём, цену назначает биржа.',
    insight:
      'Экспорт кофе поставил рекорд 8,9 млрд $ при росте стоимости на 58,8 %, а объём вырос только на 18,3 %. Рекорд сделала цена 5 610 $ за тонну, а не работа: тот же урожай годом раньше стоил бы на треть дешевле. Когда цена развернётся, у региона не останется ничего, что он мог бы предъявить взамен, потому что наценку за имя забирают обжарщики за границей.'
  },
  {
    id: 'vnc-us-cn',
    title: 'Профицит с США - дефицит с Китаем - тариф',
    nodes: ['vn_cn', 'vn_electronics', 'vn_us', 'vn'],
    summary: 'Вьетнам покупает компоненты у Китая и продаёт сборку США. Обе стороны уязвимы.',
    insight:
      'Профицит с США 133,9 млрд $ почти целиком уходит на дефицит с Китаем (115,6) и Кореей (31,6). При этом дефицит с Китаем растёт на 39,6 % в год, а профицит с США на 28,2 %: разрыв сокращается не в пользу Вьетнама. Тариф США 20 % и обещанные 40 % на транзитные товары бьют ровно по этой конструкции, а 77,3 % экспорта делают иностранные компании, которым несложно переехать.'
  },
  {
    id: 'vnc-tourism',
    title: 'Турпоток - аренда - земля',
    nodes: ['vn_m_ru_tourism', 'vn_ld_tourism', 'vn_m_rental', 'vn_ld_land'],
    summary: 'Поток растёт, чек не растёт: фонд рассчитан на выходные, а не на пребывание.',
    insight:
      '20,7 млн визитов дают 2,15 млрд $, то есть около 104 $ с визита вместе с едой, и размещение в этой сумме всего 418 млн $. Иностранцев 6,2 %. Русскоязычный поток по стране утроился, но осел на побережье. Долгая аренда, коворкинг и нормальный интернет в Đà Lạt отсутствуют как продукт, поэтому конвертировать поток в пребывание нечем.'
  },
  {
    id: 'vnc-airport',
    title: 'Аэропорт - доступность - сезон',
    nodes: ['vn_ld_airport', 'vn_ld_highway', 'vn_ld_tourism', 'vn_ld_budget'],
    summary: 'Единственные воздушные ворота закрыты на полсезона, дорога объявлена, но не строится.',
    insight:
      'Liên Khương закрыт с 4 марта по 25 августа 2026, а это шесть месяцев из двенадцати и весь летний сезон. Замены нет: дорога Tân Phú - Bảo Lộc через четыре месяца после торжественного старта не строится, передано 27 % площадки. Цель провинции на 2026 стоит в 25 млн визитов, и на чём они приедут, из планов не следует.'
  },
  {
    id: 'vnc-ai',
    title: 'Цена инструмента - навык - внедрение',
    nodes: ['vn_ai', 'vn_m_ai_smb', 'vn_it', 'vn_ecom'],
    summary: 'Доступ к моделям стоит 19 $ в месяц, доведение до работы не стоит ничего, потому что его не продают.',
    insight:
      'MISA продаёт весь набор мировых моделей за 500 тыс. VND в месяц на организацию без лимита мест: нишу доступа закрыли ценой. При этом внедрили ИИ 73 % компаний, а работает он у 13,8 %, и у 46,4 % нет своего человека, который довёл бы. Рынок не в инструменте, а в доведении, и он совпадает с тем, что уже описан в домене ai-native для РФ, только вход дешевле на порядок: разработка от 10 тыс. $ и ставка 25-60 $ в час.'
  },
  {
    id: 'vnc-durian',
    title: 'Один покупатель - одна культура - один риск',
    nodes: ['vn_ld_durian', 'vn_durian', 'vn_fruitveg', 'vn_cn'],
    summary: 'Дуриан даёт половину фруктового экспорта страны и весь свой объём везёт в одну страну.',
    insight:
      'Из 8,5 млрд $ фруктово-овощного экспорта дуриан даёт свыше 4, и 3,24 млрд из них уходит в Китай. Что бывает, когда покупатель ужесточает проверки, видно по началу 2025: 130 млн $ за четыре месяца против 500 млн годом ранее, падение на 74 %. Lâm Đồng нарастила площадь до 44,3 тыс. га и урожай на 11,34 %, то есть увеличила ставку на том же самом риске.'
  }
];

// ─── Парные зависимости ───────────────────────────────────────────────────────

export const VIETNAM_LINKS: DependencyLink[] = [
  { id: 'vnl-1', from: 'vn_us', to: 'vn', label: 'спрос США держит профицит', description: 'Экспорт 153,2 млрд $ и профицит 133,9 млрд $ покрывают дефициты со всеми остальными.', strength: 'critical' },
  { id: 'vnl-2', from: 'vn_cn', to: 'vn_electronics', label: 'компоненты решают сборку', description: 'Импорт из Китая 186 млрд $ это прежде всего то, из чего собирают экспорт.', strength: 'critical' },
  { id: 'vnl-3', from: 'vn_coffee', to: 'vn_lamdong', label: 'цена биржи задаёт доход региона', description: 'Регион даёт 48,3 % урожая страны и получает мировую цену без наценки за имя.', strength: 'critical' },
  { id: 'vnl-4', from: 'vn_ld_airport', to: 'vn_ld_tourism', label: 'ворота открыты или закрыты', description: 'Полгода ремонта в 2026 выключают прямой доступ в разгар сезона.', strength: 'critical' },
  { id: 'vnl-5', from: 'vn_ld_tourism', to: 'vn_ld_budget', label: 'визиты кормят бюджет', description: 'Услуги дали рост 8,28 % против 5,10 % у сельского хозяйства.', strength: 'strong' },
  { id: 'vnl-6', from: 'vn_ld_highway', to: 'vn_ld_land', label: 'дорога двигает цену земли', description: 'Lâm Hà втрое дешевле Đà Lạt по государственной таблице; разрыв закрывает доступность.', strength: 'strong' },
  { id: 'vnl-7', from: 'vn_cn', to: 'vn_durian', label: 'один покупатель держит культуру', description: '3,24 млрд $ из 4 с лишним уходят в Китай; ужесточение проверок обрушило поток на 74 %.', strength: 'critical' },
  { id: 'vnl-8', from: 'vn_fdi', to: 'vn_industry', label: 'чужие деньги строят заводы', description: 'Обработка забирает 56,5 % новых регистраций, а иностранный сектор делает 77,3 % экспорта.', strength: 'critical' },
  { id: 'vnl-9', from: 'vn_banking', to: 'vn_realestate', label: 'кредит надувает метры', description: 'Кредит вырос на 17,87 % при депозитах +14 %; Ханой подорожал на 22-36 % за год.', strength: 'strong' },
  { id: 'vnl-10', from: 'vn_remit', to: 'vn_realestate', label: 'переводы заходят в метры', description: 'Около 17,2 млрд $ в год, сопоставимо с двумя третями реализованных ПИИ.', strength: 'moderate' },
  { id: 'vnl-11', from: 'vn_ai', to: 'vn_m_ai_smb', label: 'дешёвый доступ убивает продажу инструмента', description: '19 $ в месяц за все модели: продавать остаётся только доведение до работы.', strength: 'strong' },
  { id: 'vnl-12', from: 'vn_m_ru_tourism', to: 'vn_m_rental', label: 'длинный визит требует длинной аренды', description: 'Безвизовые 45 дней есть, а фонда под 45 дней в Đà Lạt нет.', strength: 'moderate' },
  { id: 'vnl-13', from: 'vn_ld_coffee', to: 'vn_m_agroexport', label: 'сырьё ждёт переработки', description: 'Арабика Cầu Đạt это около 3 % производства страны и единственная позиция с именем.', strength: 'strong' },
  { id: 'vnl-14', from: 'vn_ecom', to: 'vn_m_ai_smb', label: 'продавцов меньше, требования выше', description: 'Обороты площадок выросли на 34,75 %, а активных продавцов стало меньше на 7,43 %.', strength: 'moderate' }
];

// ─── Таблицы раздела ──────────────────────────────────────────────────────────

/** Сопоставление страны и региона: одна строка, два периметра, разные числа. */
export interface VnCompareRow {
  id: string;
  metric: string;
  country: string;
  region: string;
  note: string;
}

export const VN_COUNTRY_VS_REGION: VnCompareRow[] = [
  { id: 'cmp-growth', metric: 'Рост экономики за 2025', country: '8,02 %', region: '6,42 %', note: 'Регион отстаёт на 1,6 пункта. Нацстатслужба причину называет прямо: провинции на сырьевом сельхозэкспорте страдают от мировых цен.' },
  { id: 'cmp-agro', metric: 'Доля сельского хозяйства', country: '11,64 %', region: '38,59 %', note: 'В стране это малая отрасль, в регионе крупнейшая. Доли считаются по разным методикам, точному сравнению не подлежат.' },
  { id: 'cmp-serv', metric: 'Доля услуг', country: '42,74 %', region: '35,83 %', note: 'В регионе услуги растут быстрее всего (+8,28 %), но стартуют с меньшей базы.' },
  { id: 'cmp-percap', metric: 'На душу населения', country: '5 066 $', region: '4 047,6 $', note: 'Регион на пятую часть беднее среднего по стране. Числа считаны разными службами и по разным курсам.' },
  { id: 'cmp-tourists', metric: 'Иностранцев в турпотоке', country: '21,17 млн прибытий', region: '1,287 млн из 20,7 млн визитов', note: 'Доля иностранцев в регионе 6,2 %: поток внутренний. «Прибытие в страну» и «визит в провинцию» это разные единицы.' },
  { id: 'cmp-budget', metric: 'Доходы бюджета', country: '101,3 млрд $', region: '1,19 млрд $', note: 'Государственный бюджет и провинциальный это разные уровни, доля одного в другом отсюда не считается.' }
];

/** Микрокатегории: где владелец ищет возможность. */
export interface VnMicroRow {
  id: string;
  nodeId: string;
  name: string;
  size: string;
  sellers: string;
  price: string;
  pain: string;
}

export const VN_MICRO: VnMicroRow[] = [
  {
    id: 'mic-ai',
    nodeId: 'vn_m_ai_smb',
    name: 'ИИ-внедрения для малого бизнеса',
    size: 'рынок ИИ 0,75 млрд $, свыше 600 тыс. компаний',
    sellers: 'MISA, FPT, Viettel, подрядчики разработки',
    price: '19 $ в месяц за доступ; 10-100 тыс. $ за разработку; 25-60 $ в час',
    pain: 'Внедрили 73 %, работает у 13,8 %, своих навыков нет у 46,4 %. Цену барьером называют 68 %.'
  },
  {
    id: 'mic-expat',
    nodeId: 'vn_m_expat_it',
    name: 'Услуги для экспатов',
    size: '83,5-100 тыс. иностранцев, размера рынка нет',
    sellers: 'юридические агентства и визовые посредники',
    price: '1 000-3 000 $ регистрация компании; 4,23-9 млн VND разрешение на работу',
    pain: 'Платят за бумаги, а не за технологию. Отдельного рынка IT-услуг для экспатов в числах не существует.'
  },
  {
    id: 'mic-ru',
    nodeId: 'vn_m_ru_tourism',
    name: 'Туризм для русскоязычных',
    size: '690 тыс. за 2025, свыше 1 млн за 8 месяцев 2026',
    sellers: 'чартерные операторы побережья, агентства Нячанга',
    price: 'данных по среднему чеку нет ни у одного источника',
    pain: 'Поток идёт в Кханьхоа: 279 тыс. за 8 месяцев при 30 рейсах в неделю. Сколько доезжает до Lâm Đồng, не знает никто.'
  },
  {
    id: 'mic-agro',
    nodeId: 'vn_m_agroexport',
    name: 'Переработка агроэкспорта',
    size: '44 % площади и 48,3 % урожая кофе страны',
    sellers: 'экспортёры сырья, зарубежные обжарщики',
    price: '5 610 $ за тонну зелёного зерна',
    pain: 'Наценку за имя забирают за границей. Арабика Cầu Đạt около 3 % производства страны: единственная позиция, где продают имя.'
  },
  {
    id: 'mic-rent',
    nodeId: 'vn_m_rental',
    name: 'Долгая аренда в Đà Lạt',
    size: '43 684 номера дают 418 млн $ на 20,7 млн визитов',
    sellers: 'отели и гестхаусы под короткий визит',
    price: '285 $ однокомнатная, 107 $ коворкинг, объявления 5-15 млн VND',
    pain: 'Коворкингов практически нет, интернет 10 Мбит/с. Продукта под 45 безвизовых дней не существует.'
  }
];

// ─── Расчётные величины ───────────────────────────────────────────────────────
// Считаются из данных, а не вписываются руками: поменяется источник - поменяется
// и вывод. Каждая величина сопровождается в разделе меткой «оценка».

/** Население объединённой Lâm Đồng, человек. Источник: справочник по резолюции. */
export const LD_POPULATION = 3_872_999;
/** GRDP на душу, донгов. Источник: статуправление провинции. */
export const LD_GRDP_PER_CAPITA_VND = 105_240_000;
/** Выручка туризма региона, миллиардов донгов. Источник: статуправление. */
export const LD_TOURISM_REVENUE_VND_BN = 56_610.6;
/** Из неё размещение, миллиардов донгов. Источник: SGGP по пресс-конференции. */
export const LD_ACCOMMODATION_VND_BN = 11_007.3;
/** Визитов в регион за 2025. Источник: статуправление. */
export const LD_VISITS = 20_733_100;

/** Расчётный GRDP провинции: абсолютного числа не печатает ни один источник. */
export const LD_GRDP_VND_BN = (LD_GRDP_PER_CAPITA_VND * LD_POPULATION) / 1e9;
export const LD_GRDP_USD_BN = vndBnToUsdBn(LD_GRDP_VND_BN);

/** Средний чек визита в регион, доллары: выручка на число визитов. */
export const LD_SPEND_PER_VISIT_USD =
  (LD_TOURISM_REVENUE_VND_BN * 1e9) / VND_PER_USD / LD_VISITS;

/** Доля размещения в туристической выручке региона. */
export const LD_ACCOMMODATION_SHARE = LD_ACCOMMODATION_VND_BN / LD_TOURISM_REVENUE_VND_BN;

/** Доля иностранцев в турпотоке региона. */
export const LD_FOREIGN_SHARE = 1_287_000 / LD_VISITS;
