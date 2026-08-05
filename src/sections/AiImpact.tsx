import { useMemo, useState } from 'react';
import type { SectionId } from '../types';
import { NODE_MAP } from '../data/nodes';
import { AI_IMPACTS, AI_STATS } from '../data/ai';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

const DIR_META = {
  up: { icon: '📈', label: 'разгоняет спрос', cls: 'up' },
  down: { icon: '📉', label: 'сжимает спрос', cls: 'down' },
  transform: { icon: '🔄', label: 'переписывает правила', cls: 'transform' }
};

const FILTERS = [
  { key: 'all', label: 'Все эффекты' },
  { key: 'up', label: '📈 Разгон' },
  { key: 'down', label: '📉 Сжатие' },
  { key: 'transform', label: '🔄 Трансформация' }
];

export default function AiImpact({ openNode, goTo }: Props) {
  const [filter, setFilter] = useState('all');

  const impacts = useMemo(
    () => (filter === 'all' ? AI_IMPACTS : AI_IMPACTS.filter((a) => a.direction === filter)),
    [filter]
  );

  return (
    <div className="section">
      <div className="section-head">
        <h1>🤖 Влияние технологий и ИИ</h1>
        <p>
          ИИ — не отрасль, а фактор, который меняет все отрасли сразу: где-то разгоняет спрос,
          где-то обесценивает труд, где-то создаёт новые рынки. Клик по карточке — связанный узел
          экономики со всеми его зависимостями.
        </p>
      </div>

      <div className="hero-stats">
        {AI_STATS.map((s) => (
          <div key={s.label} className="stat-card static">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-hint">{s.hint}</div>
          </div>
        ))}
      </div>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={filter === f.key ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="impact-grid">
        {impacts.map((a) => {
          const node = NODE_MAP[a.targetId];
          const meta = DIR_META[a.direction];
          return (
            <div key={a.id} className="impact-card">
              <div className="impact-head">
                <span className={`impact-dir ${meta.cls}`}>{meta.icon} {meta.label}</span>
                <span className="impact-mag">влияние: {a.magnitude}</span>
              </div>
              <h3>{a.title}</h3>
              <button className="impact-target" onClick={() => openNode(a.targetId)}>
                {node?.emoji} {node?.name} →
              </button>
              <div className="impact-body">
                <div className="impact-now">
                  <strong>Сейчас</strong>
                  <p>{a.now}</p>
                </div>
                <div className="impact-future">
                  <strong>К 2030</strong>
                  <p>{a.by2030}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="block">
        <h2>Как читать эту карту</h2>
        <div className="shift-grid">
          <div className="shift-card">
            <h3>📈 Разгон</h3>
            <p>
              ИИ создаёт дополнительный спрос: чипы, энергия, данные, медицина. Эти рынки растут
              быстрее экономики в целом — там появляются деньги и заказы.
            </p>
          </div>
          <div className="shift-card">
            <h3>📉 Сжатие</h3>
            <p>
              Рутинный труд и типовые услуги дешевеют: базовый код, переводы, поддержка, ввод
              данных. Если бизнес построен на продаже часов — модель под давлением.
            </p>
          </div>
          <div className="shift-card">
            <h3>🔄 Трансформация</h3>
            <p>
              Рынки не растут и не падают — меняют правила: медиа, софт, финансы. Старые лидеры
              рискуют не меньше новичков. Вопрос не «сколько», а «как теперь устроено».
            </p>
          </div>
        </div>
      </div>

      <div className="block takeaway">
        <h2>Вывод для решений</h2>
        <ul>
          <li>
            <strong>Узкие места решают всё.</strong> В каждой цепочке маржу забирает тот, кто
            контролирует дефицит: сегодня это электричество и передовые чипы.
          </li>
          <li>
            <strong>Продавай результат, не часы.</strong> ИИ-агенты обесценивают время как единицу
            продажи; ценность — в измеряемом исходе.
          </li>
          <li>
            <strong>Данные = актив.</strong> Уникальные доменные данные — единственный «ров»,
            который ИИ не может скопировать.
          </li>
          <li>
            <strong>Человеческое дорожает.</strong> Доверие, забота и экспертиза — ниши, где ИИ
            поднимает премию, а не сбивает цену.
          </li>
        </ul>
      </div>

      <div className="crossnav">
        <button className="ghost-btn" onClick={() => goTo('timeline')}>← Динамика услуг</button>
        <button className="ghost-btn" onClick={() => goTo('overview')}>К обзору →</button>
      </div>
    </div>
  );
}
