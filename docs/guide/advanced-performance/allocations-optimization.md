---
prev: /guide/advanced-performance/pprof.md
next: /guide/advanced-performance/tests.md
---

# Аллокации, escape analysis и точечные оптимизации

## Что такое allocation rate

Каждый объект, который должен пережить текущий stack frame или не может быть размещён на стеке безопасно, может оказаться в heap. Heap-объекты позже обрабатывает garbage collector. Небольшое число аллокаций обычно не проблема; высокий allocation rate на горячем пути может повысить CPU на GC, memory pressure и latency.

Начинайте с `-benchmem` и heap profile, а не со стремления получить `0 allocs/op`. Иногда одна понятная аллокация возвращаемой строки необходима и дешевле сложного ручного буфера.

## Escape analysis: подсказка компилятора

Компилятор Go решает размещение объектов на стеке или heap. Его решение можно посмотреть так:

```bash
go test -gcflags='-m=2' ./internal/export
```

Или для package build:

```bash
go build -gcflags='-m=2' ./cmd/server
```

Фрагменты вывода могут выглядеть так:

```text
internal/export/export.go:24:6: can inline buildExport
internal/export/export.go:31:12: moved to heap: builder
internal/export/export.go:35:18: task.Title escapes to heap
```

Это диагностика реализации текущего компилятора, а не публичный контракт языка. После небольшой перестройки кода, обновления Go или добавления вызова вывод может измениться. Не переписывайте программу только ради исчезновения слова `escapes`: сначала проверьте, отражается ли это на `allocs/op`, CPU или retained memory в нужном сценарии.

## Частые причины escape

Объект может уйти в heap, когда:

- возвращается указатель на него;
- его адрес сохраняется в более долгоживущем объекте;
- значение передаётся в интерфейс или замыкание в ситуации, где компилятор не может доказать безопасность стека;
- размер объекта слишком велик для стека или его время жизни сложно определить.

Это не список ошибок. Возврат `*Task` может быть правильным API, а замыкание — самым понятным способом выразить callback. Escape analysis помогает объяснить наблюдаемый allocation rate, а не задаёт стиль кода самостоятельно.

## `strings.Builder`: когда текст строится в цикле

Конкатенация строк в цикле создаёт новую строку при каждом `+` и часто даёт квадратичную работу по объёму копирования:

```go
func buildTitlesSlow(tasks []Task) string {
	result := ""
	for _, task := range tasks {
		result += task.Title + "\n"
	}
	return result
}
```

Для большого последовательного текста используйте `strings.Builder`:

```go
func buildTitles(tasks []Task) string {
	var builder strings.Builder
	for _, task := range tasks {
		builder.WriteString(task.Title)
		builder.WriteByte('\n')
	}
	return builder.String()
}
```

Если примерный размер известен, `Grow` может уменьшить перевыделения:

```go
func buildTitles(tasks []Task) string {
	var builder strings.Builder
	builder.Grow(len(tasks) * 32) // Эвристика, а не обещание точного размера.

	for _, task := range tasks {
		builder.WriteString(task.Title)
		builder.WriteByte('\n')
	}
	return builder.String()
}
```

Не вызывайте `Grow` с неограниченной длиной из HTTP body или внешнего поля: это превращает оценку размера в риск большой аллокации. Не копируйте `strings.Builder` после первого использования. Для короткой фиксированной конкатенации `title + ": " + status` часто проще и достаточно эффективна — подтвердите benchmark, если путь горячий.

## Избегайте лишних преобразований, но не ломайте API

Иногда profile покажет лишние преобразования `[]byte` ↔ `string`, `fmt.Sprintf` в цикле или повторную сериализацию одинакового значения. Возможное улучшение:

```go
// Вместо fmt.Sprintf для каждого ID на горячем пути:
buffer = strconv.AppendInt(buffer, id, 10)
```

