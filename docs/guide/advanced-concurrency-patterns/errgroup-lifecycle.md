---
prev: /guide/advanced-concurrency-patterns/fan-out-pipeline.md
next: /guide/advanced-concurrency-patterns/goroutine-leaks.md
---

# `errgroup`, отмена и graceful shutdown

## Почему одного `WaitGroup` недостаточно

`sync.WaitGroup` хорошо отвечает на вопрос «все goroutine завершились?», но не передаёт ошибку и не отменяет остальные работы после первой неудачи. В результате появляется ручной код: канал ошибок, `sync.Once`, `cancel`, закрытие каналов и порядок ожидания.

Для набора связанных операций часто подходит `golang.org/x/sync/errgroup`:

```bash
go get golang.org/x/sync/errgroup
```

`errgroup.Group` запускает функции, ждёт их через `Wait()` и возвращает первую ненулевую ошибку. `errgroup.WithContext` создаёт context, отменяемый при первой ошибке группы. Это естественная модель для операции «всё должно выполниться, иначе остальное больше не нужно».

## Несколько независимых операций

Task Manager может параллельно запросить настройки уведомлений и правила приоритета перед запуском batch-операции:

```go
func loadDependencies(ctx context.Context, client *Client) (Rules, Settings, error) {
	group, groupCtx := errgroup.WithContext(ctx)

	var rules Rules
	var settings Settings

	group.Go(func() error {
		loadedRules, err := client.LoadRules(groupCtx)
		if err != nil {
			return fmt.Errorf("загрузить правила приоритета: %w", err)
		}
		rules = loadedRules
		return nil
	})

	group.Go(func() error {
		loadedSettings, err := client.LoadSettings(groupCtx)
		if err != nil {
			return fmt.Errorf("загрузить настройки уведомлений: %w", err)
		}
		settings = loadedSettings
		return nil
	})

	if err := group.Wait(); err != nil {
		return Rules{}, Settings{}, err
	}

	return rules, settings, nil
}
```

Записи `rules` и `settings` выполняют разные goroutine, а читаются только после `group.Wait()`, поэтому между ними нет гонки. Если одна операция вернула ошибку, `groupCtx` отменяется; другая операция должна передавать его в HTTP/SQL-вызовы или проверять `groupCtx.Done()`, чтобы завершиться быстро.

::: tip Первая ошибка не означает мгновенную остановку
`errgroup` вызывает cancel, но не убивает goroutine. `Wait()` вернётся только после завершения всех функций. Если функция игнорирует context или навечно ждёт канал, группа всё равно зависнет. Отмена должна доходить до каждого блокирующего места.
:::

## Ограничение `errgroup.SetLimit`

`SetLimit` ограничивает число одновременно активных функций группы. Это часто компактнее worker pool для конечного списка задач:

```go
func refreshPriorities(
	ctx context.Context,
	client PriorityRefresher,
	taskIDs []TaskID,
	limit int,
) error {
	if limit < 1 {
		return errors.New("limit должен быть больше нуля")
	}

	group, groupCtx := errgroup.WithContext(ctx)
	group.SetLimit(limit)

	for _, taskID := range taskIDs {
		id := taskID
		group.Go(func() error {
			if err := client.Refresh(groupCtx, id); err != nil {
				return fmt.Errorf("обновить приоритет задачи %d: %w", id, err)
			}
			return nil
		})
	}

	return group.Wait()
}
```

`group.Go` блокируется, когда активных функций уже `limit`. Это создаёт backpressure в goroutine, которая добавляет работу. Поэтому проверяйте **`groupCtx`** в цикле, если producer должен перестать добавлять работу после замеченной ошибки другой функции:

```go
for _, taskID := range taskIDs {
	if err := groupCtx.Err(); err != nil {
		break
	}

	id := taskID
	group.Go(func() error {
		return client.Refresh(groupCtx, id)
	})
}
```

Проверка выполняется до `Go`, поэтому ошибка может всё равно прийти в момент, когда следующий `Go` уже ждёт свободное место. Это нормальная граница API `errgroup`: операции обязаны получать `groupCtx` и быстро завершаться, даже если одна из них успела стартовать после cancel. Если для входного потока нужно строго не принимать новые jobs после ошибки, используйте явный worker pool с `select` по каналу jobs и `groupCtx.Done()`.

`SetLimit` нельзя менять, пока в группе есть активные goroutine. Не вызывайте `Go` после начала `Wait`: жизненный цикл группы должен быть простым — создать, добавить работы, один раз дождаться.

Для сценария, где producer не должен блокироваться, есть `TryGo`: он возвращает `false`, если лимит достигнут. Но тогда вызывающий код обязан выбрать политику: поставить задачу в очередь, отклонить её, выполнить синхронно или записать для повтора. Игнорировать `false` означает тихо потерять работу.

## Fail-fast или собрать все ошибки

`errgroup` возвращает первую ошибку. Это правильно, когда дальнейшая работа бессмысленна или опасна: миграция, единая batch-операция, построение ответа из обязательных источников.

