import { useMemo, useState } from 'react';
import type { SectionId, EraKey } from '../types';
import { NODE_MAP } from '../data/nodes';
import { ERAS, SERVICE_ERAS } from '../data/timeline';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

const ERA_COLORS: Record<EraKey, string> = {
  e2010: '#8f9bff',
  e2020: '#7fc8ff',
  e2026: '#69f0ae',
  e2030: '#ffd166'
};

export default function Timeline({ openNode, goTo }: Props) {
  const [era, setEra] = useState<EraKey>('e2026');

  const services = useMemo(() => {
    const ids = [...new Set(SERVICE_ERAS.map((s) => s.serviceId))];
    return ids
      .map((id) => {
        const node = NODE_MAP[id];
        const stats = SERVICE_ERAS.filter((s) => s.serviceId === id);
        const cur = stats.find((s) => s.era === era);
        const prev = stats.find((s) => s.era === (era === 'e2020' ? 'e2010' : era === 'e2026' ? 'e2020' : 'e2026'));
        return { id, node, stats, cur, prev, delta: (cur?.demand ?? 0) - (prev?.demand ?? 0) };
      })
      .sort((a, b) => (b.cur?.demand ?? 0) - (a.cur?.demand ?? 0));
  }, [era]);

  const eraInfo = ERAS.find((e) => e.key === era)!;

  return (
    <div className="section">
      <div className="section-head">
        <h1>📈 Динамика услуг: что было популярно и почему</h1>
        <p>
          Спрос на услуги не статичен: в 2010-х мир покупал «дешёвые руки», в 2020-х — цифровые
          рельсы, сейчас — результат работы ИИ. Переключай эпохи и смотри, как переезжает спрос.
          Шкала — относительная популярность (0-100, оценка).
        </p>
      </div>

      <div className="era-switch">
        {ERAS.map((e) => (
          <button
            key={e.key}
            className={era === e.key ? 'era-switch-btn active' : 'era-switch-btn'}
            style={era === e.key ? { borderColor: ERA_COLORS[e.key] } : undefined}
            onClick={() => setEra(e.key)}
          >
            <span className="era-switch-label">{e.label}</span>
          </button>
        ))}
      </div>

      <div className="era-summary" style={{ borderLeftColor: ERA_COLORS[era] }}>
        <h2>{eraInfo.title}</h2>
        <p>{eraInfo.summary}</p>
      </div>

      <div className="timeline-grid">
        {services.map(({ id, node, stats, cur, delta }) => {
          if (!node || !cur) return null;
          return (
            <div key={id} className="tl-card">
              <button className="tl-head" onClick={() => openNode(id)}>
                <span className="tl-emoji">{node.emoji}</span>
                <span className="tl-name">{node.name}</span>
                <span
                  className={delta > 0 ? 'tl-delta up' : delta < 0 ? 'tl-delta down' : 'tl-delta flat'}
                  title="Изменение к предыдущей эпохе"
                >
                  {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : '■ 0'}
                </span>
                <span className="tl-demand">{cur.demand}</span>
              </button>

              <div className="tl-spark">
                {stats.map((s) => (
                  <div key={s.era} className="tl-spark-col" title={`${s.era}: ${s.demand} — ${s.note}`}>
                    <div
                      className={s.era === era ? 'tl-spark-bar active' : 'tl-spark-bar'}
                      style={{ height: `${s.demand}%`, background: ERA_COLORS[s.era] }}
                    />
                  </div>
                ))}
              </div>

              <p className="tl-note">{cur.note}</p>
            </div>
          );
        })}
      </div>

      <div className="block">
        <h2>Почему спрос переехал: три сдвига</h2>
        <div className="shift-grid">
          <div className="shift-card">
            <h3>1. Дешевизна перестала быть ценностью</h3>
            <p>
              В 2010-х покупали «то же самое, но дешевле». ИИ сделал рутину почти бесплатной —
              теперь платят за результат, скорость и экспертизу. Аутсорсинг сжимается первым.
            </p>
            <button className="ghost-btn" onClick={() => openNode('it_outsourcing')}>
              Смотреть IT-аутсорсинг →
            </button>
          </div>
          <div className="shift-card">
            <h3>2. Инфраструктура стала продуктом</h3>
            <p>
              Облака и вычисления превратились из «экономии» в стратегический актив. Доступ к
              GPU и моделям — это доступ к возможностям, за который платят премию.
            </p>
            <button className="ghost-btn" onClick={() => openNode('cloud')}>
              Смотреть облака →
            </button>
          </div>
          <div className="shift-card">
            <h3>3. «Человеческое» подорожало</h3>
            <p>
              Чем больше делает ИИ, тем выше премия за доверие, заботу и контакт: медицина,
              образование, уход, ремесло. Автоматизация и «человечность» растут одновременно.
            </p>
            <button className="ghost-btn" onClick={() => openNode('healthcare')}>
              Смотреть медицину →
            </button>
          </div>
        </div>
      </div>

      <div className="crossnav">
        <button className="ghost-btn" onClick={() => goTo('chains')}>← Цепочки зависимостей</button>
        <button className="ghost-btn" onClick={() => goTo('ai')}>Влияние ИИ →</button>
      </div>
    </div>
  );
}
