import { useMemo, useState } from 'react';
import type { EvidenceKind, SectionId } from '../types';
import { NODE_MAP } from '../data/nodes';
import { EvidenceTag, NodeEvidenceTag, evidenceKind } from './Overview';
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

const TREND_YEARS = ['2023', '2024', '2025', '2026'] as const;

// Округление вилки окупаемости до одного знака — числа считаются из статей
// экономии в data/edtech.ts, здесь только подача.
const fmtMonths = (m: number) => m.toFixed(1).replace('.', ',');
const fmtRub = (v: number) => Math.round(v).toLocaleString('ru-RU');

// Верхние числа раздела: число и единица разводятся по разным тонам.
// Значение узла в данных бывает не числом, а фразой в несколько слов
// («$10.9 млрд agents · $64 млрд AI platform…»). В правую числовую колонку идёт
// только короткое значение, длинное уходит подписью под именем: иначе строка
// с nowrap распирает страницу на узком экране.
const SHORT_VALUE = 22;

// Числа вкладки 2 отчёта идут без сносок и в data/edtech.ts прямо помечены как
// proxy — отсюда «оценка». GMV 2026 в самой подписи назван прогнозом.
const TREND_KIND: EvidenceKind = 'proxy';

const TOP_STATS: {
  num: string;
  unit: string;
  label: string;
  note: string;
  kind: EvidenceKind;
}[] = [
  {
    num: '442',
    unit: 'млрд ₽',
    label: 'GMV рынка, прогноз 2026',
    note: 'CAGR 2023–2026 — +5,4%; свыше 86% оборота уже белые',
    kind: 'forecast'
  },
  {
    num: '2 300 – 2 700',
    unit: 'школ',
    label: 'в целевой полосе 15–80 млн ₽',
    note: 'без штатных разработчиков, свыше 75% трафика — смартфон',
    kind: 'proxy'
  },
  {
    num: '1,1 – 1,9',
    unit: 'млн ₽ в год',
    label: 'стоимость владения чужим стеком',
    note: 'лицензия LMS, видео, боты, техспец — без трафика и эквайринга',
    kind: 'proxy'
  }
];

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
        <div className="kicker">Рынок EdTech</div>
        <h1 className="section-title">Русскоязычный EdTech и инфобизнес</h1>
        <p className="section-lead">
          Домен, в котором продаётся наш продукт: онлайн-школы, эксперты и платные Telegram-клубы
          РФ и СНГ. Здесь видно, из чего складываются издержки школы, кто ещё претендует на её
          бюджет и за сколько месяцев своё приложение возвращает вложенные деньги.
        </p>
      </div>

      <div className="note">
        <div className="kicker">Отдельный периметр</div>
        <div className="list">
          <div className="list-row">
            <span className="list-main">
              Все суммы раздела — рубли РФ и СНГ. Они не складываются с долларовыми агрегатами
              мировой экономики на «Обзоре» и в «Потоках денег».
            </span>
          </div>
          <div className="list-row">
            <span className="list-main">
              Оборот школ на GetCourse, рейтинг топ-100 и независимый белый сегмент — три разные
              выборки: они пересекаются и не суммируются между собой.
            </span>
          </div>
          <div className="list-row">
            <span className="list-main">
              Вкладка отчёта с макро-картиной рынка идёт без сносок: её числа помечены как proxy и
              в панелях узлов подписаны как оценка автора отчёта.
            </span>
          </div>
        </div>
      </div>

      <div className="stats">
        {TOP_STATS.map((s) => (
          <div key={s.label} className="stat">
            <span className="stat-num">
              {s.num}
              <span className="stat-unit">{s.unit}</span>
            </span>
            <span className="stat-label">{s.label}</span>
            <span className="stat-note">
              <EvidenceTag kind={s.kind} /> {s.note}
            </span>
          </div>
        ))}
        <div className="stat">
          <span className="stat-num">
            {fmtMonths(base.months)}
            <span className="stat-unit">мес</span>
          </span>
          <span className="stat-label">окупаемость внедрения за 150 тыс. ₽</span>
          <span className="stat-note">
            {/* Срок считается из вилок расходов, а вилки — оценки: измерением он не станет. */}
            <EvidenceTag kind="proxy" /> экономия {fmtRub(base.saveMonth)} ₽ в месяц на
            постоянных расходах
          </span>
        </div>
      </div>

      <div className="hair" />

      <div className="grid grid--73">
        <div className="stack">
          <div className="section-head">
            <h2 className="section-title">Куда уходят деньги школы 15–80 млн ₽</h2>
            <p className="section-lead">
              Модельная школа с оборотом 35 млн ₽ в год. Клик по статье открывает узел с фактами и
              источниками.
            </p>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Статья расхода</th>
                  <th scope="col" className="num">
                    Вилка в год
                  </th>
                  <th scope="col" className="num">
                    Вилка в месяц
                  </th>
                </tr>
              </thead>
              <tbody>
                {EDTECH_SCHOOL_COSTS.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="row row--wrap">
                        <button className="link" onClick={() => openNode(c.nodeId)}>
                          {c.label}
                        </button>
                        <NodeEvidenceTag id={c.nodeId} />
                      </span>
                    </td>
                    <td className="num">{c.year}</td>
                    <td className="num">{c.month}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="section-head">
            <h2 className="section-title">За сколько возвращаются 150 тысяч</h2>
            <p className="section-lead">
              Срок считается из статей экономии, а не берётся готовым числом: меняются исходные
              расходы — меняется вилка.
            </p>
          </div>
          <div className="list">
            {EDTECH_PAYBACK.map((p) => (
              <div key={p.id} className="list-row">
                <span className="list-main">
                  <span>{p.title}</span>
                  <span className="stat-note">
                    Экономия {fmtRub(p.saveMonth)} ₽ в месяц. {p.basis}
                  </span>
                </span>
                <span className="list-side num">
                  {fmtMonths(p.months)}
                  <span className="stat-unit">мес</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Сегменты: кому продаём первыми</h2>
        <p className="section-lead">
          P0 — прямой цикл продаж, P1 — после первых внедрений, P2 — только через партнёров,
          P3 — подряд на R&amp;D.
        </p>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Ниша</th>
              <th scope="col">Приоритет</th>
              <th scope="col" className="num">
                Оборот
              </th>
              <th scope="col" className="num">
                Проектов
              </th>
              <th scope="col" className="num">
                Средний чек
              </th>
              <th scope="col" className="num">
                Запусков в год
              </th>
              <th scope="col">Платформа сейчас</th>
              <th scope="col">Техспец</th>
              <th scope="col" className="num">
                Техника в год
              </th>
              <th scope="col" className="num">
                Окупаемость
              </th>
            </tr>
          </thead>
          <tbody>
            {EDTECH_SEGMENTS.map((s) => (
              <tr key={s.id}>
                <td>
                  <span className="row row--wrap">
                    <button className="link" onClick={() => openNode(s.nodeId)}>
                      {s.niche}
                    </button>
                    <NodeEvidenceTag id={s.nodeId} />
                  </span>
                </td>
                <td>
                  <span className="tag">{s.priority}</span>
                </td>
                <td className="num">{s.band}</td>
                <td className="num">{s.players}</td>
                <td className="num">{s.avgCheck}</td>
                <td className="num">{s.launches}</td>
                <td>{s.platform}</td>
                <td>{s.techStaff}</td>
                <td className="num">{s.techCostYear}</td>
                <td className="num">{s.payback}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Лестница цен на ту же задачу</h2>
        <p className="section-lead">
          Между тарифом LMS и заказной студией разрыв в два порядка. Наш чек стоит ровно в этом
          разрыве.
        </p>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Решение</th>
              <th scope="col">Тип</th>
              <th scope="col" className="num">
                Вход
              </th>
              <th scope="col" className="num">
                В месяц
              </th>
              <th scope="col" className="num">
                Срок
              </th>
              <th scope="col">Что входит и кому продают</th>
              <th scope="col">Аргумент</th>
            </tr>
          </thead>
          <tbody>
            {EDTECH_COMPETITORS.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="row row--wrap">
                    {c.nodeId ? (
                      <button className="link" onClick={() => openNode(c.nodeId!)}>
                        {c.name}
                      </button>
                    ) : (
                      <span>{c.name}</span>
                    )}
                    {c.ours && <span className="tag">это мы</span>}
                    <NodeEvidenceTag id={c.nodeId} />
                  </span>
                </td>
                <td>{c.type}</td>
                <td className="num">{c.entry}</td>
                <td className="num">{c.monthly}</td>
                <td className="num">{c.time}</td>
                <td>
                  {c.scope}
                  <span className="stat-note">Продают: {c.buyer}</span>
                </td>
                <td>{c.argument}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Платёжный контур: что обязано быть в продукте</h2>
        <p className="section-lead">
          Без рассрочки высокий чек не продаётся: на 60–250 тыс. ₽ приходится 65–82% заёмных
          оплат. Комиссия шлюза — не главный расход, главный — банковский дисконт.
        </p>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Шлюз</th>
              <th scope="col" className="num">
                Комиссия
              </th>
              <th scope="col" className="num">
                Доля школ
              </th>
              <th scope="col">Рекуррент</th>
              <th scope="col">Рассрочка</th>
              <th scope="col">География</th>
              <th scope="col">Требование к системе</th>
            </tr>
          </thead>
          <tbody>
            {EDTECH_GATEWAYS.map((g) => (
              <tr key={g.id}>
                <td>
                  <span className="row row--wrap">
                    <button className="link" onClick={() => openNode(g.nodeId)}>
                      {g.name}
                    </button>
                    <NodeEvidenceTag id={g.nodeId} />
                  </span>
                </td>
                <td className="num">{g.fee}</td>
                <td className="num">{g.share}</td>
                <td>{g.recurrent}</td>
                <td>{g.installment}</td>
                <td>{g.geo}</td>
                <td>{g.requirement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hair" />

      <div className="grid grid--55">
        <div className="stack">
          <div className="section-head">
            <h2 className="section-title">Триггеры спроса</h2>
            <p className="section-lead">Почему покупают именно сейчас.</p>
          </div>
          <div className="list">
            {EDTECH_TRIGGERS.map((t) => (
              <button key={t.id} className="list-row" onClick={() => openNode(t.nodeId)}>
                <span className="list-main">
                  <span>{t.event}</span>
                  <span className="stat-note">
                    Кого касается: {t.whom}. Боль: {t.pain} Ответ продукта: {t.answer}
                  </span>
                </span>
                <span className="list-side num">{t.date}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="section-head">
            <h2 className="section-title">Каналы до ЛПР</h2>
            <p className="section-lead">Через кого доходим до тех, кто платит.</p>
          </div>
          <div className="list">
            {EDTECH_CHANNELS.map((ch) => (
              <button key={ch.id} className="list-row" onClick={() => openNode(ch.nodeId)}>
                <span className="list-main">
                  <span>{ch.name}</span>
                  <span className="stat-note">
                    {ch.type} · охват {ch.reach}. {ch.approach}. Вознаграждение: {ch.reward}
                  </span>
                </span>
                <span className="list-side">
                  <span className="tag">{ch.priority}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Цепочки домена</h2>
        <p className="section-lead">
          Выбери цепочку и кликай по звеньям — каждое раскрывается в карточку узла.
        </p>
      </div>
      <div className="toolbar" role="group" aria-label="Цепочка домена">
        {EDTECH_CHAINS.map((c) => (
          <button
            key={c.id}
            className={activeChain === c.id ? 'btn btn--ghost active' : 'btn btn--ghost'}
            aria-pressed={activeChain === c.id}
            onClick={() => setActiveChain(c.id)}
          >
            {c.title}
          </button>
        ))}
      </div>
      <div className="grid grid--73">
        <div className="list">
          {chain.nodes.map((id, i) => {
            const n = NODE_MAP[id];
            if (!n) return null;
            const shortValue = n.value && n.value.length <= SHORT_VALUE;
            return (
              <button key={id} className="list-row" onClick={() => openNode(id)}>
                <span className="list-main">
                  <span className="num">{i + 1}</span>
                  <span>{n.name}</span>
                  <EvidenceTag kind={evidenceKind(n)} />
                  {i < chain.nodes.length - 1 && <span className="tag">тянет следующее</span>}
                  {n.value && !shortValue && <span className="stat-note num">{n.value}</span>}
                </span>
                {shortValue && <span className="list-side num">{n.value}</span>}
              </button>
            );
          })}
        </div>
        <div className="note">
          <div className="kicker">Суть цепочки</div>
          <p className="section-lead">{chain.insight}</p>
        </div>
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Динамика рынка 2023–2026</h2>
        <p className="section-lead">
          Млрд рублей по сегментам. Выборки пересекаются, поэтому строки не складываются: строка
          «Совокупный GMV» — оценка автора отчёта, а не сумма остальных.
        </p>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Сегмент</th>
              {TREND_YEARS.map((y) => (
                <th key={y} scope="col" className="num">
                  {y}
                </th>
              ))}
              <th scope="col" className="num">
                CAGR
              </th>
              <th scope="col">Профиль 2026</th>
            </tr>
          </thead>
          <tbody>
            {EDTECH_TREND.map((row) => {
              const values = [row.y2023, row.y2024, row.y2025, row.y2026];
              return (
                <tr key={row.segment}>
                  <td>
                    <span className="row row--wrap">
                      <span>{row.segment}</span>
                      <EvidenceTag kind={TREND_KIND} />
                    </span>
                    <span className="stat-note">{row.note}</span>
                  </td>
                  {values.map((v, i) => (
                    <td key={TREND_YEARS[i]} className="num">
                      {v}
                    </td>
                  ))}
                  <td className="num">{row.cagr}</td>
                  <td>
                    {/* .bar — блочный элемент: инлайновому span высота 6px не применяется */}
                    <div className="bar">
                      <div
                        className="bar-fill"
                        style={{ width: `${(row.y2026 / trendMax) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Источники и периметр домена</h2>
        <p className="section-lead">
          Тип источника проставлен честно и теми же метками, что стоят в строках выше: «факт» —
          законы и госреестры, «компания» — данные компании о себе, «аналитика» — отраслевой
          обзор, «прогноз» — прогноз, «оценка» — косвенная величина или источник, который в
          отчёте не назван. Где ссылки нет — источник назван словами.
        </p>
      </div>
      <div className="list">
        {evidence.map((s) => (
          <div className="list-row" key={s.id}>
            <span className="list-main">
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              ) : (
                <span>{s.label}</span>
              )}
              <EvidenceTag kind={s.kind} />
              {(s.metric || s.scope) && (
                <span className="stat-note">
                  {s.metric}
                  {s.metric && s.scope ? ' · ' : ''}
                  {s.scope ? `периметр: ${s.scope}` : ''}
                </span>
              )}
            </span>
            <span className="list-side num">{s.date}</span>
          </div>
        ))}
      </div>

      <div className="crossnav">
        <button className="btn btn--ghost" onClick={() => goTo('chains')}>
          Цепочки зависимостей
        </button>
        <button className="btn btn--ghost" onClick={() => goTo('overview')}>
          Обзор мировой экономики
        </button>
      </div>
    </div>
  );
}
