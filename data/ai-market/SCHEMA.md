# Карта рынка ИИ-внедрений: контракт данных

Папка `data/ai-market/*.json`. Каждый файл: `{ "nodes": AiTreeNode[], "evidence": Evidence[] }`.
Файлы складываются скриптом `scripts/validate-ai-market.ts` в одно дерево. Правила ниже
обязательны: валидатор красный, если нарушены.

## AiTreeNode

```jsonc
{
  "id": "q-owner-cost-01",          // латиница, цифры, дефис; уникален во всех файлах
  "parent": "q-owner",              // id родителя из этого или общего дерева; корни без parent
  "layer": "questions",             // principles · demand · services · adjacent · questions · failures · supply · prices · channels · insights
  "kind": "question",               // principle · segment · industry · usecase · service · subservice · niche · question · pain · failure · player · price · channel · insight · metric
  "title": "Сколько стоит внедрить ИИ в отдел продаж",   // до 80 знаков, по-русски
  "summary": "Одно-два предложения: о чём узел и почему он важен.",
  "facts": ["Факт с числом и датой"],                 // 0-8 строк
  "numbers": [                                        // каждое число со ссылкой на evidence
    { "label": "доля проектов в пилоте", "value": "89", "unit": "%", "evidence": "ev-ru-pilots-2026" }
  ],
  "quotes": [                                         // дословные слова людей, до 20 слов, с url
    { "text": "внедрили бота, через месяц никто им не пользуется", "who": "владелец кофейни", "where": "vc.ru", "url": "https://...", "date": "2026-03" }
  ],
  "questions": ["Вопрос, который задают люди, своими словами"],  // для kind question/segment/industry
  "pains": ["Боль одной фразой"],
  "priceRu": "120 000 - 400 000 ₽",                  // вилка, если есть
  "priceEn": "$2 000 - 8 000",
  "time": "2 недели",
  "acceptance": "Чем мерить, что сделано: число и порог",
  "whoSells": ["Just AI", "КОРУС"],
  "risk": "Главный способ провала этого узла",
  "evidence": ["ev-..."],                             // id источников узла
  "related": ["svc-knowledge", "fail-stale"],         // другие узлы дерева
  "tags": ["ru", "smb"]
}
```

## Evidence

```jsonc
{
  "id": "ev-mit-nanda-2025",
  "label": "MIT NANDA, The GenAI Divide: State of AI in Business 2025",
  "url": "https://...",             // обязателен; без url источник не принимается
  "date": "2025-07",
  "kind": "official",               // official · company · analyst · forecast · proxy
  "metric": "95% пилотов без эффекта на P&L",
  "scope": "опрос 150 руководителей, 350 сотрудников, 300 внедрений; оговорка о методике"
}
```

## Правила

- Каждое число в `numbers` ссылается на evidence с url. Числа без url в `facts` помечай «(оценка)».
- `quotes.text` до 20 слов, дословно, на языке оригинала, с url страницы, где это написано.
- Длинное тире запрещено везде, только дефис «-».
- Корни общего дерева (их задаёт лид, в файлах агентов на них ссылаются через `parent`):

| layer | корни |
|---|---|
| demand (размер) | seg-micro · seg-smb · seg-mid · seg-enterprise · seg-person |
| demand (отрасли) | ind-ecom · ind-retail · ind-edu · ind-med · ind-legal · ind-fin · ind-realestate · ind-manufacturing · ind-logistics · ind-horeca · ind-construction · ind-it · ind-marketing · ind-hr · ind-gov · ind-agri · ind-media · ind-services |
| services | svc-strategy · svc-assistant · svc-agents · svc-knowledge · svc-docs · svc-voice · svc-content · svc-analytics · svc-dev · svc-training · svc-ops · svc-infra · svc-security · svc-data |
| adjacent | adj-labeling · adj-prompt · adj-evals · adj-dlp · adj-legal-ai · adj-gpu · adj-local-llm · adj-ai-video · adj-1c-bitrix · adj-tg-bots · adj-crm-ai · adj-ai-recruiting · adj-ai-sales · adj-ai-support · adj-ai-geo · adj-ai-translation · adj-ai-accounting |
| questions (персоны) | q-owner · q-cto · q-marketing · q-sales · q-hr · q-finance · q-legal · q-ops · q-person |
| failures | fail-stale · fail-pilot · fail-adoption · fail-hallucination · fail-integration · fail-security · fail-cost · fail-lockin · fail-acceptance · fail-change |
| supply | sup-ru-cheap · sup-ru-integrators · sup-ru-vendors · sup-ru-freelance · sup-en-boutiques · sup-en-big4 · sup-en-seats · sup-en-memory · sup-platforms · sup-nocode |
| channels | ch-referral · ch-content · ch-outbound · ch-partners · ch-teach · ch-geo · ch-marketplace |

- Если нужен промежуточный узел (например, подотрасль), заводи его сам с `parent` из корней.
- Файлы агентов не трогают `core.json` и `src/`.
