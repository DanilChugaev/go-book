---
prev: /guide/advanced-performance/README.md
next: /guide/advanced-performance/pprof.md
---

# Benchmarks и `benchstat`

## Функция benchmark

Benchmark — функция в файле `*_test.go`, имя которой начинается с `Benchmark` и принимает `*testing.B`:

```go
func BenchmarkBuildExport(b *testing.B) {
	// Подготовка данных.
	for b.Loop() {
		// Одна измеряемая операция.
	}
}
```

`b.Loop()` доступен начиная с Go 1.24 и сам управляет числом итераций. Он сообщает компилятору, что тело benchmark не должно быть «оптимизировано прочь». В существующем коде также часто встречается стиль для Go 1.23 и ниже:

```go
for i := 0; i < b.N; i++ {
	// Одна измеряемая операция.
}
```

Используйте один стиль последовательно в проекте. Если поддерживаемая версия Go не имеет `b.Loop`, применяйте `b.N` и сохраняйте результат в package-level sink, чтобы компилятор не удалил вычисление.

## Первый benchmark: текстовый экспорт

Сравним наивную конкатенацию и `strings.Builder`. Модель и входные данные создаются до измеряемого цикла:

```go
type Task struct {
	ID       int64
	Title    string
	Priority int
}

func buildExportConcat(tasks []Task) string {
	result := ""
	for _, task := range tasks {
		result += fmt.Sprintf("%d\t%s\t%d\n", task.ID, task.Title, task.Priority)
	}
	return result
}

func buildExportBuilder(tasks []Task) string {
	var builder strings.Builder
	for _, task := range tasks {
		fmt.Fprintf(&builder, "%d\t%s\t%d\n", task.ID, task.Title, task.Priority)
	}
	return builder.String()
}
```

```go
var exportResult string

func BenchmarkBuildExportConcat(b *testing.B) {
	tasks := makeBenchmarkTasks(1_000)
	b.ReportAllocs()
	b.ResetTimer()

	for b.Loop() {
		exportResult = buildExportConcat(tasks)
	}
}

func BenchmarkBuildExportBuilder(b *testing.B) {
	tasks := makeBenchmarkTasks(1_000)
	b.ReportAllocs()
	b.ResetTimer()

	for b.Loop() {
		exportResult = buildExportBuilder(tasks)
	}
}
```

`makeBenchmarkTasks` не должен быть частью измерения, если гипотеза касается именно экспорта. `b.ResetTimer()` отделяет setup от основной работы. `exportResult` сохраняет возвращённую строку в package-level переменную: результат observable, и компилятор не может убрать вызов как бесполезный.

`fmt.Fprintf` сам может стать bottleneck. Это нормально для первого честного измерения: profile покажет, стоит ли менять именно форматирование. Не подменяйте его заранее ручными `strconv.AppendInt`, пока benchmark/profile не подтвердят необходимость.

## Запуск benchmark

Базовая команда:

```bash
go test -run '^$' -bench '^BenchmarkBuildExport' -benchmem ./internal/export
```

- `-run '^$'` отключает обычные тесты, чтобы не смешивать их время с benchmark;
- `-bench` выбирает benchmark регулярным выражением;
- `-benchmem` добавляет `B/op` и `allocs/op`;
- путь ограничивает пакет, чтобы запуск был быстрым и точным.

Для всех benchmark в модуле:

```bash
go test -run '^$' -bench . -benchmem ./...
```

Пример формата:

```text
BenchmarkBuildExportConcat-10       1200   1012000 ns/op   2100000 B/op   4000 allocs/op
BenchmarkBuildExportBuilder-10     12000    100000 ns/op    180000 B/op   1750 allocs/op
```

Суффикс `-10` — значение `GOMAXPROCS`, а не число ваших benchmark. Цифры — пример, они зависят от машины, Go и входных данных.

## Как читать метрики

| Метрика | Значение | Что не доказывает |
| --- | --- | --- |
| `ns/op` | среднее время одной операции | p95/p99 latency production-запроса |
| `B/op` | сколько байт выделяется на операцию | сколько памяти остаётся жить после GC |
| `allocs/op` | число выделений на операцию | что именно нужно оптимизировать |

