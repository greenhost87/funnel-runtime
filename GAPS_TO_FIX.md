# GAPS_TO_FIX — что проебано относительно Funnel_Runtime_Fullstack_Dev.md

# Отдать агенту на починку. Public URL и Bun — вне scope, не чинить.

Источник ТЗ: `Funnel_Runtime_Fullstack_Dev.md`
Дата ревью: 2026-02-XX
Приоритет: F1 — высокий, F7 — низкий. Не расширять scope.

## F1 — Генератор не генерит `back_clicked`

- **Где:** `system/generator/traffic-generator.ts` — `buildSessionEvents`/`advanceSessionStep`/`appendResultEvents` никогда не пушат `back_clicked`
- **ТЗ:** п.4 требует событие `back_clicked`, п.6 требует генератор с «отвал на разных шагах» + «повторные события», п.5 аналитика должна корректно учитывать «возвраты назад»
- **Сейчас:** синтетика не упражняет back, хотя аналитика (`COUNT(DISTINCT)` в `system/database/analytics/analytics.dao.ts`) и `use-funnel-controller.ts#goBack` умеют. После `bun run generate:traffic` dashboard не показывает что back не ломает конверсию.
- **Что сделать:** в `traffic-generator.ts` для 15-20% сессий после 2-3 шагов сгенерить `back_clicked` (с `stepId` текущего шага) с новым `eventId`, затем повторный `step_viewed` предыдущего шага с новым `eventId` (не duplicate). Использовать `crypto.randomUUID()`. Сохранить детерминизм при `seed`.
- **Проверка:** `bun run generate:traffic --seed 42 --sessions 120` → в `events` есть `back_clicked` (>0), `analytics.service.test.ts` + ручная проверка `SELECT COUNT(*) FROM events WHERE event_name='back_clicked'` >0. `bun test` зелёный.

## F2 — Генератор: «повторные события» покрыты только как duplicate `event_id` whole-batch

- **Где:** `system/generator/traffic-generator.ts#deliverEventBatch` — `index%17` шлёт `processBatch(batch)` дважды с теми же `eventId` (тест дедупа), `index%11` — `reverse(batch)`
- **ТЗ п.6:** «повторные события» и «повторная отправка одной пачки» — два разных требования. Первое = два `step_viewed` одного `stepId` с разными `eventId` (юзер вернулся и снова увидел шаг). Сейчас первого нет.
- **Что сделать:** в рамках F1 добавить distinct-повтор: после `back_clicked` пушнуть `step_viewed` с новым `eventId` для шага куда вернулись. Не ломать существующую логику duplicate-batch (оставить `index%17` как есть).
- **Проверка:** синтетика содержит хотя бы N сессий где один `stepId` встречается в `step_viewed` >=2 раза с разными `eventId` но `COUNT(DISTINCT session_id)` в аналитике не инфлируется (см. `system/analytics/analytics.service.ts#listStepViews`).

## F3 — `stepFunnel` агрегирует cross-version/variant, нет разбивки

- **Где:** `system/analytics/analytics.service.ts#buildStepFunnel` + `system/database/analytics/analytics.dao.ts#listStepViews`/`listCompletionsByFromStep` — группировка только по `stepId`
- **ТЗ п.5:** «сравнение вариантов A и B; сравнение версий; фильтрация по UTM campaign» — `comparisons` это делает, но `stepFunnel` (и `StepFunnelChart`) сливает все версии/варианты.
- **Что сделать (минимально):** либо добавить разбивку `stepFunnel` по `versionId:variant` (расширить `StepFunnelMetric` + DAO), либо явно задокументировать в README что funnel — агрегат, а детально — `edges` таблица. Предпочтительно — первое: изменить DAO `GROUP BY version_id, variant, step_id` и сервис, обновить `analytics.schema.ts` и `analytics-charts.tsx`.
- **Проверка:** `getDashboard()` возвращает `stepFunnel` с полями `versionId`/`variant` или отдельный `stepFunnelByVariant`; `bun test tests/analytics/*` обновить снапшоты.

## F4 — `variant-resolver` добавляет хвост шагов для B в iteration-2

