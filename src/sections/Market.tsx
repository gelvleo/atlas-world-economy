import { useMemo, useState } from 'react';
import type { SectionId } from '../types';
import { NODE_MAP } from '../data/nodes';
import {
  EDTECH_CHAINS,
  EDTECH_CHANNELS,
  EDTECH_COMPETITORS,
  EDTECH_EVIDENCE,
  EDTECH_GATEWAYS,
  EDTECH_PAYBACK,
  EDTECH_SCHOOL_COSTS,
  EDTECH_SEGMENTS,
  EDTECH_TREND,
  EDTECH_TRIGGERS
} from '../data/edtech';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  P0: '#69f0ae',
  P1: '#ffb454',
  P2: '#b39ddb',
  P3: '#90a4ae'
};

const TREND_YEARS = ['2023', '2024', '2025', '2026'] as const;

// Округление вилки окупаемости до одного знака — числа считаются из статей
// экономии в data/edtech.ts, здесь только подача.
const fmtMonths = (m: number) => m.toFixed(1).replace('.', ',');
const fmtRub = (v: number) => Math.round(v).toLocaleString('ru-RU');

export default function Market({ openNode, goTo }: Props) {
  const [activeChain, setActiveChain] = useState(EDTECH_CHAINS[0].id);
  const chain = EDTECH_CHAINS.find((c) => c.id === activeChain)!;

  const trendMax = useMemo(
    () => Math.max(...EDTECH_TREND.flatMap((r) => [r.y2023, r.y2024, r.y2025, r.y2026])),
    []
  );

  const evidence = useMemo(() => Object.values(EDTECH_EVIDENCE), []);

  const base = EDTECH_PAYBACK[0];

  return (
    <div className="section">
      <div className="section-head">
        <h1>🏫 Рынок: русскоязычный EdTech и инфобизнес</h1>
        <p>
          Домен, в котором продаётся наш продукт: онлайн-школы, эксперты и платные Telegram-клубы
          РФ и СНГ. Здесь видно, из чего складываются издержки школы, кто ещё претендует на её
          бюджет и за сколько месяцев своё приложение возвращает вложенные деньги.
        </p>
      </div>

      <div className="block takeaway">
        <h2>⚠️ Отдельный периметр</h2>
        <ul>
          <li>
            Все суммы этого раздела — <strong>рубли РФ и СНГ</strong>. Они не складываются с
            долларовыми агрегатами мировой экономики на «Обзоре» и в «Потоках денег».
          </li>
          <li>
            Оборот школ на GetCourse, рейтинг топ-100 и независимый белый сегмент —{' '}
            <strong>три разные выборки</strong>, они пересекаются и не суммируются между собой.
          </li>
          <li>
            Вкладка отчёта с макро-картиной рынка идёт <strong>без сносок</strong>: её числа
            помечены как <code>proxy</code> и в панелях узлов подписаны как оценка автора отчёта.
          </li>
        </ul>
      </div>

      <div className="hero-stats">
        <div className="stat-card static">
          <div className="stat-value">442 млрд ₽</div>
          <div className="stat-label">GMV рынка, прогноз 2026</div>
          <div className="stat-hint">CAGR 2023–2026 — +5,4%; свыше 86% оборота уже белые</div>
        </div>
        <div className="stat-card static">
          <div className="stat-value">2 300 – 2 700</div>
          <div className="stat-label">школ в целевой полосе 15–80 млн ₽</div>
          <div className="stat-hint">без штатных разработчиков, свыше 75% трафика — смартфон</div>
        </div>
        <div className="stat-card static">
          <div className="stat-value">1,1 – 1,9 млн ₽</div>
          <div className="stat-label">годовая стоимость владения чужим стеком</div>
          <div className="stat-hint">лицензия LMS, видео, боты, техспец — без трафика и эквайринга</div>
        </div>
        <div className="stat-card static">
          <div className="stat-value">{fmtMonths(base.months)} мес</div>
          <div className="stat-label">окупаемость внедрения за 150 тыс. ₽</div>
          <div className="stat-hint">экономия {fmtRub(base.saveMonth)} ₽ в месяц на постоянных расходах</div>
        </div>
      </div>

      <div className="block">
        <h2>Куда уходят деньги школы 15–80 млн ₽</h2>
        <p className="muted">
          Модельная школа с оборотом 35 млн ₽ в год. Клик по карточке открывает узел с фактами и
          источниками.
        </p>
        <div className="dep-grid">
          {EDTECH_SCHOOL_COSTS.map((c) => {
            const n = NODE_MAP[c.nodeId];
            return (
              <div key={c.id} className="dep-card">
                <div className="dep-route">
                  <button className="dep-node" onClick={() => openNode(c.nodeId)}>
                    {n?.emoji} {c.label}
                  </button>
                </div>
                <div className="dep-meta">
                  <span className="dep-strength">{c.year} в год</span>
                  <span className="dep-label">{c.month}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="block">
        <h2>💰 Главный вывод: за сколько возвращаются 150 тысяч</h2>
        <p className="muted">
          Срок считается из статей экономии, а не берётся готовым числом: меняются исходные
          расходы — меняется вилка.
        </p>
        <div className="chain-insight">
          {EDTECH_PAYBACK.map((p) => (
            <div key={p.id} className={p.id === 'p-club' ? 'insight-card ai' : 'insight-card'}>
              <h3>{p.title}</h3>
              <p>
                <strong>
                  {fmtMonths(p.months)} мес · около {Math.round(p.days)} дней
                </strong>
                <br />
                Экономия {fmtRub(p.saveMonth)} ₽ в месяц. {p.basis}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="block-head">
          <h2>Сегменты ICP: кому продаём первыми</h2>
        </div>
        <p className="muted">
          Приоритет P0 — прямой цикл продаж, P1 — после первых внедрений, P2 — только через
          партнёров, P3 — подряд на R&D.
        </p>
        <div className="dep-grid">
          {EDTECH_SEGMENTS.map((s) => {
            const n = NODE_MAP[s.nodeId];
            return (
              <div key={s.id} className="dep-card">
                <div className="dep-route">
                  <button className="dep-node" onClick={() => openNode(s.nodeId)}>
                    {n?.emoji} {s.niche}
                  </button>
                  <span
                    className="kind-badge"
                    style={{
                      background: PRIORITY_COLOR[s.priority] + '22',
                      color: PRIORITY_COLOR[s.priority]
                    }}
                  >
                    {s.priority}
                  </span>
                </div>
                <div className="dep-meta">
                  <span className="dep-strength">{s.band}</span>
                  <span className="dep-label">{s.players} проектов</span>
                </div>
                <p className="dep-desc">
                  Чек {s.avgCheck} · запусков: {s.launches} · сейчас на «{s.platform}» · техспец:{' '}
                  {s.techStaff}. Расход на технику {s.techCostYear} в год, окупаемость {s.payback}.
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="block">
        <h2>Лестница цен: чем закрывают ту же задачу сейчас</h2>
        <p className="muted">
          Между тарифом LMS и заказной студией разрыв в два порядка. Наш чек стоит ровно в этом
          разрыве.
        </p>
        <div className="dep-grid">
          {EDTECH_COMPETITORS.map((c) => (
            <div
              key={c.id}
              className="dep-card"
              style={c.ours ? { borderColor: '#ffd54f' } : undefined}
            >
              <div className="dep-route">
                {c.nodeId ? (
                  <button className="dep-node" onClick={() => openNode(c.nodeId!)}>
                    {c.ours ? '🏭' : '•'} {c.name}
                  </button>
                ) : (
                  <span className="dep-node">{c.name}</span>
                )}
              </div>
              <div className="dep-meta">
                <span className="dep-strength">{c.entry}</span>
                <span className="dep-label">{c.monthly} · {c.time}</span>
              </div>
              <p className="dep-desc">
                {c.type}. {c.scope}. Продают: {c.buyer}.
                <br />
                <strong>{c.ours ? 'Почему мы: ' : 'Аргумент против: '}</strong>
                {c.argument}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <h2>Платёжный контур: что обязано быть в продукте</h2>
        <p className="muted">
          Без рассрочки высокий чек не продаётся: на 60–250 тыс. ₽ приходится 65–82% заёмных
          оплат. Комиссия шлюза — не главный расход, главный — банковский дисконт.
        </p>
        <div className="dep-grid">
          {EDTECH_GATEWAYS.map((g) => (
            <div key={g.id} className="dep-card">
              <div className="dep-route">
                <button className="dep-node" onClick={() => openNode(g.nodeId)}>
                  💳 {g.name}
                </button>
              </div>
              <div className="dep-meta">
                <span className="dep-strength">{g.fee}</span>
                <span className="dep-label">у {g.share} школ · {g.geo}</span>
              </div>
              <p className="dep-desc">
                Рекуррент: {g.recurrent}. Рассрочка: {g.installment}.
                <br />
                <strong>Требование к системе: </strong>
                {g.requirement}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <h2>Триггеры спроса: почему покупают именно сейчас</h2>
        <div className="dep-grid">
          {EDTECH_TRIGGERS.map((t) => (
            <div key={t.id} className="dep-card">
              <div className="dep-route">
                <button className="dep-node" onClick={() => openNode(t.nodeId)}>
                  {NODE_MAP[t.nodeId]?.emoji} {t.event}
                </button>
                <span className="dep-arrow">→</span>
              </div>
              <div className="dep-meta">
                <span className="dep-strength">{t.date}</span>
                <span className="dep-label">{t.whom}</span>
              </div>
              <p className="dep-desc">
                <strong>Боль: </strong>
                {t.pain}
                <br />
                <strong>Ответ продукта: </strong>
                {t.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <h2>Каналы: через кого доходим до ЛПР</h2>
        <div className="dep-grid">
          {EDTECH_CHANNELS.map((ch) => (
            <div key={ch.id} className="dep-card">
              <div className="dep-route">
                <button className="dep-node" onClick={() => openNode(ch.nodeId)}>
                  {NODE_MAP[ch.nodeId]?.emoji} {ch.name}
                </button>
                <span
                  className="kind-badge"
                  style={{
                    background: PRIORITY_COLOR[ch.priority] + '22',
                    color: PRIORITY_COLOR[ch.priority]
                  }}
                >
                  {ch.priority}
                </span>
              </div>
              <div className="dep-meta">
                <span className="dep-strength">{ch.type}</span>
                <span className="dep-label">{ch.reach}</span>
              </div>
              <p className="dep-desc">
                {ch.approach}. <strong>Вознаграждение: </strong>
                {ch.reward}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <h2>Цепочки домена</h2>
        <p className="muted">
          Выбери цепочку и кликай по звеньям — каждое раскрывается в карточку узла.
        </p>
        <div className="chain-tabs">
          {EDTECH_CHAINS.map((c) => (
            <button
              key={c.id}
              className={activeChain === c.id ? 'chain-tab active' : 'chain-tab'}
              onClick={() => setActiveChain(c.id)}
            >
              {c.title}
            </button>
          ))}
        </div>
        <div className="chain-visual">
          {chain.nodes.map((id, i) => {
            const n = NODE_MAP[id];
            if (!n) return null;
            return (
              <div key={id} className="chain-step">
                <button
                  className="chain-node"
                  style={{ borderColor: n.color }}
                  onClick={() => openNode(id)}
                >
                  <span className="chain-node-emoji">{n.emoji}</span>
                  <span className="chain-node-name">{n.name}</span>
                  {n.value && <span className="chain-node-value">{n.value}</span>}
                </button>
                {i < chain.nodes.length - 1 && <div className="chain-link">⬇︎ тянет за собой</div>}
              </div>
            );
          })}
        </div>
        <div className="chain-insight">
          <div className="insight-card">
            <h3>💡 Суть цепочки</h3>
            <p>{chain.insight}</p>
          </div>
        </div>
      </div>

      <div className="block">
        <h2>Динамика рынка 2023 → 2026</h2>
        <p className="muted">
          Млрд рублей по сегментам. Выборки пересекаются, поэтому строки не складываются: строка
          «Совокупный GMV» — это оценка автора отчёта, а не сумма остальных.
        </p>
        <div className="shift-grid">
          {EDTECH_TREND.map((row) => (
            <div key={row.segment} className="shift-card">
              <div className="tl-head">
                <span className="tl-name">{row.segment}</span>
                <span className={row.cagr.startsWith('−') ? 'tl-delta down' : 'tl-delta up'}>
                  {row.cagr}
                </span>
              </div>
              <div className="mini-chart">
                {TREND_YEARS.map((year, i) => {
                  const v = [row.y2023, row.y2024, row.y2025, row.y2026][i];
                  return (
                    <div key={year} className="mini-bar-row">
                      <span className="mini-era">{year}</span>
                      <span className="mini-bar-track">
                        <span
                          className="mini-bar-fill"
                          style={{ width: `${(v / trendMax) * 100}%` }}
                        />
                      </span>
                      <span className="mini-num">{v}</span>
                    </div>
                  );
                })}
              </div>
              <p className="tl-note">{row.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <h2>Источники и периметр домена</h2>
        <p className="muted">
          Тип источника проставлен честно: <code>official</code> — законы и госреестры,{' '}
          <code>company</code> — данные компании о себе, <code>analyst</code> — отраслевой обзор,{' '}
          <code>forecast</code> — прогноз, <code>proxy</code> — косвенная оценка или источник,
          который в отчёте не назван. Где ссылки нет — поле пустое, источник назван словами.
        </p>
        <div className="evidence-list">
          {evidence.map((s) => (
            <div className="evidence-card" key={s.id}>
              <div className="evidence-head">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.label} ↗
                  </a>
                ) : (
                  <span>{s.label}</span>
                )}
                <span className={`evidence-kind ${s.kind}`}>{s.kind}</span>
              </div>
              <div className="evidence-date">{s.date}</div>
              {s.metric && <div className="evidence-metric">{s.metric}</div>}
              {s.scope && <div className="evidence-scope">Периметр: {s.scope}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="crossnav">
        <button className="ghost-btn" onClick={() => goTo('chains')}>
          ← Цепочки зависимостей
        </button>
        <button className="ghost-btn" onClick={() => goTo('overview')}>
          Обзор мировой экономики →
        </button>
      </div>
    </div>
  );
}
