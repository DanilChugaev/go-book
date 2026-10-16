---
prev: /guide/advanced-concurrency-patterns/tests.md
next: /guide/advanced-concurrency-patterns/best-practices.md
---

# Задания: конкурентные паттерны

Практика рассчитана на отдельный каталог или модуль рядом с Task Manager API. Запускайте проверки несколько раз: конкурентный код должен проходить не только один удачный запуск.

```bash
go test -race ./...
go test -count=100 ./...
```

Не используйте `time.Sleep` как способ дождаться нормального завершения worker. В решениях timeout встречается только как аварийная защита теста от вечного зависания.

## Задание 1. Worker pool с best-effort отчётом

Есть интерфейс:

```go
type PriorityRefresher interface {
	Refresh(ctx context.Context, id TaskID) error
}
```

Напишите:

```go
func RefreshAll(
	ctx context.Context,
	refresher PriorityRefresher,
	ids []TaskID,
	workerCount int,
) error
```

Функция запускает не более `workerCount` worker, передаёт им каждый ID через канал jobs, ждёт завершения и возвращает объединение всех ошибок через `errors.Join`. Ошибка одной задачи не должна останавливать остальные.

**Критерии проверки:**

- `workerCount < 1` возвращает ошибку;
- producer закрывает `jobs` после отправки всех ID;
- worker завершается по закрытию `jobs` или `ctx.Done()`;
- ошибки передаются в один result/error path, а не теряются;
- `WaitGroup` ждёт worker перед закрытием канала ошибок;
- при отмене отправка jobs не зависает;
- нет гонки данных при `go test -race`.

<details>
  <summary>Подсказка</summary>

Пусть worker отправляет ошибку в буферизированный канал, а координатор закрывает его после `workers.Wait()`:

```go
go func() {
	workers.Wait()
	close(errs)
}()
```
</details>

<details>
  <summary>Решение</summary>

```go
package priority

import (
	"context"
	"errors"
	"fmt"
	"sync"
)

type TaskID int64

type PriorityRefresher interface {
	Refresh(ctx context.Context, id TaskID) error
}

func RefreshAll(
	ctx context.Context,
	refresher PriorityRefresher,
	ids []TaskID,
	workerCount int,
) error {
	if workerCount < 1 {
		return errors.New("число worker должно быть больше нуля")
	}

	jobs := make(chan TaskID)
	errs := make(chan error, len(ids))
	var workers sync.WaitGroup

	worker := func() {
		defer workers.Done()
		for {
			select {
			case <-ctx.Done():
				return
			case id, open := <-jobs:
				if !open {
					return
				}
				if err := refresher.Refresh(ctx, id); err != nil {
					select {
					case errs <- fmt.Errorf("обновить задачу %d: %w", id, err):
					case <-ctx.Done():
						return
					}
				}
			}
		}
	}

	workers.Add(workerCount)
	for range workerCount {
		go worker()
	}

	for _, id := range ids {
		select {
		case jobs <- id:
		case <-ctx.Done():
			close(jobs)
			workers.Wait()
			return ctx.Err()
		}
	}
	close(jobs)

	go func() {
		workers.Wait()
		close(errs)
	}()

	var allErrors []error
	for err := range errs {
		allErrors = append(allErrors, err)
	}
	return errors.Join(allErrors...)
}
```

Здесь `errs` имеет буфер `len(ids)`, потому что каждая задача может дать максимум одну ошибку. Для неограниченного потока так делать нельзя: нужен одновременный collector или другая политика отчёта.
</details>

## Задание 2. Fan-in с отменой

Напишите generic-функцию:

```go
func Merge[T any](ctx context.Context, inputs ...<-chan T) <-chan T
```

Она должна пересылать значения из всех inputs в один output, завершаться при отмене и закрывать output после закрытия всех inputs. Входные каналы закрывать нельзя.

**Критерии проверки:**

- на каждый input запускается отдельный forwarder;
- forwarder слушает `ctx.Done()` и при receive, и при send;
- только координатор после `WaitGroup.Wait()` закрывает output;
- `Merge(ctx)` без inputs возвращает уже закрывающийся output;
- тест не предполагает порядок значений из разных inputs;
- отмена не оставляет forwarder заблокированным на output send.

<details>
  <summary>Подсказка</summary>

```go
select {
case value, open := <-input:
	// ...
case <-ctx.Done():
	return
}
```
</details>

<details>
  <summary>Решение</summary>

