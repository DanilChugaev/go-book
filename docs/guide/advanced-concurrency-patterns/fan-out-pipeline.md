---
prev: /guide/advanced-concurrency-patterns/README.md
next: /guide/advanced-concurrency-patterns/errgroup-lifecycle.md
---

# `Fan-out`, `fan-in` и pipeline

## Три разных формы работы

Эти термины часто используют вместе, но они решают разные задачи:

```text
pipeline:  source → validate → enrich → persist
fan-out:   одна очередь → несколько одинаковых worker
fan-in:    несколько источников → один поток результатов
```

- **Pipeline** делит обработку на последовательные этапы. Каждый следующий этап зависит от результата предыдущего.
- **Fan-out** распределяет независимые единообразные задания между несколькими consumer.
- **Fan-in** объединяет несколько входных каналов в один.

Все три паттерна должны иметь владельца каналов и путь отмены. Иначе быстрый этап заблокируется на медленном, а завершившийся consumer оставит producer навечно ждать отправку.

## Pipeline: один этап — одна ответственность

Пусть фоновая команда экспортирует задачи. Упрощённый pipeline может выглядеть так:

```text
TaskID source → load Task → build ExportRow → write output
```

Каждая функция принимает входной канал и возвращает выходной только для получения. Она сама владеет своим выходным каналом и поэтому закрывает его, когда больше не будет отправок.

```go
type ExportRow struct {
	ID       TaskID
	Title    string
	Priority int
}

func loadTasks(
	ctx context.Context,
	ids <-chan TaskID,
	repository TaskRepository,
) <-chan Task {
	out := make(chan Task)

	go func() {
		defer close(out)
		for {
			select {
			case <-ctx.Done():
				return
			case id, open := <-ids:
				if !open {
					return
				}

				task, err := repository.Get(ctx, id)
				if err != nil {
					// Для краткости пример пропускает ошибку.
					// В production она должна попасть в общий error path.
					continue
				}

				select {
				case out <- task:
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return out
}

func buildRows(ctx context.Context, tasks <-chan Task) <-chan ExportRow {
	out := make(chan ExportRow)

	go func() {
		defer close(out)
		for {
			select {
			case <-ctx.Done():
				return
			case task, open := <-tasks:
				if !open {
					return
				}

				row := ExportRow{
					ID:       task.ID,
					Title:    task.Title,
					Priority: task.Priority,
				}
				select {
				case out <- row:
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return out
}
```

Использование:

```go
rows := buildRows(ctx, loadTasks(ctx, ids, repository))
for row := range rows {
	// Записать строку экспорта.
}
```

Этот пример прежде всего показывает ownership. В настоящем API нельзя молча пропустить ошибку `repository.Get`; следующая страница добавит единый путь ошибок через `errgroup`.

## Правило закрытия каналов

Для каждого канала запишите одно предложение:

> **Кто отправляет все значения, тот закрывает канал после последней отправки.**

В pipeline `loadTasks` — единственный отправитель `out`, поэтому внутри этой функции находится `defer close(out)`. Consumer `buildRows` не закрывает вход `tasks`: он не владеет его producer. Входной канал `ids` закрывает исходный producer, который знает, что новых ID не будет.

Если у канала несколько sender, сами sender не могут независимо закрывать его. Нужна отдельная координирующая goroutine, которая дождётся всех sender и вызовет `close(out)` ровно один раз.

## Fan-out: несколько worker читают одну очередь

Fan-out для обогащения задач создаёт одну очередь входа и несколько одинаковых worker:

```go
func startEnrichers(
	ctx context.Context,
	workerCount int,
	in <-chan Task,
	client PriorityClient,
) <-chan Task {
	out := make(chan Task)
	var workers sync.WaitGroup

	workers.Add(workerCount)
	for range workerCount {
		go func() {
			defer workers.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case task, open := <-in:
					if !open {
						return
					}

					priority, err := client.Suggest(ctx, task.Title)
					if err != nil {
						return // Ошибка должна быть передана владельцу pipeline.
					}
					task.Priority = priority

					select {
					case out <- task:
					case <-ctx.Done():
						return
					}
				}
			}
		}()
	}

	go func() {
		workers.Wait()
		close(out)
	}()

	return out
}
```

