// Вопросы и боли людей из соцконтура Vietnam Data OS → data/vn-market/social.json.
// Запуск: npx tsx scripts/pull-vn-social.ts (ключи как у pull-vietnam.ts: .env атласа
// или REGION_SUPABASE_URL и REGION_SUPABASE_SERVICE_KEY в окружении). Результат
// коммитится: на Vercel базы нет, сборка читает готовый JSON.
//
// Узлы: город × тема, kind question, родитель по аудитории источника: русские чаты
// под q-relocant, вьетнамские каналы под q-local-owner. Цитата это текст поста до 20
// слов с url самого поста, кто говорит, это название канала. Личные данные не берём:
// автор у нас только хэш, его в файл не кладём.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = resolve(ROOT, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
const BASE = (process.env.REGION_SUPABASE_URL ?? '').replace(/\/$/, '');
const KEY = process.env.REGION_SUPABASE_SERVICE_KEY || process.env.REGION_SUPABASE_ANON_KEY || '';
if (!BASE || !KEY) {
  console.error('Нет REGION_SUPABASE_URL или ключа');
  process.exit(1);
}

async function table<T>(name: string, query: string): Promise<T[]> {
  // PostgREST отдаёт не больше 1000 строк за раз: листаем по Range.
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${BASE}/rest/v1/${name}?${query}`, {
      headers: { apikey: KEY, authorization: `Bearer ${KEY}`, range: `${from}-${from + 999}` }
    });
    if (!r.ok) throw new Error(`${name}: ${r.status} ${await r.text()}`);
    const rows = (await r.json()) as T[];
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

interface Source { id: number; title: string; platform: string; geo: string; audience: string; status: string; external_id: string; username: string | null }
interface Enriched { post_id: number; topics: string[] | null; pain_type: string | null; market_pain: boolean }
interface Post { id: number; source_id: number; text: string; posted_at: string; url: string | null }

const GEO: Record<string, string> = {
  nhatrang: 'Нячанг', danang: 'Дананг', dalat: 'Далат', hcmc: 'Хошимин', hanoi: 'Ханой',
  phuquoc: 'Фукуок', muine: 'Муйне', vietnam: 'Вьетнам в целом'
};
const TOPIC: Record<string, string> = {
  housing: 'жильё и аренда', marketplace: 'купить и продать', services: 'сервисы и мастера', prices: 'цены',
  banking_payments: 'деньги и карты', transport: 'транспорт и байк', internet_tech: 'связь и техника',
  community: 'сообщество и знакомства', safety: 'безопасность', food: 'еда', tourism: 'туризм и маршруты',
  kids_school: 'дети и школа', jobs: 'работа', law_police: 'закон и полиция', visa_docs: 'виза и документы',
  health: 'здоровье', pets: 'питомцы', business: 'бизнес', agriculture: 'агро', weather: 'погода', other: 'разное'
};
const PAIN: Record<string, string> = { who_knows: 'кто знает где', looking_for: 'ищу', complaint: 'жалоба', language: 'язык', regulation: 'правила и закон', staffing: 'персонал', marketing: 'клиенты', payments: 'платежи', routine: 'рутина', supply: 'поставки', other: 'прочее' };

// Эмодзи в интерфейсе запрещены дизайн-контрактом: из цитат их вычищаем, слова не трогаем.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu;
const words = (s: string) => s.replace(EMOJI, '').replace(/\s+/g, ' ').trim().split(' ');
const clip = (s: string) => {
  const w = words(s);
  return w.length <= 20 ? w.join(' ') : w.slice(0, 20).join(' ') + '…';
};
// Вопрос чата это одна строка: длинные объявления и посты с телефонами и почтой не берём.
const usable = (t: string) => {
  const w = words(t);
  return w.length >= 4 && w.length <= 60 && !/\+?\d[\d\s()-]{8,}\d/.test(t) && !/@\S+\.\S+/.test(t);
};

async function main() {
  const sources = await table<Source>('social_sources', 'select=id,title,platform,geo,audience,status,external_id,username&status=neq.disabled');
  const srcMap = new Map(sources.map((s) => [s.id, s]));
  const enriched = await table<Enriched>('social_enriched', 'select=post_id,topics,pain_type,market_pain&market_pain=eq.true');
  const ids = enriched.map((e) => e.post_id);
  const posts = new Map<number, Post>();
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    for (const p of await table<Post>('social_posts', `select=id,source_id,text,posted_at,url&id=in.(${chunk.join(',')})`)) posts.set(p.id, p);
  }

  // Группы: аудитория × город × тема
  type Key = string;
  const groups = new Map<Key, { audience: string; geo: string; topic: string; items: { e: Enriched; p: Post; s: Source }[] }>();
  for (const e of enriched) {
    const p = posts.get(e.post_id);
    if (!p || !p.url || !usable(p.text)) continue;
    const s = srcMap.get(p.source_id);
    if (!s) continue;
    const audience = s.audience === 'ru_expat' ? 'ru' : s.audience === 'vi_local' ? 'vi' : null;
    if (!audience) continue;
    const topic = (e.topics ?? []).find((t) => t !== 'other') ?? 'other';
    const key = `${audience}|${s.geo}|${topic}`;
    (groups.get(key) ?? groups.set(key, { audience, geo: s.geo, topic, items: [] }).get(key)!).items.push({ e, p, s });
  }

  const evidenceId = 'ev-vn-social-contour';
  const nodes: any[] = [];
  const total = { ru: 0, vi: 0 };
  // Хабы по городам: русские чаты под релокантом, вьетнамские каналы под местным владельцем
  const hubs = new Map<string, any>();
  for (const g of groups.values()) {
    if (g.items.length < 4) continue;
    const hubId = `q-social-${g.audience}-${g.geo}`;
    if (!hubs.has(hubId)) {
      hubs.set(hubId, {
        id: hubId,
        parent: g.audience === 'ru' ? 'q-relocant' : 'q-local-owner',
        layer: 'questions',
        kind: 'segment',
        title: `${GEO[g.geo] ?? g.geo}: ${g.audience === 'ru' ? 'русские чаты' : 'вьетнамские каналы'}`,
        summary: '',
        numbers: [] as any[],
        evidence: [evidenceId],
        related: g.audience === 'ru' ? ['ch-tg-chats', 'seg-relocant'] : ['ch-youtube', 'seg-local-smb'],
        tags: [g.audience, g.geo, 'соцконтур'],
        _count: 0,
        _pains: {} as Record<string, number>
      });
    }
    const hub = hubs.get(hubId)!;
    hub._count += g.items.length;
    for (const it of g.items) hub._pains[it.e.pain_type || 'other'] = (hub._pains[it.e.pain_type || 'other'] ?? 0) + 1;
    total[g.audience as 'ru' | 'vi'] += g.items.length;

    const sorted = [...g.items].sort((a, b) => b.p.posted_at.localeCompare(a.p.posted_at));
    const quotes = sorted.slice(0, 8).map(({ p, s }) => ({
      text: clip(p.text),
      who: s.title.replace(EMOJI, '').replace(/\s+/g, ' ').trim().slice(0, 60),
      where: s.platform === 'telegram' ? 'Telegram' : s.platform === 'youtube' ? 'YouTube' : s.platform,
      url: p.url!,
      date: p.posted_at.slice(0, 10)
    }));
    const pains: Record<string, number> = {};
    for (const it of g.items) pains[it.e.pain_type || 'other'] = (pains[it.e.pain_type || 'other'] ?? 0) + 1;
    const painLine = Object.entries(pains).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${PAIN[k] ?? k} ${v}`).join(', ');
    nodes.push({
      id: `q-social-${g.audience}-${g.geo}-${g.topic}`,
      parent: hubId,
      layer: 'questions',
      kind: 'question',
      title: `${TOPIC[g.topic] ?? g.topic}: ${GEO[g.geo] ?? g.geo}`,
      summary: `${g.items.length} ${g.items.length === 1 ? 'пост' : g.items.length < 5 ? 'поста' : 'постов'} с болью за окно соцконтура: ${painLine}. Ниже свежие дословно.`,
      numbers: [{ label: 'постов с болью по теме', value: String(g.items.length), unit: 'шт', evidence: evidenceId }],
      quotes,
      evidence: [evidenceId],
      tags: [g.audience, g.geo, g.topic]
    });
  }
  for (const hub of hubs.values()) {
    const painLine = Object.entries(hub._pains as Record<string, number>).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${PAIN[k] ?? k} ${v}`).join(', ');
    hub.summary = `${hub._count} постов с болью в источниках соцконтура: ${painLine}. Темы ниже, в каждой свежие посты дословно со ссылкой.`;
    hub.numbers = [{ label: 'постов с болью', value: String(hub._count), unit: 'шт', evidence: evidenceId }];
    delete hub._count;
    delete hub._pains;
    nodes.push(hub);
  }

  const today = new Date().toISOString().slice(0, 10);
  const out = {
    evidence: [
      {
        id: evidenceId,
        label: `Соцконтур Vietnam Data OS: таблицы social_posts и social_enriched, ${sources.length} источников, снимок ${today}`,
        url: 'https://hermes.aidopter.ru/go/region',
        date: today,
        kind: 'proxy',
        metric: `${total.ru} постов русских чатов и ${total.vi} вьетнамских каналов с меткой боли`,
        scope: 'разметка модели по постам Telegram и комментариям YouTube; окно сбора по источнику; у каждой цитаты url поста'
      }
    ],
    nodes
  };
  const file = resolve(ROOT, 'data/vn-market/social.json');
  writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
  console.log(`social.json: узлов ${nodes.length}, цитат ${nodes.reduce((s, n) => s + (n.quotes?.length ?? 0), 0)}, постов ru ${total.ru}, vi ${total.vi}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
