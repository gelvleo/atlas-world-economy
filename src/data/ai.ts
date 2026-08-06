import type { AiImpactItem } from '../types';

export const AI_IMPACTS: AiImpactItem[] = [
  { id: 'ai-medical-data', title: 'Медицинские данные', targetId: 'health_data', direction: 'up', magnitude: 'структурное', now: 'ИИ повышает ценность качественных, связанных и разрешённых к использованию health data.', by2030: 'Персональные longitudinal datasets становятся основой preventive и clinical workflows.' },
  { id: 'ai-medical-clinical', title: 'Medical AI и диагностика', targetId: 'medical_ai', direction: 'up', magnitude: 'высокое', now: 'Растёт число AI/ML-enabled medical devices, но авторизация не заменяет клиническую валидацию.', by2030: 'Medical AI встраивается в workflow с постоянным мониторингом качества и drift.' },
  { id: 'ai-care-delivery', title: 'Care delivery', targetId: 'care_delivery', direction: 'transform', magnitude: 'структурное', now: 'AI навигирует, суммирует и снимает административную нагрузку; ответственность остаётся у care team.', by2030: 'Гибридные команды распределяют triage, сопровождение и эскалацию между людьми и агентами.' },
  {
    id: 'ai-software',
    title: 'Инженерия ПО и агентские системы',
    targetId: 'software_engineering',
    direction: 'transform',
    magnitude: 'структурное',
    now: 'ИИ ускоряет написание кода, но повышает спрос на архитектуру, интеграции, evals и безопасность.',
    by2030: 'Команды продают работающие системы и результат, а не часы и объём кода.'
  },
  {
    id: 'ai-healthtech',
    title: 'Healthtech и клинические данные',
    targetId: 'healthtech',
    direction: 'up',
    magnitude: 'высокое',
    now: 'ИИ усиливает диагностику, маршрутизацию и административные процессы при дефиците качественных данных.',
    by2030: 'Интегрированные health-платформы связывают данные, клинику и персональное сопровождение.'
  },
  {
    id: 'ai-vertical-health',
    title: 'Femtech, longevity и mental health',
    targetId: 'femtech',
    direction: 'transform',
    magnitude: 'структурное',
    now: 'ИИ снижает стоимость навигации и персонализации, но не заменяет клиническую ответственность.',
    by2030: 'Вертикальные health-продукты строятся вокруг доменных данных, доверия и доказуемого результата.'
  },
  { id: 'ai-1', title: 'Разработка ПО', targetId: 'it_outsourcing', direction: 'down', magnitude: 'структурное', now: 'ИИ пишет 30-50% нового кода в крупных компаниях (оценка).', by2030: 'Большая часть типового кода генерируется агентами.' },
  { id: 'ai-2', title: 'Спрос на вычисления и чипы', targetId: 'semiconductors', direction: 'up', magnitude: 'высокое', now: 'ИИ-нагрузки — главный драйвер роста рынка полупроводников.', by2030: 'Инференс обгонит обучение по объёму.' },
  { id: 'ai-3', title: 'Энергопотребление', targetId: 'energy', direction: 'up', magnitude: 'структурное', now: 'Дата-центры конкурируют за мегаватты.', by2030: 'Доля дата-центров в мировом потреблении электричества может удвоиться (оценка).' },
  { id: 'ai-4', title: 'Производство контента', targetId: 'media', direction: 'transform', magnitude: 'высокое', now: 'Генерация текста, изображений и видео почти бесплатна.', by2030: 'Персональные фильмы и игры «под зрителя».' },
  { id: 'ai-5', title: 'Диагностика и администрирование', targetId: 'healthcare', direction: 'up', magnitude: 'высокое', now: 'ИИ читает снимки, снимает бюрократию.', by2030: 'ИИ-ассистент у каждого врача.' },
  { id: 'ai-6', title: 'Бизнес-софт и подписки', targetId: 'saas', direction: 'transform', magnitude: 'структурное', now: 'Модель «за место» сменяется «за результат».', by2030: 'Софт = команда агентов с человеком-контролёром.' },
  { id: 'ai-7', title: 'Обучение и навыки', targetId: 'education', direction: 'up', magnitude: 'среднее', now: 'ИИ-репетиторы дают персональное обучение за копейки.', by2030: 'Непрерывное обучение встроено в работу.' },
  { id: 'ai-8', title: 'Физический труд и роботы', targetId: 'robotics', direction: 'up', magnitude: 'высокое', now: 'ИИ дал роботам обучение на демонстрациях.', by2030: 'Роботы массово на складах и в сервисе (оценка).' },
  { id: 'ai-9', title: 'Данные и их ценность', targetId: 'data', direction: 'up', magnitude: 'высокое', now: 'Открытые данные для обучения почти исчерпаны.', by2030: 'Уникальные доменные данные = главное преимущество.' },
  { id: 'ai-10', title: 'География производства', targetId: 'manufacturing', direction: 'transform', magnitude: 'среднее', now: 'Автоматизация снижает ценность дешёвой рабочей силы.', by2030: '«Решоринг» усиливается (оценка).' },
  { id: 'ai-11', title: 'Платежи и финансовые услуги', targetId: 'finance', direction: 'transform', magnitude: 'среднее', now: 'ИИ в фрод-детекции и скоринге — стандарт.', by2030: 'Значительная часть транзакций инициируется агентами.' },
  { id: 'ai-12', title: 'Регулирование как рынок', targetId: 'regulation', direction: 'up', magnitude: 'среднее', now: 'AI Act и экспортные ограничения создают спрос на комплаенс-услуги.', by2030: 'Аудит ИИ-систем — такая же норма, как финансовый аудит (оценка).' }
];

export const AI_STATS = [
  { label: 'Мировой ВВП 2026', value: '$126.3 трлн', hint: 'оценка, номинал' },
  { label: 'Доля услуг в ВВП', value: '60-65%', hint: 'оценка' },
  { label: 'Рынок полупроводников к 2030', value: '$1.5 трлн', hint: 'отраслевые оценки' },
  { label: 'Рост capex дата-центров', value: '+57% г/г', hint: 'оценка 2026' },
  { label: 'Доля NVIDIA в AI-GPU', value: '80-90%', hint: 'оценка' }
];