```go
func Merge[T any](ctx context.Context, inputs ...<-chan T) <-chan T {
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
</details>

## Задание 3. Fail-fast с `errgroup.SetLimit`

Используйте `golang.org/x/sync/errgroup` для функции:

```go
func RefreshFailFast(
	ctx context.Context,
	refresher PriorityRefresher,
	ids []TaskID,
	limit int,
) error
```

При первой ошибке context группы должен отмениться, новые операции не должны добавляться после замеченной отмены, а функция возвращает ошибку `errgroup.Wait()`.

**Критерии проверки:**

- зависимость добавлена командой `go get`, а не ручным изменением `go.mod`;
- используется `errgroup.WithContext`;
- `SetLimit(limit)` вызывается до `Go`;
- каждый `Refresh` получает context группы, а не `context.Background()`;
- ID цикла фиксируется локальной переменной;
- `limit < 1` возвращает ошибку;
- не ожидается, что errgroup принудительно оборвёт игнорирующую context goroutine.

<details>
  <summary>Подсказка</summary>

```go
group, groupCtx := errgroup.WithContext(ctx)
group.SetLimit(limit)
```
</details>

<details>
  <summary>Решение</summary>

```go
func RefreshFailFast(
	ctx context.Context,
	refresher PriorityRefresher,
	ids []TaskID,
	limit int,
) error {
	if limit < 1 {
		return errors.New("limit должен быть больше нуля")
	}

	group, groupCtx := errgroup.WithContext(ctx)
	group.SetLimit(limit)

	for _, taskID := range ids {
		if err := groupCtx.Err(); err != nil {
			break
		}

		id := taskID
		group.Go(func() error {
			if err := refresher.Refresh(groupCtx, id); err != nil {
				return fmt.Errorf("обновить задачу %d: %w", id, err)
			}
			return nil
		})
	}

	return group.Wait()
}
```

Проверка `groupCtx.Err()` не исключает ситуацию, когда ошибка пришла, пока следующий `group.Go` уже ждал свободное место. Для строгого прекращения приёма jobs спроектируйте явный worker pool с producer, который выбирает между `jobs <- id` и `groupCtx.Done()`. Главное: первая ошибка должна быть частью явного контракта, а не случайной потерей результата worker.
</details>

## Задание 4. Graceful drain processor

Спроектируйте `Processor` с методами:

```go
func (processor *Processor) Submit(ctx context.Context, id TaskID) error
func (processor *Processor) Shutdown(ctx context.Context) error
```

Выберите и задокументируйте политику **drain**: после начала `Shutdown` новые `Submit` возвращают ошибку, ранее принятые jobs обрабатываются, затем `Shutdown` ждёт завершение worker до deadline из `ctx`.

**Критерии проверки:**

- `Submit` и `Shutdown` не могут привести к `send on closed channel` при конкурентном вызове;
- ровно один владелец закрывает jobs;
- контекст `Shutdown` ограничивает ожидание, но не используется как подмена рабочего context для немедленной отмены drain;
- job, успешно принятая `Submit` до shutdown, либо обработана, либо её судьба явно отражена в документированной политике;
- тест использует барьеры/каналы: подтверждает start job, инициирует shutdown и ждёт done;
- после `Shutdown` worker не остаются жить.

<details>
  <summary>Подсказка</summary>

Для защиты приёма jobs можно использовать mutex, флаг `stopping` и `WaitGroup` активных `Submit`. Не держите mutex во время блокирующего вызова worker.
</details>

<details>
  <summary>Направление решения</summary>

Это задание намеренно сложнее предыдущих: готовый «короткий» пример часто содержит гонку между `Submit` и `close(jobs)`. Возможная архитектура:

1. `Submit` под mutex проверяет `stopping`, увеличивает `submitters` и отпускает mutex.
2. Затем оно отправляет job через `select` с context caller.
3. После send или отмены уменьшает `submitters`.
4. `Shutdown` под mutex ставит `stopping = true`, ждёт `submitters`, затем один раз закрывает `jobs`.
5. Worker завершаются, когда дочитают закрытый jobs; `Shutdown` ждёт их через отдельный `done`-канал и `ctx.Done()`.

Нужно также решить, как отменённый caller влияет на job, уже переданную в канал: после успешного send работа уже принята processor и должна быть обработана согласно policy drain.
</details>

## Задание 5. Тест отмены без `Sleep`

Напишите worker `Run(ctx context.Context, started chan<- struct{}, stopped chan<- struct{})`, который сообщает о запуске, ждёт отмену context и сообщает о завершении. Напишите тест, который:

1. ждёт `started`;
2. вызывает `cancel()`;
3. ждёт `stopped`;
4. имеет timeout только как защиту от вечного зависания.

**Критерии проверки:**

- успешный путь не содержит `time.Sleep`;
- `stopped` закрывается/отправляется через `defer`, поэтому работает при раннем выходе;
- test failure ясно сообщает о незавершившемся worker;
- `cancel` вызывается через `defer`, если тест завершится раньше;
- `go test -race` не сообщает о гонке.

<details>
  <summary>Решение</summary>

```go
func Run(ctx context.Context, started chan<- struct{}, stopped chan<- struct{}) {
	defer close(stopped)
	close(started)
	<-ctx.Done()
}

func TestRunStopsAfterCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	started := make(chan struct{})
	stopped := make(chan struct{})
	go Run(ctx, started, stopped)

	<-started
	cancel()

	select {
	case <-stopped:
	case <-time.After(time.Second):
		t.Fatal("worker не завершился после отмены")
	}
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- выбрать pool, pipeline, fan-out/fan-in или несколько `errgroup.Go` по форме задачи;
- назвать владельца каждого канала и его правило закрытия;
- ограничить и число активных операций, и число созданных goroutine;
- провести `context` до каждого потенциально блокирующего send, receive, SQL и HTTP-вызова;
- выбрать fail-fast или best-effort contract до написания worker;
- доказать тестом shutdown без ожидания «на глаз»;
- прочитать goroutine stack trace и найти отсутствующее событие в протоколе.
