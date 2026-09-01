import { useMemo, useState } from 'react';
import type { EvidenceKind, SectionId } from '../types';
import { NODE_MAP } from '../data/nodes';
import { EvidenceTag, NodeEvidenceTag, evidenceKind } from './Overview';
import Val from '../ui/num';
import {
  AI_NATIVE_CHAINS,
  AI_NATIVE_CHANNELS,
  AI_NATIVE_EPOCHS,
  AI_NATIVE_EVIDENCE,
  AI_NATIVE_FAILED_COST,
  AI_NATIVE_PAINS,
  AI_NATIVE_POSITIONS,
  AI_NATIVE_PRICES,
  AI_NATIVE_REVISION_CASE,
  AI_NATIVE_REVISION_MAX,
  AI_NATIVE_REVISION_MIN,
  AI_NATIVE_REVISION_RATIO,
  AI_NATIVE_SEGMENTS,
  AI_NATIVE_SELLERS,
  AI_NATIVE_STOP_QUESTIONS,
  AI_NATIVE_TAKEN
} from '../data/ai-native';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

// Подача чисел: сами величины считаются в data/ai-native.ts из вилок разведки.
const fmtRub = (v: number) => Math.round(v).toLocaleString('ru-RU');
const fmtMln = (v: number) => (v / 1_000_000).toFixed(1).replace('.', ',');
const fmtRatio = (v: number) => v.toFixed(1).replace('.', ',');

// Значение узла бывает не числом, а фразой: длинное уходит подписью под именем,
// иначе строка с nowrap распирает страницу на узком экране.
const SHORT_VALUE = 22;

const TOP_STATS: {
  num: string;
  unit: string;
  label: string;
  note: string;
  kind: EvidenceKind;
}[] = [
  {
    num: '95',
    unit: '% пилотов',
    label: 'без измеримого эффекта на P&L',
    note: 'при вложениях 30–40 млрд долларов, MIT NANDA',
    kind: 'analyst'
  },
  {
    num: '89',
    unit: '% проектов РФ',
    label: 'застряли в стадии пилота',
    note: 'внедрили GenAI свыше 70%, стратегия есть у 26% из тех, у кого есть бюджет',
    kind: 'proxy'
  },
  {
    num: '73',
    unit: '% внедрений',
    label: 'проваливаются за первый год',
    note: 'причина в обслуживании базы, а не в модели: минус 20% точности проходит бесшумно',
    kind: 'proxy'
  },
  {
    num: fmtMln(AI_NATIVE_FAILED_COST),
    unit: 'млн ₽',
    label: 'цена одного неудачного внедрения',
    note: 'пилот и агент по средним вилкам плюс год поддержки по нижней границе',
    kind: 'proxy'
  }
];

// Лестница цен: РФ и запад стоят не двумя колонками, а по переключателю.
// Рядом они не читаются: западная вилка «$2 000 – 8 000 для SMB, пакет
// $4 500 – 6 000» длиннее рублёвой и в паре с ней резала таблицу по ширине.
const PRICE_SIDES = [
  { key: 'ru' as const, label: 'Цены РФ', column: 'РФ, рубли' },
  { key: 'en' as const, label: 'Цены запада', column: 'Запад, доллары' }
];

