import type { Era, EraKey, ServiceEraStat } from '../types';

export const ERAS: Era[] = [
  {
    key: 'e2010',
    label: '2010-е',
    title: 'Эпоха офшоринга и мобильных платформ',
    summary:
      'Мир покупал «дешёвые руки»: офшоринг разработки, колл-центры, ввод данных. Мобильные платформы создали рынки приложений и рекламы. Услуга = человек делает то же самое, но за меньшие деньги.'
  },
  {
    key: 'e2020',
    label: '2020-2023',
    title: 'Пандемийный сдвиг и подписки',
    summary:
      'Карантин перенёс жизнь в цифру: облака, доставка, стриминг, удалёнка. SaaS стал нормой. Деньги текли в «цифровые рельсы». Первые генеративные модели появились в конце периода.'
  },
  {
    key: 'e2026',
    label: '2024-2026',
    title: 'Эпоха ИИ-агентов и переписывания услуг',
    summary:
      'ИИ перестал быть фичей и стал исполнителем: агенты пишут код, ведут поддержку, делают маркетинг. Рутинные услуги дешевеют и сжимаются, растёт спрос на результат, экспертизу и «человеческое».'
  },
  {
    key: 'e2030',
    label: 'к 2030',
    title: 'Проектируемое будущее: агенты-коллеги',
    summary:
      'Прогноз-ориентир: большая часть цифровых рутин выполняется агентами, люди — в контроле, творчестве и контакте. Роботы выходят в физический мир. Рынок труда перестроен вокруг «человек + агенты».'
  }
];

// Относительная популярность услуг (0-100), оценки.