Иногда нужно обработать все независимые задачи и показать полный отчёт: например, nightly export десятков проектов. Тогда одна ошибка не должна отменять остальные. Используйте `WaitGroup` и канал результатов/ошибок или собирайте ошибки под mutex, затем объединяйте через `errors.Join`.

```go
func runAll(ctx context.Context, taskIDs []TaskID, run func(context.Context, TaskID) error) error {
	errs := make(chan error, len(taskIDs))
	var workers sync.WaitGroup

	for _, taskID := range taskIDs {
		id := taskID
		workers.Add(1)
		go func() {
			defer workers.Done()
			if err := run(ctx, id); err != nil {
				errs <- fmt.Errorf("обработать задачу %d: %w", id, err)
			}
		}()
	}

	workers.Wait()
	close(errs)

	var allErrors []error
	for err := range errs {
		allErrors = append(allErrors, err)
	}
	return errors.Join(allErrors...)
}
```

Этот вариант подходит только для ограниченного списка: он запускает goroutine на каждую задачу и буферизует все ошибки. Для больших объёмов комбинируйте worker pool с result collector. Всегда выбирайте и документируйте семантику: **fail-fast** или **best-effort with report**.

## Graceful shutdown worker group

Graceful shutdown — это не «сразу выйти из `main`». Нужно перестать принимать новую работу, сообщить активным goroutine об остановке, дождаться их в ограниченное время и лишь затем закрыть зависимости.

Ниже приведён skeleton фонового processor. Он владеет `jobs`, поэтому только он может закрыть этот канал:

```go
type Processor struct {
	jobs   chan TaskID
	cancel context.CancelFunc
	done   chan struct{}
}

func StartProcessor(parent context.Context, workerCount int, run func(context.Context, TaskID) error) *Processor {
	ctx, cancel := context.WithCancel(parent)
	processor := &Processor{
		jobs:   make(chan TaskID, workerCount),
		cancel: cancel,
		done:   make(chan struct{}),
	}

	var workers sync.WaitGroup
	workers.Add(workerCount)
	for range workerCount {
		go func() {
			defer workers.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case id, open := <-processor.jobs:
					if !open {
						return
					}
					_ = run(ctx, id) // Реальная политика ошибок определяется вызывающим кодом.
				}
			}
		}()
	}

	go func() {
		workers.Wait()
		close(processor.done)
	}()

	return processor
}

func (processor *Processor) Submit(ctx context.Context, id TaskID) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case processor.jobs <- id:
		return nil
	}
}

func (processor *Processor) Shutdown(ctx context.Context) error {
	close(processor.jobs) // Больше не принимаем новые задания.
	processor.cancel()    // Просим активные операции остановиться.

	select {
	case <-processor.done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}
```

В production этот skeleton требует дополнительного контракта: `Submit` и `Shutdown` нельзя вызывать конкурентно без защиты состояния, иначе `Submit` может отправить в уже закрытый канал и вызвать panic. Возможные решения: отдельный mutex/флаг приёма, единственная goroutine-владелец очереди или архитектура, где caller гарантирует порядок. Этот пример специально показывает, что закрытие канала — часть API, а не локальная мелочь.

Также определите продуктовую политику для уже принятых jobs:

- **drain:** перестать принимать новые, закрыть `jobs`, дать worker обработать уже принятые задания до deadline;
- **cancel immediately:** отменить context, прервать всё, что поддерживает отмену;
- **durable handoff:** сохранить необработанные задания в БД/очереди для следующего процесса.

Нельзя обещать drain и сразу вызывать `cancel`: worker может оставить уже принятые задания. Для настоящего drain сначала закройте вход, дождитесь пустой очереди и worker, а отмену применяйте только после истечения внешнего deadline как аварийный fallback.

## Shutdown HTTP-сервера и фоновой работы

Последовательность Task Manager API при `SIGTERM` обычно такая:

1. перестать принимать новые HTTP-запросы через `server.Shutdown`;
2. перестать принимать новые фоновые jobs;
3. дать активным handler и worker завершиться в `shutdownCtx`;
4. после ожидания закрыть БД, HTTP client transports и остальные зависимости;
5. если deadline истёк, записать ошибку и завершить процесс по политике платформы.

Сначала закрывать `db` или отменять root context, пока handler ещё обслуживают запросы, опасно: это создаёт лишние `500` и теряет управляемость. Один root context и единый ограниченный deadline помогают всем подсистемам завершаться согласованно.

## Тестирование отмены и shutdown

Не проверяйте остановку через `time.Sleep`. Worker должен иметь тестируемую контрольную точку:

```go
func TestWorkerStopsAfterCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	started := make(chan struct{})
	stopped := make(chan struct{})

	go func() {
		defer close(stopped)
		close(started)
		<-ctx.Done()
	}()

	<-started
	cancel()

	select {
	case <-stopped:
	case <-time.After(time.Second):
		t.Fatal("worker не завершился после отмены")
	}
}
```

Здесь timeout — не синхронизация успешного пути, а защитное ограничение теста при баге. События `started` и `stopped` создают детерминированный порядок. В следующей странице разберём, какие блокировки чаще всего оставляют goroutine навсегда жить.
