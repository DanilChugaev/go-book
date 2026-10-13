---
prev: /guide/context/tests.md
next: /guide/context/best-practices.md
---

# Задания: отменяемый экспорт

Теперь Task Manager API умеет прекращать ожидание и подготовку экспортов, если работа больше не нужна или истёк общий дедлайн.

## Задание 1. Обработайте ручную отмену

Напишите функцию:

```go
func waitForCancel(ctx context.Context) error
```

Она должна ждать `ctx.Done()` и вернуть `ctx.Err()`. В `main` создайте контекст через `context.WithCancel`, запустите `waitForCancel` в goroutine, вызовите `cancel()` и выведите полученную ошибку.

**Критерии проверки:**

- `context.Context` — первый параметр функции;
- функция ждёт `<-ctx.Done()`;
- функция возвращает `ctx.Err()`;
- `cancel()` вызывается явно;
- итоговая ошибка равна `context.Canceled`.

<details>
  <summary>Подсказка</summary>

```go
func waitForCancel(ctx context.Context) error {
	<-ctx.Done()
	return ctx.Err()
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import (
	"context"
	"fmt"
)

func waitForCancel(ctx context.Context) error {
	<-ctx.Done()
	return ctx.Err()
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	errors := make(chan error, 1)
	go func() {
		errors <- waitForCancel(ctx)
	}()

	cancel()
	fmt.Println(<-errors)
}
```
</details>

## Задание 2. Добавьте дедлайн

Напишите функцию `waitForWork(ctx context.Context) error`. Внутри неё через `select` ждите либо условную работу в течение двух секунд, либо отмену контекста. В `main` создайте контекст с таймаутом в одну секунду.

**Критерии проверки:**

- используется `context.WithTimeout`;
- после создания контекста есть `defer cancel()`;
- `select` содержит `time.After(2 * time.Second)` и `ctx.Done()`;
- функция возвращает `context.DeadlineExceeded`;
- в `main` проверяется причина через `errors.Is`.

<details>
  <summary>Подсказка</summary>

```go
case <-ctx.Done():
	return ctx.Err()
```
</details>

<details>
  <summary>Решение</summary>

```go
func waitForWork(ctx context.Context) error {
	select {
	case <-time.After(2 * time.Second):
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	err := waitForWork(ctx)
	if errors.Is(err, context.DeadlineExceeded) {
		fmt.Println("Время ожидания истекло")
	}
}
```
</details>

## Задание 3. Сделайте текстовый экспорт отменяемым

Измените функцию текстового экспорта:

```go
func exportText(ctx context.Context, path string, tasks []task.Task) error
```

Проверьте `ctx.Done()` на каждой итерации формирования текста и перед записью файла. При отмене верните `ctx.Err()`.

**Критерии проверки:**

- `ctx` — первый параметр;
- цикл по задачам проверяет отмену через `select`;
- перед `os.WriteFile` проверяется `ctx.Err()`;
- отменённый контекст не приводит к записи нового файла;
- успешный контекст сохраняет экспорт.

<details>
  <summary>Подсказка</summary>

```go
select {
case <-ctx.Done():
	return ctx.Err()
default:
}
```
</details>

<details>
  <summary>Решение</summary>

```go
func exportText(ctx context.Context, path string, tasks []task.Task) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	var content string
	for _, currentTask := range tasks {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		content += currentTask.Summary() + "\n"
	}

	if err := ctx.Err(); err != nil {
		return err
	}

	return os.WriteFile(path, []byte(content), 0o644)
}
```
</details>

## Задание 4. Добавьте context к экспортам

Измените `startExports` и `waitForExports` так, чтобы они принимали `context.Context`. В `main` создайте общий `WithTimeout` на три секунды, запустите экспорты и обработайте `context.DeadlineExceeded` отдельным сообщением.

**Критерии проверки:**

- один контекст передаётся в `startExports`, `exportText`, `exportJSON` и `waitForExports`;
- `startExports` закрывает канал результатов после отправки обоих результатов;
- `waitForExports` слушает и `results`, и `ctx.Done()`;
- при дедлайне `main` сообщает, что экспорты не завершились вовремя;
- в каждом `WithTimeout` есть `defer cancel()`.

<details>
  <summary>Подсказка</summary>

```go
ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()

results := startExports(ctx, tasks, textPath, jsonPath)
err := waitForExports(ctx, results)
```
</details>

<details>
  <summary>Возможное решение</summary>

```go
ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()

results := startExports(ctx, tasks, textPath, jsonPath)

if err := waitForExports(ctx, results); err != nil {
	if errors.Is(err, context.DeadlineExceeded) {
		fmt.Println("Экспорты не завершились вовремя")
		return
	}

	fmt.Println("Ошибка экспорта:", err)
	return
}

fmt.Println("Все экспорты готовы")
```
</details>

## Задание 5. Протестируйте worker с отменой

Напишите тест, в котором worker получает context, ждёт `ctx.Done()`, отправляет `ctx.Err()` в буферизированный канал и закрывает канал после результата. Тест должен вызвать `cancel` вручную и проверить `context.Canceled` без `time.Sleep`.

**Критерии проверки:**

- worker получает context параметром;
- worker не использует фиксированную задержку;
- тест вызывает `cancel()` после запуска worker;
- результат проверяется через `errors.Is`;
- тест проверяет закрытие канала после результата;
- `go test ./...` и `go test -race ./...` проходят успешно.

<details>
  <summary>Подсказка</summary>

Буферизированный канал размера `1` позволит worker отправить ошибку, даже если тест ещё не начал чтение:

```go
done := make(chan error, 1)
```
</details>

<details>
  <summary>Решение</summary>

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
</details>

## Задание 6. Отмените экспорт до записи

Создайте отменённый context до вызова `exportText`. Путь к файлу постройте через `filepath.Join(t.TempDir(), "tasks.txt")`. Проверьте, что функция возвращает `context.Canceled`, а файл не создаётся.

**Критерии проверки:**

- используется `t.TempDir`;
- context отменён до вызова экспорта;
- ошибка проверяется через `errors.Is`;
- проверяется отсутствие файла через `os.Stat` и `os.IsNotExist`;
- тест не использует `time.Sleep`.

<details>
  <summary>Подсказка</summary>

```go
ctx, cancel := context.WithCancel(context.Background())
cancel()

err := exportText(ctx, path, tasks)
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- создать `Background`, `WithCancel` и `WithTimeout`;
- вызвать `cancel` через `defer`;
- слушать `ctx.Done()` внутри `select`;
- вернуть `ctx.Err()` из отменяемой функции;
- отличить `context.Canceled` от `context.DeadlineExceeded`;
- передать общий context по цепочке экспортов.
- протестировать отмену worker без `time.Sleep`;
- проверить, что отменённый экспорт не создаёт файл.
