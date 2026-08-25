import { useMemo, useState } from 'react';
import type { AiImpactItem, SectionId } from '../types';
import { NODE_MAP } from '../data/nodes';
import { AI_IMPACTS, AI_STATS } from '../data/ai';
import {
  IconDown,
  IconNext,
  IconPrev,
  IconTransform,
  IconUp,
  NodeGlyph
} from '../ui/icons';
import './mindmap.css';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

type Direction = AiImpactItem['direction'];

// Направление воздействия: метка и знак, без цветной плашки во всю ширину.
const DIRECTIONS: {
  key: Direction;
  label: string;
  tag: string;
  note: string;
  Icon: typeof IconUp;
}[] = [
  {
    key: 'up',
    label: 'Разгон',
    tag: 'tag tag--up',
    note: 'ИИ создаёт дополнительный спрос: чипы, энергия, данные, медицина. Эти рынки растут быстрее экономики в целом.',
    Icon: IconUp
  },
  {
    key: 'down',
    label: 'Сжатие',
    tag: 'tag tag--down',
    note: 'Рутинный труд и типовые услуги дешевеют. Если бизнес построен на продаже часов — модель под давлением.',
    Icon: IconDown
  },
  {
    key: 'transform',
    label: 'Трансформация',
    tag: 'tag tag--accent',
    note: 'Рынки не растут и не падают — меняют правила. Вопрос не «сколько», а «как теперь устроено».',
    Icon: IconTransform
  }
];

const FILTERS: { key: Direction | 'all'; label: string }[] = [
  { key: 'all', label: 'Все эффекты' },
  ...DIRECTIONS.map((d) => ({ key: d.key, label: d.label }))
];

export default function AiImpact({ openNode, goTo }: Props) {
  const [filter, setFilter] = useState<Direction | 'all'>('all');

  const groups = useMemo(
    () =>
      DIRECTIONS.filter((d) => filter === 'all' || filter === d.key).map((d) => ({
        ...d,
        items: AI_IMPACTS.filter((a) => a.direction === d.key)
      })),
    [filter]
  );

  return (
    <div className="section">
      <div className="section-head">
        <p className="kicker">Влияние ИИ</p>
        <h1 className="section-title">Что ИИ делает с отраслями</h1>
        <p className="section-lead">
          ИИ — не отрасль, а фактор, который меняет все отрасли сразу: где-то разгоняет спрос,
          где-то обесценивает труд, где-то переписывает правила рынка.
        </p>
      </div>

      <div className="stack stack--tight">
        <p className="kicker">Цифры, на которые опирается раздел</p>
        <div className="list">
          {AI_STATS.map((s) => (
            <div className="list-row" key={s.label}>
              <span className="list-main">
                {s.label} <span className="meta">· {s.hint}</span>
              </span>
              <span className="list-side">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="toolbar">
        <div className="seg" role="group" aria-label="Направление воздействия">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className="seg-btn"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {groups.map((g) => (
        <section className="stack" key={g.key}>
          <div className="impact-group-head">
            <span className={g.tag}>
              <g.Icon />
              {g.label}
            </span>
            <p className="meta">{g.note}</p>
          </div>

          <div className="list">
            {g.items.map((a) => {
              const node = NODE_MAP[a.targetId];
              return (
                <div className="list-row impact-row" key={a.id}>
                  <div className="list-main stack stack--tight">
                    <div className="row row--wrap">
                      <b>{a.title}</b>
                      <span className="tag">влияние {a.magnitude}</span>
                    </div>
                    {node && (
                      <button className="impact-target" onClick={() => openNode(a.targetId)}>
                        <NodeGlyph node={node} />
                        <span>{node.name}</span>
                      </button>
                    )}
                    <div className="impact-when">
                      <div className="stack stack--tight">
                        <span className="kicker">Сейчас</span>
                        <span className="meta">{a.now}</span>
                      </div>
                      <div className="stack stack--tight">
                        <span className="kicker">
                          К 2030 <span className="tag tag--warn">прогноз</span>
                        </span>
                        <span className="meta">{a.by2030}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <hr className="hair" />

      <div className="grid grid--55">
        <div className="stack stack--loose">
          <div className="section-head">
            <p className="kicker">Как читать</p>
            <h2 className="h2">Три направления</h2>
          </div>
          <div className="list">
            {DIRECTIONS.map((d) => (
              <div className="list-row" key={d.key}>
                <span className="list-main">
                  <span className={d.tag}>
                    <d.Icon />
                    {d.label}
                  </span>{' '}
                  <span className="meta">{d.note}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="stack stack--loose">
          <div className="section-head">
            <p className="kicker">Вывод</p>
            <h2 className="h2">Что с этим делать</h2>
          </div>
          <div className="list">
            <div className="list-row">
              <span className="list-main">
                <b>Узкие места решают всё.</b>{' '}
                <span className="meta">
                  Маржу забирает тот, кто контролирует дефицит: сегодня это электричество и
                  передовые чипы.
                </span>
              </span>
            </div>
            <div className="list-row">
              <span className="list-main">
                <b>Продавай результат, не часы.</b>{' '}
                <span className="meta">
                  Агенты обесценивают время как единицу продажи; ценность — в измеряемом исходе.
                </span>
              </span>
            </div>
            <div className="list-row">
              <span className="list-main">
                <b>Данные — актив.</b>{' '}
                <span className="meta">
                  Уникальные доменные данные — единственный ров, который ИИ не копирует.
                </span>
              </span>
            </div>
            <div className="list-row">
              <span className="list-main">
                <b>Человеческое дорожает.</b>{' '}
                <span className="meta">
                  Доверие, забота и экспертиза — ниши, где ИИ поднимает премию, а не сбивает цену.
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="crossnav">
        <button className="btn btn--ghost" onClick={() => goTo('timeline')}>
          <IconPrev /> Динамика услуг
        </button>
        <button className="btn btn--ghost" onClick={() => goTo('overview')}>
          К обзору <IconNext />
        </button>
      </div>
    </div>
  );
}
