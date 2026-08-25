import { useMemo, useState, useTransition, type CSSProperties } from 'react';
import type { EcoNode, EvidenceKind, SectionId } from '../types';
import { ALL_NODES, NODES, NODE_MAP } from '../data/nodes';
import { FLOWS } from '../data/flows';
import { AI_STATS } from '../data/ai';
import { ERAS } from '../data/timeline';
import { nodeCode, KIND_TONE, KIND_LABEL } from '../ui/glyphs';
import { KindIcon } from '../ui/icons';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

// ─── Достоверность числа ─────────────────────────────────────────────────────
// Метка берётся из EvidenceRef.kind узла и ниоткуда больше. Ничего не
// достраиваем: нет ссылки в данных — так и пишем «без источника».
export const EVIDENCE_LABEL: Record<EvidenceKind, string> = {
  official: 'факт',
  analyst: 'аналитика',
  company: 'компания',
  forecast: 'прогноз',
  proxy: 'оценка'
};

// Сильный источник перебивает слабый: у узла с законом и косвенной оценкой
// в подписи стоит «факт».
const EVIDENCE_RANK: EvidenceKind[] = ['official', 'analyst', 'company', 'forecast', 'proxy'];

// Оценка и прогноз — единственные два вида, которые контракт красит в --warn.
const SOFT_KINDS: EvidenceKind[] = ['forecast', 'proxy'];

export function evidenceKind(n?: EcoNode): EvidenceKind | null {
  const kinds = n?.evidence?.map((e) => e.kind) ?? [];
  return EVIDENCE_RANK.find((k) => kinds.includes(k)) ?? null;
}

export function EvidenceTag({ kind }: { kind: EvidenceKind | null }) {
  const soft = kind !== null && SOFT_KINDS.includes(kind);
  return (
    <span className={soft ? 'tag tag--warn' : 'tag tag--muted'}>
      {kind ? EVIDENCE_LABEL[kind] : 'без источника'}
    </span>
  );
}

// Метка по идентификатору узла — для таблиц «Рынка», где в строке лежит nodeId.
export function NodeEvidenceTag({ id }: { id?: string }) {
  return <EvidenceTag kind={evidenceKind(id ? NODE_MAP[id] : undefined)} />;
}

// Сводка считается из данных при отрисовке, а не вписывается руками:
// поменяется evidence у узла — поменяется и цифра.
const HONESTY = (() => {
  const kinds = ALL_NODES.filter((n) => n.value).map((n) => evidenceKind(n));
  return {
    total: kinds.length,
    confirmed: kinds.filter((k) => k !== null && !SOFT_KINDS.includes(k)).length,
    soft: kinds.filter((k) => k !== null && SOFT_KINDS.includes(k)).length,
    none: kinds.filter((k) => k === null).length
  };
})();

// Счётчик шапки карты — только мировой периметр, тот же массив, что рисует список.
const WORLD_SOURCED = NODES.filter((n) => evidenceKind(n) !== null).length;

// Верхние числа раздела своих EvidenceRef не имеют: в data/ai.ts у них только
// подпись, и она сама называет их оценкой. Метку ставим по этой подписи.
const statKind = (hint: string): EvidenceKind | null => (/оценк/i.test(hint) ? 'proxy' : null);

const KIND_FILTERS = [
  { key: 'all', label: 'Всё' },
  { key: 'country', label: 'Страны' },
  { key: 'sector', label: 'Сектора' },
  { key: 'product', label: 'Продукты' },
  { key: 'service', label: 'Услуги' },
  { key: 'tech', label: 'Технологии' }
];

// Единица измерения отделяется от числа: «$126.3 трлн» → «$126.3» + «трлн».
// Число идёт моноширинным, единица — вторым тоном.
function splitUnit(v: string): [string, string] {
  const i = v.indexOf(' ');
  return i < 0 ? [v, ''] : [v.slice(0, i), v.slice(i + 1)];
}

