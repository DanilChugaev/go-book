---
prev: /guide/mutex-and-synchronization/practice.md
next: /guide/context/tests.md
---

# Context: отмена и дедлайны

## Цель урока

Научиться передавать сигнал отмены через `context.Context`, ограничивать операцию по времени, проверять `Done()` и корректно завершать параллельные экспорты Task Manager API.

`context` не выполняет работу за программу и не останавливает goroutine принудительно. Он передаёт сигнал: «работа больше не нужна» или «время истекло». Код, который выполняет работу, должен сам слушать этот сигнал и завершаться.

## Когда нужен context

Контекст полезен, когда работа может стать неактуальной:

- пользователь отменил запрос;
- вышестоящая операция завершилась с ошибкой;
- истёк дедлайн HTTP-запроса;
- нужно остановить несколько связанных goroutine.

В Go контекст обычно передают первым параметром функции:

```go
func exportTasks(ctx context.Context, tasks []task.Task) error {
	// ...
}
```

Контекст не хранят в структуре и не передают как поле `Task`. Он описывает время жизни **операции**, а не данные задачи.

## Базовый контекст

`context.Background()` создаёт пустой корневой контекст:

```go
ctx := context.Background()
```

У него нет отмены, дедлайна и значений. Его обычно используют в `main`, тестах или там, где начинается новая цепочка работы.

## Отмена: `context.WithCancel`

`context.WithCancel` возвращает дочерний контекст и функцию отмены:

```go
ctx, cancel := context.WithCancel(context.Background())
defer cancel()
```

Вызов `cancel()` закрывает канал `ctx.Done()`. Все goroutine, которые слушают этот канал, получают сигнал завершить работу.

```go
package main

import (
	"context"
	"fmt"
)

func work(ctx context.Context, done chan<- struct{}) {
	defer close(done)

	select {
	case <-ctx.Done():
		fmt.Println("Работа отменена:", ctx.Err())
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	done := make(chan struct{})
	go work(ctx, done)
	cancel()
	<-done
}
```

Канал `done` не даёт `main` завершиться раньше worker: после `cancel()` программа ждёт, пока goroutine заметит отмену и напечатает сообщение. `defer cancel()` нужен даже если ожидается естественное завершение: он освобождает ресурсы дочернего контекста, когда текущая функция завершается раньше срока.

## Дедлайн: `context.WithTimeout`

`context.WithTimeout` отменяет контекст автоматически по истечении указанного времени:

```go
ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()
```

Контекст также может быть отменён раньше вручную вызовом `cancel()`.

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func waitForWork(ctx context.Context) {
	select {
	case <-time.After(5 * time.Second):
		fmt.Println("Работа завершена")
	case <-ctx.Done():
		fmt.Println("Работа остановлена:", ctx.Err())
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	waitForWork(ctx)
}
```

В этом примере сработает ветвь `ctx.Done()`, потому что дедлайн в одну секунду наступает раньше условной работы в пять секунд.

## `Done` и `Err`

У контекста есть два главных метода:

- `Done() <-chan struct{}` — канал, который закрывается при отмене или истечении дедлайна;
- `Err() error` — причина завершения.

Возможные причины:

```go
context.Canceled         // вызвали cancel()
context.DeadlineExceeded // истёк timeout или deadline
```

Обычный паттерн внутри долгой операции:

```go
func processTasks(ctx context.Context, tasks []task.Task) error {
	for _, currentTask := range tasks {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		fmt.Println("Обработка:", currentTask.Title)
	}

	return nil
}
```

`default` здесь не создаёт активный цикл: он только быстро проверяет отмену на каждой итерации существующего конечного цикла.

## Контекст и блокирующая операция

Если goroutine ждёт канал, добавьте `ctx.Done()` в тот же `select`:

```go
select {
case result := <-results:
	return result.Err
case <-ctx.Done():
	return ctx.Err()
}
```

Так ожидание результата прекратится, если операция была отменена.

Важно: передача контекста не делает любую функцию отменяемой автоматически. Например, `os.WriteFile` не принимает `context.Context`; отмена не может гарантированно прервать уже начавшийся системный вызов записи. Но код может проверить контекст **до** записи и между отдельными шагами работы.

## Экспорты с отменой

Сделаем экспорты кооперативно отменяемыми. Каждый экспорт проверяет контекст перед началом и перед записью файла:

```go
func exportText(ctx context.Context, path string, tasks []task.Task) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	var builder strings.Builder
	for _, currentTask := range tasks {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		builder.WriteString(currentTask.Summary())
		builder.WriteString("\n")
	}

	if err := ctx.Err(); err != nil {
		return err
	}

	return os.WriteFile(path, []byte(builder.String()), 0o644)
}
```

Для этой версии экспорта добавьте импорт `strings`.

JSON-экспорт устроен аналогично:

```go
func exportJSON(ctx context.Context, path string, tasks []task.Task) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	data, err := json.MarshalIndent(tasks, "", "  ")
	if err != nil {
		return fmt.Errorf("не удалось сериализовать задачи: %w", err)
	}

	if err := ctx.Err(); err != nil {
		return err
	}

	return os.WriteFile(path, data, 0o644)
}
```

## Канал результатов с закрытием

В главе о каналах `saveExports` возвращала буферизированный канал с двумя известными результатами. Теперь функция принимает контекст и закрывает канал, когда оба отправителя завершились:

```go
type exportResult struct {
	Name string
	Err  error
}