Меньшее число не всегда лучше. Вариант может стать немного медленнее, но сильно проще, безопаснее или экономнее по памяти. Сначала определите ограничение: CPU, latency, allocation rate или retained heap.

## Размер входа и sub-benchmarks

Алгоритм может вести себя по-разному на 10, 1 000 и 100 000 задачах. Используйте sub-benchmarks с понятными именами:

```go
func BenchmarkBuildExport(b *testing.B) {
	for _, size := range []int{10, 1_000, 100_000} {
		b.Run(fmt.Sprintf("tasks=%d", size), func(b *testing.B) {
			tasks := makeBenchmarkTasks(size)
			b.ReportAllocs()
			b.ResetTimer()

			for b.Loop() {
				exportResult = buildExportBuilder(tasks)
			}
		})
	}
}
```

Не генерируйте random input внутри `b.Loop`, если вы не измеряете генератор. При необходимости seed random generator фиксированным значением и подготовьте данные заранее.

## Варианты benchmark

Если у реализации несколько стратегий, оформляйте их отдельными именованными sub-benchmarks:

```go
func BenchmarkFilterTasks(b *testing.B) {
	tasks := makeBenchmarkTasks(10_000)

	b.Run("append", func(b *testing.B) {
		for b.Loop() {
			result := filterWithAppend(tasks)
			benchmarkTasks = result
		}
	})

	b.Run("preallocated", func(b *testing.B) {
		for b.Loop() {
			result := filterPreallocated(tasks)
			benchmarkTasks = result
		}
	})
}

var benchmarkTasks []Task
```

Не меняйте входной слайс между итерациями, если следующая итерация предполагает исходные данные. Если операция намеренно изменяет вход, подготовьте или скопируйте его вне таймера и явно документируйте, что входит в измерение.

## Сравнение до и после через `benchstat`

Один запуск benchmark может случайно оказаться быстрее из-за шума. `benchstat` сравнивает серии запусков статистически.

Установите инструмент:

```bash
go install golang.org/x/perf/cmd/benchstat@latest
```

Снимите baseline до изменения и результат после изменения в одинаковом окружении:

```bash
go test -run '^$' -bench '^BenchmarkBuildExport' -benchmem -count=10 ./internal/export > old.txt
# Внесите одно изменение и убедитесь, что тесты проходят.
go test -run '^$' -bench '^BenchmarkBuildExport' -benchmem -count=10 ./internal/export > new.txt
benchstat old.txt new.txt
```

Пример интерпретации:

```text
name                         old time/op  new time/op  delta
BuildExportBuilder/tasks=1k   101µs ± 3%    91µs ± 2%  -9.9%  (p=0.000 n=10+10)

name                         old alloc/op new alloc/op delta
BuildExportBuilder/tasks=1k    180kB ± 0%    120kB ± 0%  -33.3%
```

`p` и разброс помогают отличить устойчивое изменение от шума, но не отвечают на продуктовый вопрос «достаточно ли это важно». Не принимайте изменение только по красивому проценту: проверьте профиль, корректность и сложность кода.

## Типичные ошибки benchmark

### Setup внутри измерения

```go
for b.Loop() {
	tasks := makeBenchmarkTasks(10_000)
	buildExportBuilder(tasks)
}
```

Этот benchmark измеряет и генерацию задач. Подготовьте `tasks` до цикла, если не исследуете весь сценарий целиком.

### Неиспользованный результат

```go
for b.Loop() {
	buildExportBuilder(tasks)
}
```

Компилятор может удалить вычисление или оптимизировать его неожиданным образом. Присвойте результат sink-переменной либо используйте его так, чтобы результат был observable.

### Один запуск и громкий вывод

Один результат не доказывает регрессию или ускорение. Не пишите в stdout внутри benchmark: I/O доминирует над измеряемой операцией и создаёт шум.

### Benchmark вместо интеграционного измерения

Быстрая функция `filterTasks` не означает быстрый endpoint. После оптимизации hot helper проверьте endpoint нагрузочным тестом и метриками, если исходная проблема была на уровне сервиса.

Следующая страница углубит исследование: когда одного числа `ns/op` мало, CPU и heap profiles покажут, какие именно функции потребляют ресурсы.
