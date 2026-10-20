---
prev: /guide/advanced-performance/tests.md
next: /guide/advanced-performance/best-practices.md
---

# Задания: производительность и диагностика

Практика строит измерительный workflow, а не требует «выиграть» заранее заданный процент. Числа на разных компьютерах различаются; важны воспроизводимость, сохранение поведения и аргументированное решение.

Для заданий создайте пакет, например `internal/export`, и файл `export_benchmark_test.go`. Сначала убедитесь, что обычные тесты проходят:

```bash
go test ./...
go test -race ./...
```

## Задание 1. Benchmark экспорта с корректным setup

Есть модель:

```go
type Task struct {
	ID       int64
	Title    string
	Priority int
}
```

Напишите `BuildExport(tasks []Task) string`, которая формирует строки `ID\tTitle\tPriority\n`. Затем создайте `BenchmarkBuildExport` для 1 000 заранее созданных задач.

**Критерии проверки:**

- benchmark находится в `*_test.go` и называется `BenchmarkBuildExport`;
- данные создаются до `b.ResetTimer()`;
- основной цикл использует `b.Loop()` или совместимый `for i := 0; i < b.N; i++`;
- результат сохраняется в sink-переменную или другим способом остаётся observable;
- включён `b.ReportAllocs()`;
- benchmark не пишет в stdout, не делает I/O и не генерирует данные в измеряемом цикле.

<details>
  <summary>Подсказка</summary>

```go
var benchmarkExport string

func BenchmarkBuildExport(b *testing.B) {
	tasks := makeTasks(1_000)
	b.ReportAllocs()
	b.ResetTimer()

	for b.Loop() {
		benchmarkExport = BuildExport(tasks)
	}
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package export

import (
	"strconv"
	"strings"
	"testing"
)

type Task struct {
	ID       int64
	Title    string
	Priority int
}

func BuildExport(tasks []Task) string {
	var builder strings.Builder
	for _, task := range tasks {
		builder.WriteString(strconv.FormatInt(task.ID, 10))
		builder.WriteByte('\t')
		builder.WriteString(task.Title)
		builder.WriteByte('\t')
		builder.WriteString(strconv.Itoa(task.Priority))
		builder.WriteByte('\n')
	}
	return builder.String()
}

func makeTasks(count int) []Task {
	tasks := make([]Task, count)
	for index := range tasks {
		tasks[index] = Task{
			ID:       int64(index + 1),
			Title:    "Задача",
			Priority: index%5 + 1,
		}
	}
	return tasks
}

var benchmarkExport string

func BenchmarkBuildExport(b *testing.B) {
	tasks := makeTasks(1_000)
	b.ReportAllocs()
	b.ResetTimer()

	for b.Loop() {
		benchmarkExport = BuildExport(tasks)
	}
}
```

Запуск:

```bash
go test -run '^$' -bench '^BenchmarkBuildExport$' -benchmem ./internal/export
```
</details>

## Задание 2. Сравните две реализации через `benchstat`

Реализуйте вторую версию `BuildExportConcat`, которая использует `result += ...` в цикле. Добавьте отдельный benchmark. Снимите по 10 измерений до/после изменения одной из версий и сравните их через `benchstat`.

**Критерии проверки:**

- у двух реализаций одинаковый публичный результат; это подтверждает unit-тест;
- benchmark-данные и команды до/после совпадают;
- запуск использует `-benchmem -count=10`;
- в выводе сравниваются время, байты и аллокации;
- вывод содержит краткое заключение: какой вариант выбран и почему;
- решение не основывается только на одном случайном запуске.

<details>
  <summary>Подсказка</summary>

```bash
go test -run '^$' -bench '^BenchmarkBuildExport' -benchmem -count=10 ./internal/export > old.txt
go test -run '^$' -bench '^BenchmarkBuildExport' -benchmem -count=10 ./internal/export > new.txt
benchstat old.txt new.txt
```
</details>

<details>
  <summary>Решение</summary>

```go
func BuildExportConcat(tasks []Task) string {
	result := ""
	for _, task := range tasks {
		result += strconv.FormatInt(task.ID, 10) + "\t" + task.Title + "\t" + strconv.Itoa(task.Priority) + "\n"
	}
	return result
}

func BenchmarkBuildExportConcat(b *testing.B) {
	tasks := makeTasks(1_000)
	b.ReportAllocs()
	b.ResetTimer()

	for b.Loop() {
		benchmarkExport = BuildExportConcat(tasks)
	}
}

func TestBuildExportImplementationsMatch(t *testing.T) {
	tasks := makeTasks(10)

	if got, want := BuildExportConcat(tasks), BuildExport(tasks); got != want {
		t.Fatalf("экспорты различаются\ngot:\n%s\nwant:\n%s", got, want)
	}
}
```

Обычно `strings.Builder` выигрывает на большом количестве строк, но не делайте это предположением теста. В commit или PR зафиксируйте фактические команды, входной размер и вывод `benchstat`.
</details>

## Задание 3. CPU и heap profile benchmark

Для выбранной реализации снимите CPU и memory profiles. Найдите в `pprof` функцию с заметным cumulative cost и место с заметными allocation. Сравните `alloc_space` и `inuse_space` и объясните разницу для этого сценария.

**Критерии проверки:**

- benchmark запускается с фиксированным именем и `-benchtime=3s`;
- CPU profile открывается через `go tool pprof cpu.out`;
- memory profile рассматривается хотя бы в `alloc_space` и `inuse_space`;
- в заметке указаны команды `top`, `top -cum` и `list <function>`;
- не делается вывод об утечке только по высокому `alloc_space`;
- профили не добавляются в Git без осмысленной причины и проверки содержимого.

<details>
  <summary>Подсказка</summary>