- **Где:** `system/funnel/variant-resolver.ts#resolveStepOrder` — после `ordered = stepOrder.filter(!excluded)` дописывает `for (id of baseOrder) if (!ordered.includes(id)) ordered.push(id)`
- **ТЗ п.8 + `fixtures/funnels/iteration-2.json`:** B `stepOrder:[goal,timeline,habits,budget,summary]` + `excludedStepIds:[welcome]` должен дать ровно 5 шагов для B. Сейчас итог = 7 (`+ premium-details, training-frequency` в хвосте), т.к. они есть в `baseOrder` но не в `stepOrder`.
- **Что сделать:** решить: либо это задуманно (тогда докинуть в `iteration-2.json` B `excludedStepIds` ещё `training-frequency`/`premium-details` если они не нужны для B), либо поправить `resolveStepOrder` чтобы при наличии `stepOrder` не дописывал неуказанные шаги (только `excluded` фильтр). Второй вариант ближе к ТЗ «вариант может менять порядок шагов и экран результата» — ожидается точный порядок. Обсудить и зафиксировать тестом `tests/funnel/config.test.ts` для iteration-2 B: `expect(effectiveB.steps.map(s=>s.id)).toEqual([...])`.
- **Проверка:** `parseFunnelConfig(iteration2)` → `resolveEffectiveConfig(..., "B").steps.length === 5` (или задокументированное 7) и `progress.total` соответствует.

## F5 — `scripts/generate-traffic.ts` хардкодит 2 пачки `initial`+`alternative`

- **Где:** `scripts/generate-traffic.ts: firstVersionId = getActive() ?? publish(initial)`, затем `publish(alternative)` и вторая пачка. При каждом запуске после публикации `iteration-2.json` создаётся лишняя версия `alternative`.
- **ТЗ п.6:** команда генерит минимум 100 сессий, п.8 — после публикации новой версии старые сессии не теряются, новая — активна. CLI не должен плодить версии.
- **Что сделать:** добавить `--versionId` флаг или логику: если `getActive()` уже есть — генерить все `sessionCount` в активную версию; `alternative` публиковать только если явно `--withAlternative` или при `seed` без активной. Сохранить детерминизм и существующий тест `tests/generator/generate-traffic.test.ts` (он вызывает `generateSyntheticTraffic` напрямую с `versionId`, не CLI).
- **Проверка:** после `publish(iteration-2)` + `bun run generate:traffic --seed 42 --sessions 120` история версий не растёт на `alternative`, все 120 сессий в `iteration-2` (`SELECT DISTINCT version_id FROM events` → 1 id).

## F6 — Нет доки про reject `premium_interest_signal` на старой версии

- **Где:** `system/events/event.service.ts#validateEventName` реджектит `Event not declared in config` если `customEvents` старой версии не содержит нового события.
- **ТЗ п.8:** «появляется новое событие; старые активные сессии должны продолжить работу без ошибок» — сейчас старые сессии продолжают, но попытка слать новое событие со старой `sessionId` даёт `rejected` без объяснения про версионирование.
- **Что сделать:** в README раздел «Вторая итерация» дописать: `premium_interest_signal` принимается только на `wellness-quiz-v2`, старые сессии на `v1` — `rejected`. Или улучшить `reason` в `event.service.ts` на `Event not declared in pinned version X`.
- **Проверка:** README содержит строку про это, `bun test tests/events/event.service.test.ts` проходит.

## F7 — Мелкие техдолги (низкий)

- **Где:** `system/funnel/answer-validation.ts#validateNumber` — `Number(null)=0` делает `raw===null` проверку недостижимой; `system/funnel/variant-resolver.ts#matchesCondition` `op:in` проверяет `typeof answer==="string"` → не сработает для `multi-select` (`string[]`).
- **ТЗ п.1:** `multi-select` + условные переходы должны работать.
- **Что сделать:** `validateNumber`: проверять `raw===null` до `Number()`. `matchesCondition`: для `in` — если `Array.isArray(answer)` проверять `answer.some(v=>values.includes(v))`.
- **Проверка:** unit-тест `submitAnswer` с `multi-select` + `when:{op:"in", values:["nutrition"]}`.

## Что НЕ трогать

- Bun вместо Node, отсутствие публичного URL — согласовано.
- Визуальный редактор — out of scope.

## Как проверять после починки

```bash
rtk bun run fmt:check
rtk bun run typecheck
rtk bun test
rtk bun run build
rtk bun run test:e2e
SQLITE_PATH=$(mktemp -u).sqlite rtk bun run generate:traffic --seed 42 --sessions 120
# затем проверить что analytics не инфлируется, back_clicked >0
```

## Ожидаемый результат для агента

- По каждому F — один коммит(ы) с фиксом + тест/проверка.
- Не менять `data/` схему руками, не терять аналитику при rollback.
- Обновить README если меняется поведение CLI/аналитики.
