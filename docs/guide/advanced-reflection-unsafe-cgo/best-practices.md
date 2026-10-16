---
prev: /guide/advanced-reflection-unsafe-cgo/practice.md
---

# Рекомендации по коду: reflection, `unsafe` и cgo

## Выбор инструмента

- Начинайте с конкретных типов и прямого доступа к полям; затем рассмотрите маленький интерфейс, generics или code generation.
- Используйте reflection только на реальной dynamic boundary: serializer, metadata framework, ORM integration, schema tooling или plugin contract с открытым набором типов.
- Не заменяйте пару известных вариантов reflection-кодом: type switch или явная функция лучше проверяются и рефакторятся.
- Изолируйте reflection, `unsafe` и cgo в маленьком пакете. Не распространяйте их типы и детали в handler/service/domain API.

## Reflection

- До `Elem`, `NumField`, `IsNil`, `Set` и `Call` проверяйте `IsValid`, `Kind`, nil и `CanSet` в соответствии с операцией.
- Считайте строковые имена полей и методов частью dynamic contract: документируйте и тестируйте их, потому что rename не проверяется компилятором.
- Уважайте экспортируемость полей. Не обходите private state чужого пакета через unsafe.
- Разбирайте tags полностью по контракту либо используйте зрелую библиотеку; `StructTag.Get` не реализует правила JSON, ORM или validation сам по себе.
- Кэшируйте reflection metadata только после profile и с продуманными concurrency/size semantics.
- Возвращайте обычный `error` для неверной формы входа; не используйте `recover` как штатную validation strategy.

## `unsafe`

- Рассматривайте `unsafe` как исключение с измеренной/платформенной причиной, а не как оптимизацию «на всякий случай».
- Не храните pointer как `uintptr` между выражениями, не делайте pointer arithmetic в application code и не предполагайте layout чужих типов.
- Не используйте Go struct как wire format: фиксируйте endianness, размеры и bounds через `encoding/binary` или protocol library.
- Не делайте unsafe zero-copy между `string` и `[]byte`, пока не доказаны необходимость, ownership и lifetime; обычные преобразования безопаснее.
- Проверяйте изолированный low-level код через `go vet`, `-d=checkptr=2`, race tests и target OS/arch CI.
- Документируйте lifetime, layout, архитектурные ограничения, benchmark и владельца поддержки рядом с каждым unsafe-блоком.

## cgo

- Выбирайте cgo только при реальной ценности существующей C-библиотеки, которую не даёт standard library или поддерживаемый pure-Go вариант.
- Держите `import "C"` и C types в тонком boundary package; наружу возвращайте idiomatic Go values и `error`.
- Для каждого C allocation сразу определяйте правильную C cleanup-функцию и вызывайте её на всех путях.
- C не должен сохранять Go pointer после вызова без документированного handle/callback design; проверяйте размеры и nil до передачи буферов.
- Не блокируйте длительные C-вызовы под mutex и не считайте context автоматической отменой native call.
- Воспроизводите C compiler, headers, linker flags и native libraries в CI и multi-stage Docker build; тестируйте target OS/arch.
- Проверяйте security updates, license, timeout/cancellation semantics и план обновления native dependency до merge.

## Итоговый чек-лист

- [ ] Обычные типы, интерфейсы, generics и generation оценены до low-level решения.
- [ ] Dynamic/low-level код локализован, документирован и покрыт отрицательными тестами.
- [ ] Reflection не может panic на невалидном/неподходящем input.
- [ ] Нет unsafe зависимости от private layout, внешнего binary format или долгоживущего `uintptr`.
- [ ] C и Go ownership памяти разделены, C resources освобождаются на всех путях.
- [ ] Native build и tests воспроизводимы в CI/Docker на production-like target.
- [ ] Внешний HTTP API, ошибки, секреты и domain-слой не зависят от деталей reflection/unsafe/cgo.
