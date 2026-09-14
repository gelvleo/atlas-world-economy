import { useMemo, useState } from 'react';
import type { EvidenceKind, SectionId } from '../types';
import { NODE_MAP } from '../data/nodes';
import { EvidenceTag, NodeEvidenceTag, evidenceKind } from './Overview';
import Val from '../ui/num';
import {
  LD_ACCOMMODATION_SHARE,
  LD_FOREIGN_SHARE,
  LD_GRDP_USD_BN,
  LD_GRDP_VND_BN,
  LD_SPEND_PER_VISIT_USD,
  VIETNAM_CHAINS,
  VIETNAM_FLOWS,
  VN_COUNTRY_VS_REGION,
  VN_EVIDENCE,
  VN_MICRO
} from '../data/vietnam';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

// Значение узла бывает не числом, а фразой. Длинное уходит подписью под именем,
// иначе строка с nowrap распирает страницу на узком экране.
const SHORT_VALUE = 22;

const fmt1 = (v: number) => v.toFixed(1).replace('.', ',');
const fmtInt = (v: number) => Math.round(v).toLocaleString('ru-RU');
const fmtPct = (v: number) => (v * 100).toFixed(1).replace('.', ',');

const TOP_STATS: {
  num: string;
  unit: string;
  label: string;
  note: string;
  kind: EvidenceKind;
}[] = [
  {
    num: '8,02',
    unit: '% рост страны',
    label: 'против 6,42 % у Lâm Đồng',
    note: 'регион отстаёт, потому что 38,59 % его экономики это сырьевое сельское хозяйство',
    kind: 'official'
  },
  {
    num: '77,3',
    unit: '% экспорта',
    label: 'делают иностранные компании',
    note: '367,09 из 475,04 млрд долларов: страна сдаёт площадку, а не продаёт своё',
    kind: 'official'
  },
  {
    num: '48,3',
    unit: '% урожая кофе',
    label: 'страны растёт в Lâm Đồng',
    note: 'и продаётся сырьём по 5 610 долларов за тонну, цену назначает биржа',
    kind: 'official'
  },
  {
    num: fmtInt(LD_SPEND_PER_VISIT_USD),
    unit: '$ с визита',
    label: 'оставляет турист в регионе',
    note: 'вместе с едой; 20,7 млн визитов дают 2,15 млрд долларов, иностранцев 6,2 %',
    kind: 'proxy'
  }
];

// Потоки разложены по двум периметрам: страна и провинция. Между собой они не
// складываются, поэтому показываются по очереди, а не одним списком.
const FLOW_SIDES = [
  { key: 'country' as const, label: 'Потоки страны' },
  { key: 'region' as const, label: 'Потоки провинции' }
];

const isRegionFlow = (id: string) => id.startsWith('vnf-ld-');