// Значение узла в данных бывает не числом, а фразой в несколько слов
// («$10.9 млрд agents · $64 млрд AI platform…»). В правую числовую колонку идёт
// только короткое значение, длинное уходит подписью под именем: иначе строка
// с nowrap распирает страницу на узком экране.
const SHORT_VALUE = 22;

const NEXT_SECTIONS: { id: SectionId; title: string; note: string }[] = [
  { id: 'flows', title: 'Потоки денег', note: `${FLOWS.length} потоков: кто кому платит и за что` },
  { id: 'chains', title: 'Цепочки зависимостей', note: 'Чипы, дата-центры, энергия — где ломается всё' },
  { id: 'timeline', title: 'Динамика услуг', note: 'Куда переехал спрос за четыре эпохи' },
  { id: 'ai', title: 'Влияние ИИ', note: 'Где ИИ разгоняет спрос, а где обесценивает' },
  { id: 'market', title: 'Рынок EdTech', note: 'Отдельный рублёвый периметр' }
];

export default function Overview({ openNode, goTo }: Props) {
  const [filter, setFilter] = useState('all');
  const [onlySourced, setOnlySourced] = useState(false);
  const [pending, startTransition] = useTransition();

  const nodes = useMemo(
    () =>
      NODES.filter(
        (n) =>
          (filter === 'all' || n.kind === filter) &&
          (!onlySourced || evidenceKind(n) !== null)
      ),
    [filter, onlySourced]
  );

  return (
    <div className="section">
      <div className="section-head">
        <div className="kicker">Обзор</div>
        <h1 className="section-title">Мировая экономика как система</h1>
        <p className="section-lead">
          Не таблица цифр, а карта связей: куда текут деньги, что от чего зависит, как меняется
          спрос на услуги и что делает с этим ИИ. Любая строка раскрывается в карточку узла.
        </p>
      </div>

      <div className="stats">
        {AI_STATS.map((s) => {
          const [num, unit] = splitUnit(s.value);
          return (
            <button key={s.label} className="stat" onClick={() => goTo('ai')}>
              <span className="stat-num">
                {num}
                {unit && <span className="stat-unit">{unit}</span>}
              </span>
              <span className="stat-label">{s.label}</span>
              <span className="stat-note">
                {/* Метка уже говорит «оценка» — второй раз то же слово не пишем. */}
                <EvidenceTag kind={statKind(s.hint)} /> {s.hint === 'оценка' ? '' : s.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div className="hair" />

      <div className="grid grid--73">
        <div className="stack">
          <div className="section-head">
            <h2 className="section-title">Карта узлов экономики</h2>
            <p className="section-lead">
              {nodes.length} из {NODES.length} узлов мирового периметра. Источник указан
              у {WORLD_SOURCED} из {NODES.length}: у остальных число стоит в подписи, но
              сослаться не на что. Страна обозначена двухбуквенным кодом, остальные виды —
              знаком вида и точкой цвета.
            </p>
          </div>

          <div className="toolbar">
            <div className="row row--wrap" role="group" aria-label="Фильтр по виду узла">
              {KIND_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className="btn btn--ghost"
                  aria-pressed={filter === f.key}
                  onClick={() => startTransition(() => setFilter(f.key))}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              className="btn btn--ghost"
              aria-pressed={onlySourced}
              onClick={() => startTransition(() => setOnlySourced((v) => !v))}
            >
              Только с источником
            </button>
          </div>

          {pending ? (
            <div className="list" aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="list-row">
                  <span className="list-main">
                    <span className="skeleton" style={{ width: '42%', height: 18 }} />
                  </span>
                  <span className="list-side">
                    <span className="skeleton" style={{ width: 96, height: 18 }} />
                  </span>
                </div>
              ))}
            </div>
          ) : nodes.length === 0 ? (
            <div className="empty">
              <p>Под этот фильтр не попал ни один узел.</p>
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setFilter('all');
                  setOnlySourced(false);
                }}
              >
                Показать все узлы
              </button>
            </div>
          ) : (
            <div className="list">
              {nodes.map((n) => {
                const code = nodeCode(n.id);
                const shortValue = n.value && n.value.length <= SHORT_VALUE;
                return (
                  <button key={n.id} className="list-row" onClick={() => openNode(n.id)}>
                    <span className="list-main">
                      <span className="row row--wrap">
                        {code ? (
                          <span className="code">{code}</span>
                        ) : (
                          <span className="glyph">
                            <KindIcon kind={n.kind} />
                            <span
                              className="dot"
                              style={{ '--k': KIND_TONE[n.kind] } as CSSProperties}
                              aria-hidden="true"
                            />
                          </span>
                        )}
                        <span>{n.name}</span>
                        {/* Код страны уже назвал вид — метка вида была бы вторым
                            именем того же. Убрана в разметке, чтобы правило
                            `.code ~ .tag` в styles.css не пряталo заодно и
                            метку достоверности. */}
                        {!code && <span className="tag">{KIND_LABEL[n.kind]}</span>}
                        <EvidenceTag kind={evidenceKind(n)} />
                      </span>
                      {n.value && !shortValue && (
                        <span className="stat-note num">{n.value}</span>
                      )}
                    </span>
                    {shortValue && <span className="list-side num">{n.value}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="stack">
          <div className="section-head">
            <h2 className="section-title">Сводка честности</h2>
            <p className="section-lead">
              Все {HONESTY.total} узла дашборда, оба периметра. Цифры считаются из данных при
              отрисовке: метка строки — это вид источника узла, а не ручная пометка.
            </p>
          </div>
          <div className="list">
            <div className="list-row">
              <span className="list-main">
                <span className="row row--wrap">
                  <span>Подтверждено источником</span>
                  <EvidenceTag kind="official" />
                </span>
                <span className="stat-note">
                  Госреестр или закон, отраслевой обзор, данные компании о себе — есть на что
                  сослаться.
                </span>
              </span>
              <span className="list-side num">{HONESTY.confirmed}</span>
            </div>
            <div className="list-row">
              <span className="list-main">
                <span className="row row--wrap">
                  <span>Оценка или прогноз</span>
                  <EvidenceTag kind="proxy" />
                </span>
                <span className="stat-note">
                  Источник назван, но число в нём косвенное или относится к будущему. Для
                  сравнения годится, для подстановки в расчёт — нет.
                </span>
              </span>
              <span className="list-side num">{HONESTY.soft}</span>
            </div>
            <div className="list-row">
              <span className="list-main">
                <span className="row row--wrap">
                  <span>Без источника</span>
                  <EvidenceTag kind={null} />
                </span>
                <span className="stat-note">
                  Число стоит в подписи узла, ссылки в данных нет. Считать такое измерением
                  нельзя.
                </span>
              </span>
              <span className="list-side num">{HONESTY.none}</span>
            </div>
          </div>

          <div className="hair" />

          <div className="section-head">
            <h2 className="section-title">Четыре эпохи спроса</h2>
          </div>
          <div className="list">
            {ERAS.map((e, i) => (
              <button key={e.key} className="list-row" onClick={() => goTo('timeline')}>
                <span className="list-main">
                  <span className="row">
                    <span className="num">{i + 1}</span>
                    <span>{e.title}</span>
                  </span>
                </span>
                <span className="list-side num">{e.label}</span>
              </button>
            ))}
          </div>

          <div className="hair" />

          <div className="section-head">
            <h2 className="section-title">Куда смотреть дальше</h2>
          </div>
          <div className="list">
            {NEXT_SECTIONS.map((s) => (
              <button key={s.id} className="list-row" onClick={() => goTo(s.id)}>
                <span className="list-main">
                  <span>{s.title}</span>
                  <span className="stat-note">{s.note}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="crossnav">
        <button className="btn btn--ghost" onClick={() => goTo('market')}>
          Рынок EdTech
        </button>
        <button className="btn btn--ghost" onClick={() => goTo('flows')}>
          Потоки денег
        </button>
      </div>
    </div>
  );
}
