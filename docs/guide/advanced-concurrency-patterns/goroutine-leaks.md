---
prev: /guide/advanced-concurrency-patterns/errgroup-lifecycle.md
next: /guide/advanced-concurrency-patterns/tests.md
---

# Утечки goroutine и диагностика

Goroutine завершается только когда возвращается её функция. Если она навечно ждёт канал, lock, I/O без дедлайна или зависшую зависимость, runtime продолжает хранить её стек и связанные объекты. Одна утечка может быть незаметна; утечка на каждый HTTP-запрос постепенно исчерпает память, соединения и лимиты процесса.

## Частые причины утечек

### Отправитель ждёт получателя

```go
func wrong() {
	results := make(chan string)
	go func() {
		results <- "готово" // Навсегда ждёт, если wrong вернулась.
	}()
	return
}
```

Не «лечите» это случайным буфером: он только сдвинет проблему, если отправок станет больше буфера. Выберите один контракт:

- caller гарантированно читает все результаты;
- канал имеет доказанно достаточный буфер для фиксированного числа отправок;
- sender выбирает между отправкой и `<-ctx.Done()`.

```go
select {
case results <- value:
case <-ctx.Done():
	return
}
```

### Получатель ждёт канал, который никто не закроет

```go
for result := range results {
	process(result)
}
```

`range` завершится только после `close(results)`. Если producer завершился без закрытия, consumer утечёт. При нескольких producer сделайте одного координатора: `WaitGroup` → `close(results)`.

### Заблокированный `select` без отмены

```go
result := <-results // Может ждать бесконечно.
```

Если операция имеет жизненный цикл запроса или shutdown, добавьте context:

```go
select {
case result := <-results:
	return result
case <-ctx.Done():
	return Result{}, ctx.Err()
}
```

### Сеть без context и timeout

HTTP-клиент без timeout/контекста может ждать сервер, DNS или тело ответа непредсказуемо долго. Передавайте `context` через `http.NewRequestWithContext`, настраивайте ограничения `http.Client` по контракту и всегда закрывайте `response.Body` после успешного `Do`.

### Неосвобождённый lock или token

Забытый `Unlock`, `wg.Done` или `<-semaphore` может заблокировать не одну goroutine, а всех следующих участников. Регистрируйте cleanup сразу после успешного захвата:

```go
semaphore <- struct{}{}
defer func() { <-semaphore }()

mutex.Lock()
defer mutex.Unlock()
```

### Consumer завершился раньше producer

Pipeline часто ломается так: sink увидел первую ошибку и вернулся, а upstream продолжает посылать значения в небуферизированный канал. Для этого и нужен общий `cancel`, который все sender проверяют при send.

## Leak или просто ожидающая goroutine?

Не вся долго живущая goroutine — утечка. HTTP server, worker, scheduler или metrics collector могут жить всё время процесса, если у них есть владелец и чёткий путь shutdown. Утечка — goroutine, которая больше не выполняет полезную работу и не имеет гарантированного события завершения.

Полезная документация для компонента отвечает:

```text
Start создаёт N worker.
Они завершаются, когда закрыт jobs или отменён ctx.
Stop/Shutdown ждёт их через done.
Владелец jobs — Processor; внешний код канал не закрывает.
```

## Наблюдаемость: счётчик goroutine

Быстрый сигнал — число goroutine в процессе:

```go
logger.Debug("runtime состояние", "goroutines", runtime.NumGoroutine())
```

Само число не доказывает утечку: оно меняется из-за HTTP transport, тестов, runtime и нормальных фоновых задач. Но устойчивый рост после одинаковой нагрузки — повод исследовать проблему. Не делайте `NumGoroutine` строгим production-SLO без базовой линии и контекста среды.

## Профиль goroutine

`runtime/pprof` показывает, где goroutine остановлены. В тесте можно записать профиль:

```go
func TestWriteGoroutineProfile(t *testing.T) {
	file, err := os.Create("goroutine.out")
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()

	if err := pprof.Lookup("goroutine").WriteTo(file, 2); err != nil {
		t.Fatal(err)
	}
}
```

Для работающего debug-сервера возможен endpoint `net/http/pprof`, но его нельзя открывать публично: профиль раскрывает пути, функции, внутреннюю структуру и иногда данные аргументов. Открывайте `pprof` только в защищённой внутренней сети или временно при расследовании.

При анализе ищите множество одинаковых stack trace, например горутины, остановленные на:

```text
chan send
your/module/internal/export.sendResult(...)
```

Это указывает не на «медленную Go runtime», а на протокол: кто-то отправляет результат, который никто не читает или не отменяет.

## Тесты жизненного цикла

Лучший способ не получить утечку — тестировать договорённость о завершении, а не только функциональный результат.

### Barrier вместо `Sleep`

Используйте каналы, чтобы тест сам управлял фазами worker:

```go
func TestRunStopsWhenContextCanceled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

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
		t.Fatal("goroutine не завершилась")
	}
}
```

Тест ждёт конкретное событие `stopped`; timeout нужен только для того, чтобы test suite не завис навсегда при регрессии.

### Повтор и race detector

Конкурентные проблемы часто проявляются не в каждом запуске:

```bash
go test -race ./...
go test -count=100 ./internal/export
go test -run TestProcessorShutdown -count=100 ./internal/worker
```

Race detector находит несинхронизированный доступ к памяти, но не доказывает отсутствие утечек и deadlock. Повтор тестов повышает шанс поймать ошибку расписания; детерминированные контрольные точки всё равно важнее.

## Диагностика зависшего теста

У Go есть встроенный timeout пакета:

```bash
go test -timeout 10s ./internal/worker
```

Когда timeout истечёт, Go напечатает stack trace активных goroutine. Читайте его как карту ожиданий:

- `chan receive` — кто должен отправить или закрыть канал?
- `chan send` — кто должен прочитать либо отменить sender?
- `sync.(*WaitGroup).Wait` — все ли пути вызывают `Done`?
- `sync.(*Mutex).Lock` — кто держит lock и почему не освобождает?
- network I/O — передан ли context, есть ли timeout, закрыто ли response body?

Начинайте с goroutine вашего пакета, затем восстановите граф: producer → channel → consumer → shutdown signal. Обычно корень — не строка, на которой тест завис, а отсутствующее событие в другой goroutine.

## Минимальная политика для Task Manager API

- Каждый HTTP handler использует `c.Request.Context()` для downstream SQL и HTTP-вызовов.
- У каждой фоновой группы есть `Start`/`Shutdown` или понятный владелец `errgroup.Wait`.
- У потоков результатов известен единственный код, который закрывает канал.
- У внешних операций есть timeout и cleanup (`cancel`, `Close`, `Rollback`).
- CI запускает `go test -race ./...`; для конкурентных пакетов есть тесты отмены и shutdown.
- При росте числа goroutine расследуются профили и протоколы каналов, а не добавляются бесконечные буферы.

Следующие страницы закрепят паттерны вопросами и заданиями. Главное правило всей главы: каждая созданная goroutine должна иметь проверяемый путь к завершению.