export default function Vietnam({ openNode, goTo }: Props) {
  const [activeChain, setActiveChain] = useState(VIETNAM_CHAINS[0].id);
  const [flowSide, setFlowSide] = useState<'country' | 'region'>('country');
  const chain = VIETNAM_CHAINS.find((c) => c.id === activeChain)!;

  const evidence = useMemo(() => Object.values(VN_EVIDENCE), []);
  const flows = useMemo(
    () =>
      VIETNAM_FLOWS.filter((f) =>
        flowSide === 'region' ? isRegionFlow(f.id) : !isRegionFlow(f.id)
      ).sort((a, b) => (b.valueNum ?? 0) - (a.valueNum ?? 0)),
    [flowSide]
  );

  return (
    <div className="section">
      <div className="section-head">
        <div className="kicker">Вьетнам и Lâm Đồng</div>
        <h1 className="section-title">Деньги Вьетнама и провинции Lâm Đồng</h1>
        <p className="section-lead">
          Третий домен: экономика страны, где живёт владелец, и провинции, где он живёт конкретно.
          Потоки привязаны к географии, а не висят в воздухе: видно, кто кому платит, кто на кого
          опирается и где в регионе остались незанятые места.
        </p>
      </div>

      {/* Оговорки периметра читаются один раз за жизнь раздела: держим свёрнутыми. */}
      <details className="note">
        <summary className="kicker">Отдельный периметр, два уровня и слияние провинций</summary>
        <div className="list">
          <div className="list-row">
            <span className="list-main">
              Деньги домена считаются в долларах США: все потоки долларовые. Донговые величины
              лежат справочными полями узлов. С мировым периметром и с рублёвыми доменами
              EdTech и AI-внедрений суммы не складываются.
            </span>
          </div>
          <div className="list-row">
            <span className="list-main">
              Внутри домена два уровня, и они между собой тоже не складываются: национальный
              (источники Нацстатслужба и World Bank) и региональный (статуправление провинции).
              «Экспорт кофе Вьетнама 8,9 млрд долларов» и «урожай кофе Lâm Đồng 1,03 млн тонн» это
              разные сущности: выручка страны и физический объём региона.
            </span>
          </div>
          <div className="list-row">
            <span className="list-main">
              С 1 июля 2025 Lâm Đồng объединена с Bình Thuận и Đắk Nông. Статистика 2025 идёт по
              новым границам, 2024 и раньше по старым, а сопоставимой базы 2024 по новому
              периметру не публикует никто. Драконий фрукт в списке урожаев провинции это прямое
              доказательство слияния: культура Bình Thuận, в горах Đà Lạt она не растёт.
            </span>
          </div>
          <div className="list-row">
            <span className="list-main">
              Справочный курс для пересказа донговых величин около 26 300 за доллар. Он годится
              для порядка величины и не годится для сложения строк.
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
        <h2 className="section-title">Страна и провинция: одна строка, два периметра</h2>
        <p className="section-lead">
          Колонки считают разные службы по разным методикам. Сравнивать их можно по направлению,
          а не по десятым долям процента.
        </p>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Показатель</th>
              <th scope="col" className="num">
                Вьетнам
              </th>
              <th scope="col" className="num">
                Lâm Đồng
              </th>
              <th scope="col">Что это значит</th>
            </tr>
          </thead>
          <tbody>
            {VN_COUNTRY_VS_REGION.map((r) => (
              <tr key={r.id}>
                <td>{r.metric}</td>
                <td>
                  <Val value={r.country} />
                </td>
                <td>
                  <Val value={r.region} />
                </td>
                <td>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Потоки денег</h2>
        <p className="section-lead">
          Страна и провинция показываются по очереди, а не одним списком: это два периметра, и
          суммировать их между собой нельзя. Клик по строке открывает узел на её конце.
        </p>
      </div>
      <div className="toolbar">
        <div className="seg" role="group" aria-label="Периметр потоков">
          {FLOW_SIDES.map((s) => (
            <button
              key={s.key}
              className="seg-btn"
              aria-pressed={flowSide === s.key}
              onClick={() => setFlowSide(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="list">
        {flows.map((f) => {
          const from = NODE_MAP[f.from];
          const to = NODE_MAP[f.to];
          return (
            <button key={f.id} className="list-row" onClick={() => openNode(f.to)}>
              <span className="list-main">
                <span>
                  {f.label}
                  <span className="meta"> · {from?.name} → {to?.name}</span>
                </span>
                <span className="stat-note">{f.description}</span>
              </span>
              <Val className="list-side" value={f.value} />
            </button>
          );
        })}
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Цепочки: что за чем тянется</h2>
        <p className="section-lead">
          Шесть сквозных цепочек домена. Кликай по звеньям: каждое раскрывается в карточку узла с
          фактами и источниками.
        </p>
      </div>
      <div className="toolbar" role="group" aria-label="Цепочка домена">
        {VIETNAM_CHAINS.map((c) => (
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
        <h2 className="section-title">Микрокатегории: где искать место</h2>
        <p className="section-lead">
          Рынков такого размера официальная статистика не считает вовсе, поэтому здесь честности
          меньше всего. Метка у каждой строки показывает, чем подкреплено её число.
        </p>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Категория</th>
              <th scope="col">Размер</th>
              <th scope="col">Кто продаёт</th>
              <th scope="col">Цены</th>
              <th scope="col">Что не закрыто</th>
            </tr>
          </thead>
          <tbody>
            {VN_MICRO.map((m) => (
              <tr key={m.id}>
                <td>
                  <span className="row row--wrap">
                    <button className="link" onClick={() => openNode(m.nodeId)}>
                      {m.name}
                    </button>
                    <NodeEvidenceTag id={m.nodeId} />
                  </span>
                </td>
                <td>{m.size}</td>
                <td>{m.sellers}</td>
                <td>{m.price}</td>
                <td>{m.pain}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Главный экономический вывод</h2>
        <p className="section-lead">
          Числа ниже считаются из данных домена, а не вписаны руками: поменяется источник,
          поменяется и вывод.
        </p>
      </div>
      <div className="list">
        <div className="list-row">
          <span className="list-main">
            <span>Расчётный GRDP провинции</span>
            <span className="stat-note">
              <EvidenceTag kind="proxy" /> GRDP на душу 105,24 млн донгов умножены на 3 872 999
              человек. Абсолютного числа не печатает ни статуправление провинции, ни релиз
              Нацстатслужбы по 34 провинциям.
            </span>
          </span>
          <span className="list-side num">
            {fmtInt(LD_GRDP_VND_BN)}
            <span className="stat-unit">млрд VND</span>
          </span>
        </div>
        <div className="list-row">
          <span className="list-main">
            <span>Он же в долларах по справочному курсу</span>
            <span className="stat-note">
              <EvidenceTag kind="proxy" /> около 3 % экономики страны при 3,8 % её населения.
            </span>
          </span>
          <span className="list-side num">
            {fmt1(LD_GRDP_USD_BN)}
            <span className="stat-unit">млрд $</span>
          </span>
        </div>
        <div className="list-row">
          <span className="list-main">
            <span>Средний чек визита в регион</span>
            <span className="stat-note">
              <EvidenceTag kind="proxy" /> 56 610,6 млрд донгов выручки делятся на 20 733 100
              визитов. Это весь чек вместе с едой, а не стоимость ночёвки.
            </span>
          </span>
          <span className="list-side num">
            {fmtInt(LD_SPEND_PER_VISIT_USD)}
            <span className="stat-unit">$</span>
          </span>
        </div>
        <div className="list-row">
          <span className="list-main">
            <span>Доля размещения в туристической выручке</span>
            <span className="stat-note">
              <EvidenceTag kind="official" /> 11 007,3 млрд донгов из 56 610,6. Остальное еда:
              45 599 млрд. Ночевать в регионе дешевле, чем есть.
            </span>
          </span>
          <span className="list-side num">
            {fmtPct(LD_ACCOMMODATION_SHARE)}
            <span className="stat-unit">%</span>
          </span>
        </div>
        <div className="list-row">
          <span className="list-main">
            <span>Доля иностранцев в турпотоке региона</span>
            <span className="stat-note">
              <EvidenceTag kind="official" /> 1 287 тыс. из 20 733,1 тыс. визитов, при том что
              иностранцев стало больше на 39,78 % за год.
            </span>
          </span>
          <span className="list-side num">
            {fmtPct(LD_FOREIGN_SHARE)}
            <span className="stat-unit">%</span>
          </span>
        </div>
      </div>
      <div className="note">
        <div className="kicker">Вывод в трёх абзацах</div>
        <p className="section-lead">
          <strong>Регион отстаёт, потому что продаёт сырьё.</strong> Рост 6,42 % против 8,02 % по
          стране, и 38,59 % экономики это сельское хозяйство, больше, чем услуги. Нацстатслужба
          причину называет прямо: провинции на сырьевом сельхозэкспорте страдают от мировых цен,
          которые не назначают. Регион держит 48,3 % урожая кофе страны, а страна продаёт его
          зелёным зерном по 5 610 долларов за тонну.
        </p>
        <p className="section-lead">
          <strong>Туризм даёт объём, но не деньги.</strong> {fmtInt(LD_SPEND_PER_VISIT_USD)}{' '}
          долларов с визита вместе с едой, размещение это{' '}
          {fmtPct(LD_ACCOMMODATION_SHARE)} % выручки, иностранцев{' '}
          {fmtPct(LD_FOREIGN_SHARE)} %. Регион принимает выходные из Хошимина, а не пребывание.
        </p>
        <p className="section-lead">
          <strong>Свободна не ниша, а длительность.</strong> Русскоязычный поток по стране
          утроился и осел на побережье, а в Đà Lạt нет коворкингов, интернет 10 Мбит/с и аэропорт
          закрыт с марта по август 2026. В ИИ то же самое в другой отрасли: подписка на все модели
          стоит 19 долларов в месяц на компанию, а довести её до работы некому у 46,4 % компаний.
          И там, и там продаётся не доступ, а доведение.
        </p>
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Чего не нашлось</h2>
        <p className="section-lead">
          Дыры названы поимённо: в дашборде их нет не потому, что их не искали.
        </p>
      </div>
      <div className="list">
        {[
          'Абсолютный GRDP Lâm Đồng в деньгах. Ни статуправление провинции, ни релиз Нацстатслужбы по 34 провинциям его не печатают.',
          'Сопоставимая база 2024 по объединённому периметру: без неё рост 6,42 % нельзя проверить своим счётом.',
          'Экспорт в АСЕАН отдельным числом, импорт из Кореи официальным числом, переводы диаспоры по стране за 2025.',
          'Разбивка ПИИ по странам по полному объёму 38,42 млрд долларов: публикуют только по новым регистрациям.',
          'Экспортная выручка цветов Đà Lạt в долларах: есть объём в стеблях и цель на 2030.',
          'Число россиян в Lâm Đồng: разбивку по гражданству провинция не публикует.',
          'Размер рынка IT-услуг для экспатов и долгой аренды иностранцам: чисел нет ни у кого.'
        ].map((t, i) => (
          <div className="list-row" key={t}>
            <span className="list-main">
              <span className="num">{i + 1}</span> {t}
            </span>
          </div>
        ))}
      </div>

      <div className="hair" />

      <div className="section-head">
        <h2 className="section-title">Источники и периметр домена</h2>
        <p className="section-lead">
          Метки те же, что в строках выше: «факт» это госстатистика, таможня и центробанк,
          «компания» это данные компании о себе, «аналитика» это отраслевой обзор, «прогноз» это
          прогноз, «оценка» это косвенная величина или вторичная перепечатка. Ключевые источники
          проверены отдельным запросом 14.09.2026.
        </p>
      </div>
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
        <button className="btn btn--ghost" onClick={() => goTo('market-ai')}>
          Рынок AI-внедрений
        </button>
        <button className="btn btn--ghost" onClick={() => goTo('flows')}>
          Мировые потоки денег
        </button>
      </div>
    </div>
  );
}