export const SERVICE_ERAS: ServiceEraStat[] = [
  { serviceId: 'software_engineering', era: 'e2010', demand: 65, note: 'Проектная разработка и enterprise-интеграции растут вместе с вебом' },
  { serviceId: 'software_engineering', era: 'e2020', demand: 82, note: 'Удалённая работа и цифровизация расширяют спрос' },
  { serviceId: 'software_engineering', era: 'e2026', demand: 92, note: 'ИИ ускоряет исполнение, а спрос смещается к архитектуре и внедрению' },
  { serviceId: 'software_engineering', era: 'e2030', demand: 88, note: 'Типовой код автоматизирован; системная инженерия остаётся (оценка-прогноз)' },
  { serviceId: 'agent_platforms', era: 'e2010', demand: 5, note: 'Категории агентских платформ ещё нет' },
  { serviceId: 'agent_platforms', era: 'e2020', demand: 12, note: 'Первые MLOps и automation-платформы' },
  { serviceId: 'agent_platforms', era: 'e2026', demand: 78, note: 'Переход от чат-ботов к системам, выполняющим работу' },
  { serviceId: 'agent_platforms', era: 'e2030', demand: 100, note: 'Агенты как слой enterprise software (оценка-прогноз)' },
  { serviceId: 'healthtech', era: 'e2010', demand: 35, note: 'Ранние EHR, телемедицина и цифровые клиники' },
  { serviceId: 'healthtech', era: 'e2020', demand: 68, note: 'Пандемия ускорила удалённый доступ и цифровое администрирование' },
  { serviceId: 'healthtech', era: 'e2026', demand: 88, note: 'Данные, диагностика и care delivery становятся платформенными' },
  { serviceId: 'healthtech', era: 'e2030', demand: 96, note: 'Интегрированное цифровое здоровье (оценка-прогноз)' },
  { serviceId: 'femtech', era: 'e2010', demand: 25, note: 'Первые трекеры цикла и репродуктивные сервисы' },
  { serviceId: 'femtech', era: 'e2020', demand: 52, note: 'Рост внимания к недообслуженным потребностям' },
  { serviceId: 'femtech', era: 'e2026', demand: 76, note: 'Вертикальные продукты, данные и менопауза' },
  { serviceId: 'femtech', era: 'e2030', demand: 90, note: 'Расширение женского health stack (оценка-прогноз)' },
  { serviceId: 'longevity', era: 'e2010', demand: 20, note: 'Ниша wellness и отдельных клиник' },
  { serviceId: 'longevity', era: 'e2020', demand: 42, note: 'Биомаркеры и превентивные протоколы набирают спрос' },
  { serviceId: 'longevity', era: 'e2026', demand: 72, note: 'Регулярное измерение и персональное сопровождение' },
  { serviceId: 'longevity', era: 'e2030', demand: 92, note: 'Здоровое долголетие как сервис (оценка-прогноз)' },
  { serviceId: 'mental_health', era: 'e2010', demand: 35, note: 'Офлайн-помощь доминирует, цифровой слой мал' },
  { serviceId: 'mental_health', era: 'e2020', demand: 62, note: 'Пандемия резко подняла спрос и телеподдержку' },
  { serviceId: 'mental_health', era: 'e2026', demand: 84, note: 'Доступность, навигация и цифровые программы' },
  { serviceId: 'mental_health', era: 'e2030', demand: 94, note: 'Гибридная care delivery с ИИ-поддержкой (оценка-прогноз)' },
  // IT-аутсорсинг
  { serviceId: 'it_outsourcing', era: 'e2010', demand: 85, note: 'Золотой век офшоринга: «пишите код дешевле»' },
  { serviceId: 'it_outsourcing', era: 'e2020', demand: 80, note: 'Пандемия ускорила цифровизацию, аутсорсинг на пике' },
  { serviceId: 'it_outsourcing', era: 'e2026', demand: 55, note: 'ИИ-кодинг сжимает базовый уровень; спрос смещается к интеграциям ИИ' },
  { serviceId: 'it_outsourcing', era: 'e2030', demand: 40, note: 'Остаётся доменная экспертиза и сложные системы (оценка-прогноз)' },
  // Облака
  { serviceId: 'cloud', era: 'e2010', demand: 40, note: 'Миграция в облака только начинается' },
  { serviceId: 'cloud', era: 'e2020', demand: 75, note: 'Облака — обязательная инфраструктура' },
  { serviceId: 'cloud', era: 'e2026', demand: 95, note: 'ИИ-нагрузки: облако = доступ к GPU и моделям' },
  { serviceId: 'cloud', era: 'e2030', demand: 100, note: 'Вычисления — новая коммунальная услуга (оценка-прогноз)' },
  // SaaS
  { serviceId: 'saas', era: 'e2010', demand: 45, note: 'Подписки завоёвывают бизнес' },
  { serviceId: 'saas', era: 'e2020', demand: 80, note: 'Расцвет: покупка софта = подписка' },
  { serviceId: 'saas', era: 'e2026', demand: 70, note: 'Переход к оплате за результат; ИИ встраивается во всё' },
  { serviceId: 'saas', era: 'e2030', demand: 65, note: 'Классический SaaS сжимается, агенты берут на себя рутину (оценка-прогноз)' },
  // Медиа и контент
  { serviceId: 'media', era: 'e2010', demand: 60, note: 'Стриминг и соцсети набирают аудиторию' },
  { serviceId: 'media', era: 'e2020', demand: 85, note: 'Экономика внимания на пике: все дома, все смотрят' },
  { serviceId: 'media', era: 'e2026', demand: 90, note: 'ИИ-контент взрывает объёмы; креаторы против студий' },
  { serviceId: 'media', era: 'e2030', demand: 95, note: 'Персональный контент в реальном времени (оценка-прогноз)' },
  // Медицина
  { serviceId: 'healthcare', era: 'e2010', demand: 65, note: 'Стабильный спрос, цифровизация слабая' },
  { serviceId: 'healthcare', era: 'e2020', demand: 80, note: 'Пандемия показала ценность; телемедицина взлетела' },
  { serviceId: 'healthcare', era: 'e2026', demand: 90, note: 'ИИ-диагностика + старение; самый дорогой сектор услуг' },
  { serviceId: 'healthcare', era: 'e2030', demand: 100, note: 'Персональная превентивная медицина (оценка-прогноз)' },
  // Образование
  { serviceId: 'education', era: 'e2010', demand: 55, note: 'Онлайн-курсы (MOOC) — первый бум' },
  { serviceId: 'education', era: 'e2020', demand: 75, note: 'Удалённое обучение стало нормой' },
  { serviceId: 'education', era: 'e2026', demand: 85, note: 'ИИ-репетиторы и переобучение под ИИ-рынок труда' },
  { serviceId: 'education', era: 'e2030', demand: 90, note: 'Обучение всю жизнь как сервис по подписке (оценка-прогноз)' },
  // Финансы
  { serviceId: 'finance', era: 'e2010', demand: 70, note: 'Финтех-стартапы против банков' },
  { serviceId: 'finance', era: 'e2020', demand: 75, note: 'Цифровые платежи и необанки' },
  { serviceId: 'finance', era: 'e2026', demand: 80, note: 'ИИ-скоринг, фрод-детекция, агентные платежи' },
  { serviceId: 'finance', era: 'e2030', demand: 85, note: 'Автономные финансовые агенты (оценка-прогноз)' },
  // Логистика
  { serviceId: 'logistics', era: 'e2010', demand: 60, note: 'Электронная коммерция растит доставку' },
  { serviceId: 'logistics', era: 'e2020', demand: 80, note: 'Доставка за день; склады на пике' },
  { serviceId: 'logistics', era: 'e2026', demand: 80, note: 'ИИ-планирование, перестройка цепочек' },
  { serviceId: 'logistics', era: 'e2030', demand: 85, note: 'Автономная последняя миля (оценка-прогноз)' }
];