Но `strconv.AppendInt` требует управления буфером и может ухудшить читаемость. Он оправдан, если profile и benchmark показывают заметную стоимость форматирования в критичном сценарии. Не меняйте публичные `string`-контракты на mutable `[]byte` без ясной необходимости и правил ownership.

## `sync.Pool`: временный cache, а не ресурсный pool

`sync.Pool` хранит временные объекты, которые можно повторно использовать между goroutine. Runtime имеет право очистить pool при garbage collection; `Get` может вернуть `nil`, даже если вы раньше вызвали `Put`. Поэтому `sync.Pool` не подходит для обязательных ресурсов, connection pool, кэша данных, подсчёта объектов или передачи владения.

Пример для временного `bytes.Buffer` в доказанно горячем пути:

```go
var bufferPool = sync.Pool{
	New: func() any {
		return new(bytes.Buffer)
	},
}

func encodeTask(task Task) []byte {
	buffer := bufferPool.Get().(*bytes.Buffer)
	buffer.Reset()
	defer func() {
		if buffer.Cap() <= maxPooledBufferCapacity {
			bufferPool.Put(buffer)
		}
	}()

	buffer.WriteString(task.Title)
	buffer.WriteByte('\n')

	// Bytes ссылается на память buffer. Возвращаем независимую копию,
	// иначе caller увидит изменение после Put/reuse.
	return bytes.Clone(buffer.Bytes())
}
```

Эта функция остаётся корректной даже при немедленном reuse buffer, но `bytes.Clone` снова выделяет память. Pool может сократить временные внутренние allocation, а может не дать выигрыша в end-to-end метрике. Измерьте именно этот код с и без pool.

### Риски `sync.Pool`

- забытый `Reset` может раскрыть данные предыдущего запроса;
- возврат `buffer.Bytes()` без копии создаёт use-after-Put логическую ошибку и data race;
- слишком большие буферы могут оставаться в pool и раздувать память;
- сложность ownership часто дороже небольшого сокращения `allocs/op`;
- pool не гарантирует, что конкретный объект будет возвращён тому же worker.

Здесь константу объявляют рядом с pool:

```go
const maxPooledBufferCapacity = 64 << 10
```

Сначала `Reset`, затем решайте, возвращать ли буфер. Большой разовый запрос не должен навсегда превращать pool в набор мегабайтных буферов.

## Оптимизация алгоритма важнее микрооптимизации

Ни `Builder`, ни `Pool` не компенсируют неверный объём работы. Для Task Manager обычно сильнее влияют:

- пагинация и лимит результата вместо чтения всех задач;
- фильтрация и сортировка в SQL с подходящим индексом вместо обработки всего набора в Go;
- устранение N+1 запросов;
- кеширование только при чёткой стратегии invalidation;
- batch-операции вместо одного сетевого вызова на элемент;
- разумные timeout и concurrency limit для внешних сервисов.

Но и эти изменения требуют измерений, тестов контракта и плана rollout. «Быстрее» не оправдывает устаревшие данные, неограниченный cache или потерю ошибок.

## Проверка после изменения

После оптимизации выполните один и тот же protocol:

```bash
go test ./...
go test -race ./...
go test -run '^$' -bench '^BenchmarkBuildExport' -benchmem -count=10 ./internal/export > new.txt
benchstat old.txt new.txt
go tool pprof -base old.mem new.mem
```

Если benchmark улучшился, но profile не изменился так, как ожидалось, перепроверьте сценарий. Если profile лучше, но p99 сервиса не изменился, bottleneck может быть выше уровнем. Сохраняйте только изменения, которые улучшают важную метрику и не ухудшают корректность или сопровождение.

## Итог

Хорошая performance-работа — не набор магических пакетов. Это короткий воспроизводимый цикл: измерить, понять, сделать минимальное изменение, подтвердить результат и остановиться. Далее закрепим этот цикл на вопросах и заданиях.