func startExports(
	ctx context.Context,
	tasks []task.Task,
	textPath string,
	jsonPath string,
) <-chan exportResult {
	results := make(chan exportResult, 2)
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		result := exportResult{
			Name: "текстовый экспорт",
			Err:  exportText(ctx, textPath, tasks),
		}

		select {
		case results <- result:
		case <-ctx.Done():
		}
	}()

	go func() {
		defer wg.Done()
		result := exportResult{
			Name: "JSON-экспорт",
			Err:  exportJSON(ctx, jsonPath, tasks),
		}

		select {
		case results <- result:
		case <-ctx.Done():
		}
	}()

	go func() {
		wg.Wait()
		close(results)
	}()

	return results
}
```

Каждый экспорт работает в собственной goroutine. Отдельная координирующая goroutine ждёт обе через `WaitGroup` и затем безопасно закрывает `results`: закрывать канал можно только после завершения всех отправителей. `select` при отправке не даёт exporter-goroutine зависнуть, если контекст уже отменён и получатель прекратил ожидание.

## Ожидание результатов с context

Теперь вместо отдельного `time.After` принимаем контекст с дедлайном:

```go
func waitForExports(ctx context.Context, results <-chan exportResult) error {
	for {
		select {
		case result, open := <-results:
			if !open {
				return nil
			}

			if result.Err != nil {
				return fmt.Errorf("%s завершился с ошибкой: %w", result.Name, result.Err)
			}

			fmt.Printf("%s готов\n", result.Name)
		case <-ctx.Done():
			return ctx.Err()
		}
	}
}
```

В `main` создаём общий дедлайн для экспортов:

```go
ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()

results := startExports(ctx, tasks, "tasks.txt", "tasks.json")

if err := waitForExports(ctx, results); err != nil {
	if errors.Is(err, context.DeadlineExceeded) {
		fmt.Println("Экспорты не завершились вовремя")
		return
	}

	fmt.Println("Ошибка экспорта:", err)
}
```

Контекст связывает ожидание и саму работу: после истечения дедлайна `waitForExports` прекращает ожидание, а экспорты замечают отмену при следующей проверке.

## Тестирование отмены без `time.Sleep`

Ручную отмену можно тестировать детерминированно: worker сообщает о завершении через канал, а тест сам вызывает `cancel`. Не нужно ждать произвольное время.

```go
func waitForCancel(ctx context.Context, done chan<- error) {
	defer close(done)

	<-ctx.Done()
	done <- ctx.Err()
}

func TestWaitForCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	done := make(chan error, 1)
	go waitForCancel(ctx, done)

	cancel()

	err, open := <-done
	if !open {
		t.Fatal("worker завершился без результата")
	}
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("ошибка = %v, ожидалась context.Canceled", err)
	}

	if _, open := <-done; open {
		t.Fatal("канал done должен быть закрыт")
	}
}
```

Буфер `done` размером один позволяет worker отправить ошибку и завершиться, даже если планировщик ещё не переключился на тест. Закрытие `done` — явный сигнал, что worker больше не будет отправлять результаты.

Для теста отменяемого экспорта заранее отмените контекст **до** вызова функции:

```go
ctx, cancel := context.WithCancel(context.Background())
cancel()

err := exportText(ctx, path, tasks)
if !errors.Is(err, context.Canceled) {
	t.Fatalf("exportText error = %v, ожидалась context.Canceled", err)
}
```

Так проверяется важный контракт: отменённая операция не начинает запись. Путь создавайте через `filepath.Join(t.TempDir(), "tasks.txt")` и после вызова убедитесь, что файла нет.

## Не используйте context для данных

Контекст не предназначен для передачи названия задачи, пользователя, `TaskStore` или необязательных параметров функции:

```go
// Неудачно:
// ctx = context.WithValue(ctx, "task", currentTask)
```

Для обычных данных используйте параметры. `WithValue` предназначен для данных, связанных с жизненным циклом запроса, и будет рассмотрен только при появлении HTTP-сервера.

## Частые ошибки

### Не вызвать cancel

```go
ctx, _ := context.WithTimeout(context.Background(), time.Second)
```

Сохраните функцию отмены и вызовите её через `defer`:

```go
ctx, cancel := context.WithTimeout(context.Background(), time.Second)
defer cancel()
```

### Не слушать `ctx.Done()`

Передать `ctx` в функцию недостаточно:

```go
func work(ctx context.Context) {
	for {
		// Работа никогда не проверяет ctx.Done().
	}
}
```

Проверяйте `ctx.Err()` или добавляйте `<-ctx.Done()` в `select` в точках, где операция может закончиться.

### Создать новый Background вместо передачи родителя

```go
func exportText(ctx context.Context, tasks []task.Task) error {
	ctx = context.Background() // теряет отмену и дедлайн вызывающего кода
	// ...
}
```

Создавайте дочерний контекст от полученного `ctx`, только если это действительно нужно. Обычно достаточно передать исходный дальше.

### Использовать timeout как единственную защиту от утечки

Таймаут завершает ожидание, но не исправляет goroutine, которая игнорирует `ctx.Done()` или заблокирована на небуферизированной отправке. Проектируйте отправку и завершение goroutine отдельно.

## Дальше

Закрепите отменяемый экспорт задач. Далее перейдём к HTTP-клиенту и серверу: Task Manager API начнёт принимать и возвращать JSON по сети.