```bash
go test -run '^$' -bench '^BenchmarkBuildExport$' -benchtime=3s \
  -cpuprofile=cpu.out -memprofile=mem.out ./internal/export

go tool pprof cpu.out
go tool pprof -alloc_space mem.out
go tool pprof -inuse_space mem.out
```
</details>

<details>
  <summary>Ожидаемый результат</summary>

Конкретные верхние функции зависят от версии Go и вашей реализации. В отчёте должно быть не «pprof открыт», а связка наблюдения и вывода, например:

```text
CPU: buildExport занимает cumulative время вместе с strconv и strings.Builder.
Heap alloc_space: больше всего выделений связано с итоговой строкой/ростом буфера.
Heap inuse_space: после завершения benchmark эти временные объекты не удерживаются,
поэтому высокий alloc_space сам по себе не доказывает утечку.
```

Если profile показывает стоимость `fmt`, следующая гипотеза может касаться форматирования. Не меняйте его до benchmark-сравнения и проверки результата.
</details>

## Задание 4. Проверьте гипотезу об аллокациях

Добавьте в `BuildExport` `builder.Grow` с консервативной оценкой, например `len(tasks) * 24`. Сравните версию до и после на размерах 10, 1 000 и 100 000 задач. Посмотрите `go test -gcflags='-m=2'` и объясните хотя бы одну строку escape analysis, не делая из неё автоматический вывод об ошибке.

**Критерии проверки:**

- есть sub-benchmarks с несколькими размерами входа;
- `Grow` не получает размер, вычисленный из неограниченного внешнего HTTP-ввода;
- до и после сравниваются в одинаковом окружении;
- в отчёте разделены наблюдаемые `allocs/op` и сообщения compiler diagnostics;
- итоговое решение сохраняет только устойчиво полезное изменение;
- тест подтверждает, что результат экспорта не изменился.

<details>
  <summary>Подсказка</summary>

```go
func BenchmarkBuildExportSizes(b *testing.B) {
	for _, size := range []int{10, 1_000, 100_000} {
		b.Run(fmt.Sprintf("tasks=%d", size), func(b *testing.B) {
			// setup, ResetTimer, b.Loop
		})
	}
}
```
</details>

<details>
  <summary>Направление решения</summary>

`Grow` — это эвристика. Он может уменьшить число расширений буфера, но слишком большая оценка повышает пиковое потребление памяти, особенно для коротких title или малых входов. Поэтому корректный вывод может быть любым из трёх:

1. оставить `Grow`, если есть устойчивое улучшение важной метрики;
2. не использовать `Grow`, если выигрыш шумный или ухудшает малые сценарии;
3. применить его только в другом уровне API, где размер ограничен и известен лучше.

Сообщение `moved to heap` означает решение компилятора о размещении объекта в текущей версии и форме кода. Сверьте его с `allocs/op` и profile, прежде чем менять API или усложнять код.
</details>

## Задание 5. Обоснованно откажитесь от `sync.Pool`

Коллега предлагает добавить `sync.Pool` для `bytes.Buffer` в `BuildExport`, чтобы «избавиться от всех аллокаций». Напишите короткий design note (в README пакета, issue или комментарии к PR) с решением: добавить pool или отказаться от него.

Если добавляете pool, реализуйте корректную функцию, которая не возвращает слайс, ссылающийся на buffer после `Put`, вызывает `Reset` и не кладёт обратно чрезмерно большой buffer. Сравните end-to-end benchmark с версией без pool.

**Критерии проверки:**

- note объясняет измеряемый сценарий и важную метрику;
- учитываются `Get == nil`, очистка pool runtime и отсутствие гарантии конкретного объекта;
- описано ownership возвращаемых `[]byte`/`string`;
- указаны риски утечки данных предыдущего запроса и удержания больших буферов;
- выбранное решение подтверждено benchmark и не меняет внешний контракт;
- pool не используется для `sql.DB`, HTTP client, каналов, постоянного cache или обязательного ресурса.

<details>
  <summary>Подсказка</summary>

Безопасный возврат байтов после `Put` требует независимой копии:

```go
result := bytes.Clone(buffer.Bytes())
bufferPool.Put(buffer)
return result
```

Подумайте, не отменяет ли эта копия ожидаемый выигрыш в вашей end-to-end метрике.
</details>

<details>
  <summary>Пример обоснованного отказа</summary>

```text
Сценарий: формирование экспорта из 1 000 задач.
Метрики: ns/op, B/op, allocs/op.
Наблюдение: strings.Builder уже даёт одну итоговую строку; добавление pool
не улучшило время за пределами шума и усложнило ownership буфера.
Решение: sync.Pool не добавляем. Если будущий CPU/heap profile покажет заметную
стоимость временных буферов в нагруженном endpoint, повторим измерение отдельно.
```

Отказ от оптимизации — хороший результат, если он основан на измерении и сохраняет простой корректный код.
</details>

## Проверьте себя

Перед переходом к следующей главе убедитесь, что вы можете:

- сформулировать симптом, метрику, входные данные и гипотезу до изменения кода;
- написать benchmark без setup и I/O в измеряемом цикле;
- сравнить серии измерений через `benchstat`, а не один запуск;
- объяснить разницу CPU profile, `alloc_space` и `inuse_space`;
- использовать escape analysis как подсказку, а не как список обязательных исправлений;
- оценить `strings.Builder` и `sync.Pool` по реальному сценарию, ownership и сложности;
- остановиться после подтверждённого улучшения, не превращая код в коллекцию случайных микрооптимизаций.

## Полный исходный код

Здесь будет размещён полный исходный код к практическим заданиям этой главы.

<ExampleSource
  path="examples/39/advanced-performance"
  description="заготовка для полного исходного кода практических заданий главы"
/>