Несколько worker совместно получают значения из `in`: каждую задачу получит ровно один из них. Координатор ждёт всех worker и закрывает `out`; закрыть его из каждого worker означало бы риск `send on closed channel` у остальных.

Параллельность меняет порядок: задачи могут прийти в `out` не в том же порядке, в каком они вошли. Если API требует порядок по ID или времени, восстановите его отдельным этапом: сохраните sequence number, соберите результаты и отсортируйте. Не полагайтесь на планировщик goroutine.

## Fan-in: объединить несколько потоков

`fan-in` полезен, когда несколько producer дают одинаковый тип данных: например, события из ручного запуска и планировщика. Функция `merge` запускает по одной goroutine на input, пересылает значения в общий output и закрывает его после завершения всех пересылок.

```go
func merge[T any](ctx context.Context, inputs ...<-chan T) <-chan T {
	out := make(chan T)
	var forwarders sync.WaitGroup

	forward := func(input <-chan T) {
		defer forwarders.Done()
		for {
			select {
			case <-ctx.Done():
				return
			case value, open := <-input:
				if !open {
					return
				}
				select {
				case out <- value:
				case <-ctx.Done():
					return
				}
			}
		}
	}

	forwarders.Add(len(inputs))
	for _, input := range inputs {
		go forward(input)
	}

	go func() {
		forwarders.Wait()
		close(out)
	}()

	return out
}
```

Важны два `select`:

- первый не даёт forwarder вечно ждать значение из input после отмены;
- второй не даёт ему застрять на отправке в `out`, если consumer закончил раньше.

`merge` не закрывает входные каналы: их владельцы — исходные producer. Нулевое количество inputs допустимо: `WaitGroup` сразу завершится, и `out` будет закрыт.

## Cancellation должна идти против потока данных

Данные обычно текут вниз pipeline: source → transform → sink. Отмена должна быть доступна **каждому** этапу, в том числе source, который иначе может зависнуть на send.

```text
data:    source ─────► transform ─────► sink
context:   └──────────── cancel ◄──────────┘
```

Следующий код небезопасен, если consumer прекращает чтение после первой ошибки:

```go
out <- value // Может ждать вечно.
```

Для отменяемого pipeline отправка должна иметь альтернативу:

```go
select {
case out <- value:
case <-ctx.Done():
	return
}
```

То же относится к producer, отправляющему jobs в worker pool, и к worker, сообщающему результат. Context не завершает goroutine принудительно — каждая блокирующая точка должна добровольно заметить отмену.

## Pipeline и backpressure

Небуферизированные связи между этапами создают естественный backpressure: быстрый `loadTasks` не сможет бесконечно обогнать медленный writer. Буфер между этапами допускает ограниченный задел, но добавляет память, задержку остановки и больше задач, которые уже приняты, но больше не нужны.

Не добавляйте большие буферы, чтобы «исправить зависание». Если pipeline зависает, выясните, кто перестал читать, кто не закрыл канал и кто не слушает отмену. Буфер может скрыть ошибку до первой большой нагрузки.

## Когда не нужен канал

Не каждая последовательность функций — pipeline. Если данные помещаются в память и нужны только одной goroutine, обычные вызовы и слайсы проще:

```go
tasks, err := repository.List(ctx)
if err != nil {
	return err
}

rows := make([]ExportRow, 0, len(tasks))
for _, task := range tasks {
	rows = append(rows, makeRow(task))
}
```

Каналы оправданы, когда есть конкурентные producer/consumer, streaming, backpressure или отменяемая передача между независимыми этапами. Следующая страница соединит эти идеи с единым управлением ошибками и graceful shutdown.
