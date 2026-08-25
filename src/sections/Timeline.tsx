import { useMemo, useState } from 'react';
import type { SectionId, EraKey } from '../types';
import { NODE_MAP } from '../data/nodes';
import { ERAS, SERVICE_ERAS } from '../data/timeline';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

// Предыдущая эпоха для расчёта дельты. Для самой ранней дельты нет.
const PREV_ERA: Record<EraKey, EraKey | null> = {
  e2010: null,
  e2020: 'e2010',
  e2026: 'e2020',
  e2030: 'e2026'
};

const SHIFTS = [
  {
    id: 'it_outsourcing',
    title: 'Дешевизна перестала быть ценностью',
    text: 'В 2010-х покупали «то же самое, но дешевле». ИИ сделал рутину почти бесплатной — теперь платят за результат и экспертизу. Аутсорсинг сжимается первым.',
    link: 'IT-аутсорсинг'
  },
  {
    id: 'cloud',
    title: 'Инфраструктура стала продуктом',
    text: 'Облака и вычисления из статьи экономии превратились в стратегический актив: доступ к GPU и моделям продаётся с премией.',
    link: 'Облака'
  },
  {
    id: 'healthcare',
    title: '«Человеческое» подорожало',
    text: 'Чем больше делает ИИ, тем выше премия за доверие и контакт: медицина, образование, уход. Автоматизация и «человечность» растут вместе.',
    link: 'Медицина'
  }
];

export default function Timeline({ openNode, goTo }: Props) {
  const [era, setEra] = useState<EraKey>('e2026');

  const services = useMemo(() => {
    const ids = [...new Set(SERVICE_ERAS.map((s) => s.serviceId))];
    const prevKey = PREV_ERA[era];
    return ids
      .map((id) => {
        const node = NODE_MAP[id];
        const byEra = Object.fromEntries(
          SERVICE_ERAS.filter((s) => s.serviceId === id).map((s) => [s.era, s])
        ) as Partial<Record<EraKey, (typeof SERVICE_ERAS)[number]>>;
        const cur = byEra[era];
        const prev = prevKey ? byEra[prevKey] : undefined;
        return {
          id,
          node,
          byEra,
          cur,
          delta: prev && cur ? cur.demand - prev.demand : null
        };
      })
      .filter((s) => s.node && s.cur)
      .sort((a, b) => (b.cur?.demand ?? 0) - (a.cur?.demand ?? 0));
  }, [era]);

  const eraInfo = ERAS.find((e) => e.key === era)!;

  // Сильнейшие движения к выбранной эпохе — считаются из тех же оценок, не из отдельного списка.
  const movers = useMemo(
    () =>
      services
        .filter((s) => s.delta !== null)
        .sort((a, b) => Math.abs(b.delta!) - Math.abs(a.delta!))
        .slice(0, 6),
    [services]
  );

  return (
    <div className="section">
      <div className="section-head">
        <div className="kicker">Динамика услуг</div>
        <h1 className="section-title">Куда переехал спрос</h1>
        <p className="section-lead">
          В 2010-х мир покупал «дешёвые руки», в 2020-х — цифровые рельсы, сейчас — результат
          работы ИИ. Переключай эпоху: строки пересортируются по спросу этой эпохи.
        </p>
        <p className="stat-note">
          Спрос здесь — относительная оценка популярности услуги по шкале 0–100, а не измеренная
          величина. Колонка «к 2030» — прогноз-ориентир. Источника у этих чисел нет: они заданы в
          данных проекта как экспертная шкала и годятся для сравнения строк между собой, но не для
          подстановки в расчёты.
        </p>
      </div>

      <div className="toolbar">
        <div className="seg" role="group" aria-label="Эпоха">
          {ERAS.map((e) => (
            <button
              key={e.key}
              className="seg-btn"
              aria-pressed={era === e.key}
              onClick={() => setEra(e.key)}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div className="note">
        <div className="kicker">{eraInfo.label}</div>
        <h2 className="section-title">{eraInfo.title}</h2>
        <p className="section-lead">{eraInfo.summary}</p>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Услуга</th>
              {ERAS.map((e) => (
                <th
                  key={e.key}
                  scope="col"
                  className="num"
                  data-active={e.key === era ? '' : undefined}
                >
                  {e.label}
                </th>
              ))}
              <th scope="col">Профиль</th>
              <th scope="col" className="num">
                Δ
              </th>
            </tr>
          </thead>
          <tbody>
            {services.map(({ id, node, byEra, cur, delta }) => (
              <tr key={id}>
                <td>
                  <button className="link" onClick={() => openNode(id)}>
                    {node!.name}
                  </button>
                  <span className="stat-note">{cur!.note}</span>
                </td>
                {ERAS.map((e) => (
                  <td
                    key={e.key}
                    className="num"
                    data-active={e.key === era ? '' : undefined}
                  >
                    {byEra[e.key]?.demand ?? '—'}
                  </td>
                ))}
                <td>
                  <span className="bar">
                    <span className="bar-fill" style={{ width: `${cur!.demand}%` }} />
                  </span>
                </td>
                <td className="num">
                  {delta === null ? '—' : delta > 0 ? `+${delta}` : delta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hair" />

      <div className="grid grid--73">
        <div className="stack">
          <div className="section-head">
            <h2 className="section-title">Почему спрос переехал</h2>
          </div>
          <div className="list">
            {SHIFTS.map((s) => (
              <div key={s.id} className="list-row">
                <span className="list-main">
                  <span>{s.title}</span>
                  <span className="stat-note">{s.text}</span>
                </span>
                <span className="list-side">
                  <button className="link" onClick={() => openNode(s.id)}>
                    {s.link}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="section-head">
            <h2 className="section-title">Сильнее всего сдвинулось</h2>
            <p className="section-lead">
              Разница оценки с предыдущей эпохой, пункты шкалы.
            </p>
          </div>
          {movers.length === 0 ? (
            <div className="empty">
              <p>У первой эпохи нет предыдущей — сравнивать не с чем.</p>
              <button className="btn btn--ghost" onClick={() => setEra('e2020')}>
                Перейти к 2020–2023
              </button>
            </div>
          ) : (
            <div className="list">
              {movers.map(({ id, node, delta }) => (
                <button key={id} className="list-row" onClick={() => openNode(id)}>
                  <span className="list-main">{node!.name}</span>
                  <span className="list-side num">{delta! > 0 ? `+${delta}` : delta}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="crossnav">
        <button className="btn btn--ghost" onClick={() => goTo('chains')}>
          Цепочки зависимостей
        </button>
        <button className="btn btn--ghost" onClick={() => goTo('ai')}>
          Влияние ИИ
        </button>
      </div>
    </div>
  );
}