export default function MarketAi({ openNode, goTo }: Props) {
  const [activeChain, setActiveChain] = useState(AI_NATIVE_CHAINS[0].id);
  const [priceSide, setPriceSide] = useState<'ru' | 'en'>('ru');
  const chain = AI_NATIVE_CHAINS.find((c) => c.id === activeChain)!;
  const side = PRICE_SIDES.find((s) => s.key === priceSide)!;

  const evidence = useMemo(() => Object.values(AI_NATIVE_EVIDENCE), []);

  return (
    <div className="section">
      <div className="section-head">
        <div className="kicker">Рынок AI-внедрений</div>
        <h1 className="section-title">AI-native внедрения</h1>
        <p className="section-lead">
          Второй домен, в котором продаётся наш продукт: компании, которые уже потратили деньги
          на ИИ и не получили возвратов. Здесь видно, кто ещё претендует на этот бюджет, сколько
          стоит провал и почему ревизия продаётся раньше стройки.
        </p>
      </div>

      {/* Оговорки периметра нужны раз в жизни раздела: держим их свёрнутыми,
          чтобы первым читалось не примечание, а числа. */}
      <details className="note">
        <summary className="kicker">Отдельный периметр, пересчёт курса и метод</summary>
        <div className="list">
          <div className="list-row">
            <span className="list-main">
              Деньги домена считаются в рублях: все потоки рублёвые. Долларовые вилки западных
              игроков лежат справочными полями узлов и в потоки не входят.
            </span>
          </div>
          <div className="list-row">
            <span className="list-main">
              Пересчёт в разведке грубый, около 85 ₽ за доллар: он годится для порядка величины,
              но не для сложения строк между собой.
            </span>
          </div>
          <div className="list-row">
            <span className="list-main">
              Источник один: разведка агента от 31.08.2026, 34 поиска и страницы. Ссылок в отчёте
              почти нет, поэтому большинство источников названы словами, а не url.
            </span>
          </div>
        </div>
      </details>

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
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Лестница цен на одну и ту же работу</h2>
        <p className="section-lead">
          РФ и запад показываются по очереди, а не двумя колонками: это два разных рынка и две
          разные валюты, одна в другую они не пересчитываются.
        </p>
      </div>
      <div className="toolbar">
        <div className="seg" role="group" aria-label="Рынок в лестнице цен">
          {PRICE_SIDES.map((s) => (
            <button
              key={s.key}
              className="seg-btn"
              aria-pressed={priceSide === s.key}
              onClick={() => setPriceSide(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Работа</th>
              <th scope="col">{side.column}</th>
              <th scope="col">Что это значит для нас</th>
            </tr>
          </thead>
          <tbody>
            {AI_NATIVE_PRICES.map((p) => (
              <tr key={p.id}>
                <td>{p.work}</td>
                {/* Без класса .num: он ставит nowrap, а вилка запада длиной
                    в строку от него уезжала за край таблицы. */}
                <td>
                  <Val value={priceSide === 'ru' ? p.ru : p.en} />
                </td>
                <td>{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Сколько стоит провал</h2>
        <p className="section-lead">
          Числа считаются из вилок разведки, а не берутся готовыми: поменяются цены рынка,
          поменяется и вывод.
        </p>
      </div>
      <div className="list">
        {AI_NATIVE_REVISION_CASE.map((r) => (
          <div key={r.id} className="list-row">
            <span className="list-main">
              <span>{r.title}</span>
              <span className="stat-note">{r.basis}</span>
            </span>
            <span className="list-side num">
              {fmtRub(r.value)}
              <span className="stat-unit">₽</span>
            </span>
          </div>
        ))}
      </div>
      <div className="note">
        <div className="kicker">Главный вывод домена</div>
        <p className="section-lead">
          Ревизия за {fmtRub(AI_NATIVE_REVISION_MIN)} – {fmtRub(AI_NATIVE_REVISION_MAX)} ₽ дешевле
          одного неудачного внедрения в {fmtRatio(AI_NATIVE_REVISION_RATIO)} раза. Она продаётся не
          обещанием результата, а критериями остановки: три вопроса, на которые заказчик отвечает
          сам.
        </p>
        <div className="list">
          {AI_NATIVE_STOP_QUESTIONS.map((q, i) => (
            <div className="list-row" key={q}>
              <span className="list-main">
                <span className="num">{i + 1}</span> {q}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Кому продаём первыми</h2>
        <p className="section-lead">
          P0 это прямой цикл продаж, P1 после первых внедрений, P2 через партнёров и апселл.
        </p>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Сегмент</th>
              <th scope="col">Приоритет</th>
              <th scope="col" className="num">
                Бюджет
              </th>
              <th scope="col">Состояние</th>
              <th scope="col">Боль</th>
              <th scope="col">С чего заходим</th>
            </tr>
          </thead>
          <tbody>
            {AI_NATIVE_SEGMENTS.map((s) => (
              <tr key={s.id}>
                <td>
                  <span className="row row--wrap">
                    <button className="link" onClick={() => openNode(s.nodeId)}>
                      {s.segment}
                    </button>
                    <NodeEvidenceTag id={s.nodeId} />
                  </span>
                </td>
                <td>
                  <span className="tag">{s.priority}</span>
                </td>
                <td className="num">
                  <Val value={s.budget} />
                </td>
                <td>{s.state}</td>
                <td>{s.pain}</td>
                <td>{s.entry}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Кто ещё продаёт то же самое</h2>
        <p className="section-lead">
          Снизу демпинг от 50 000 ₽, сверху консалтинг и вендор с ценой по запросу, сбоку продукт
          за место. Середина, где написан состав работ и цена, почти пуста.
        </p>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Игрок</th>
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
            {AI_NATIVE_SELLERS.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="row row--wrap">
                    <button className="link" onClick={() => openNode(c.nodeId)}>
                      {c.name}
                    </button>
                    {c.ours && <span className="tag">это мы</span>}
                    <NodeEvidenceTag id={c.nodeId} />
                  </span>
                </td>
                <td>{c.type}</td>
                <td className="num">
                  <Val value={c.entry} />
                </td>
                <td className="num">
                  <Val value={c.monthly} />
                </td>
                <td className="num">
                  <Val value={c.time} />
                </td>
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
        <h2 className="section-title">Боли: материал для первого звонка</h2>
        <p className="section-lead">Каждая строка это готовый аргумент со своим числом.</p>
      </div>
      <div className="list">
        {AI_NATIVE_PAINS.map((p) => (
          <button key={p.id} className="list-row" onClick={() => openNode(p.nodeId)}>
            <span className="list-main">
              <span>{p.fact}</span>
              <span className="stat-note">
                Кого касается: {p.whom}. Боль: {p.pain}. Ответ продукта: {p.answer}
              </span>
            </span>
            <span className="list-side">{p.source}</span>
          </button>
        ))}
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Каналы до ЛПР</h2>
        <p className="section-lead">
          Referral идёт первым по единодушию источников, воронки на этом рынке проигрывают личным
          касаниям.
        </p>
      </div>
      <div className="list">
        {AI_NATIVE_CHANNELS.map((ch) => (
          <button key={ch.id} className="list-row" onClick={() => openNode(ch.nodeId)}>
            <span className="list-main">
              <span>{ch.name}</span>
              <span className="stat-note">
                {ch.type} · охват {ch.reach}. {ch.approach}. Что даёт: {ch.reward}
              </span>
            </span>
            <span className="list-side">
              <span className="tag">{ch.priority}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Свободные позиционирования</h2>
        <p className="section-lead">
          Пять мест, которые на этом рынке ещё никем не заняты, и пять, куда лезть не стоит.
        </p>
      </div>
      <div className="list">
        {AI_NATIVE_POSITIONS.map((p, i) => (
          <button key={p.id} className="list-row" onClick={() => openNode(p.nodeId)}>
            <span className="list-main">
              <span>
                <span className="num">{i + 1}</span> {p.title}
              </span>
              <span className="stat-note">
                {p.claim} {p.basis}
              </span>
            </span>
            <NodeEvidenceTag id={p.nodeId} />
          </button>
        ))}
      </div>
      <details className="note">
        <summary className="kicker">Занято, не лезем: пять мест</summary>
        <div className="list">
          {AI_NATIVE_TAKEN.map((t) => (
            <button key={t.id} className="list-row" onClick={() => openNode(t.nodeId)}>
              <span className="list-main">
                <span>{t.title}</span>
                <span className="stat-note">{t.who}</span>
              </span>
            </button>
          ))}
        </div>
      </details>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Цепочки домена</h2>
        <p className="section-lead">
          Первая цепочка это наш сценарий продажи целиком. Кликай по звеньям: каждое раскрывается
          в карточку узла.
        </p>
      </div>
      <div className="toolbar" role="group" aria-label="Цепочка домена">
        {AI_NATIVE_CHAINS.map((c) => (
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
      <div className="note">
        <div className="kicker">Суть цепочки</div>
        <p className="section-lead">{chain.insight}</p>
      </div>
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
                {n.value && !shortValue && <Val className="stat-note" value={n.value} />}
              </span>
              {shortValue && <Val className="list-side" value={n.value!} />}
            </button>
          );
        })}
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Эпохи рынка</h2>
        <p className="section-lead">
          Числового ряда по годам в разведке нет, поэтому эпохи описаны событиями. Выдумывать
          строки ради графика мы не стали.
        </p>
      </div>
      <div className="list">
        {AI_NATIVE_EPOCHS.map((e) => (
          <button key={e.id} className="list-row" onClick={() => openNode(e.nodeId)}>
            <span className="list-main">
              <span>{e.title}</span>
              <span className="stat-note">
                {e.marker}. {e.note}
              </span>
            </span>
            <span className="list-side num">{e.year}</span>
          </button>
        ))}
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Источники и периметр домена</h2>
        <p className="section-lead">
          Метки те же, что в строках выше: «факт» это законы и госреестры, «компания» это данные
          компании о себе, «аналитика» это отраслевой обзор, «прогноз» это прогноз, «оценка» это
          косвенная величина или источник, который в разведке не назван поимённо. Где ссылки нет,
          источник назван словами.
        </p>
      </div>
      {/* Список источников нужен на проверке, а не на первом чтении: свёрнут. */}
      <details className="note">
        <summary className="kicker">
          Показать все источники · <span className="num">{evidence.length}</span>
        </summary>
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
      </details>

      <div className="crossnav">
        <button className="btn btn--ghost" onClick={() => goTo('market')}>
          Рынок EdTech
        </button>
        <button className="btn btn--ghost" onClick={() => goTo('chains')}>
          Цепочки зависимостей
        </button>
      </div>
    </div>
  );
}
