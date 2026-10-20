---
prev: /guide/select-and-timeouts/tests.md
next: /guide/select-and-timeouts/best-practices.md
---

# Задания: таймаут экспортов

Task Manager API получает результаты экспортов через канал. Теперь добавим общий лимит ожидания и понятную ошибку, если не все операции завершились вовремя.

## Задание 1. Получите первый готовый результат

Создайте два канала строк. В двух goroutine отправьте сообщения `Текстовый экспорт готов` и `JSON-экспорт готов`. Используйте `select`, чтобы вывести то сообщение, которое пришло первым.

**Критерии проверки:**

- созданы два канала;
- каждая goroutine отправляет сообщение в свой канал;
- `select` содержит два case получения;
- программа выводит одно из двух сообщений;
- порядок готовности не предполагается.

<details>
  <summary>Подсказка</summary>

```go
select {
case message := <-textExport:
	fmt.Println(message)
case message := <-jsonExport:
	fmt.Println(message)
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	textExport := make(chan string)
	jsonExport := make(chan string)

	go func() {
		textExport <- "Текстовый экспорт готов"
	}()

	go func() {
		jsonExport <- "JSON-экспорт готов"
	}()

	select {
	case message := <-textExport:
		fmt.Println(message)
	case message := <-jsonExport:
		fmt.Println(message)
	}
}
```
</details>

## Задание 2. Добавьте таймаут одного результата

Измените предыдущее задание: если ни один экспорт не прислал результат за одну секунду, выведите `Время ожидания истекло`.

**Критерии проверки:**

- импортирован пакет `time`;
- в `select` есть `case <-time.After(time.Second)`;
- таймаут и результат — альтернативные ветви одного `select`;
- нет `time.Sleep` в `main`.

<details>
  <summary>Подсказка</summary>

```go
case <-time.After(time.Second):
	fmt.Println("Время ожидания истекло")
```
</details>

<details>
  <summary>Решение</summary>

```go
select {
case message := <-textExport:
	fmt.Println(message)
case message := <-jsonExport:
	fmt.Println(message)
case <-time.After(time.Second):
	fmt.Println("Время ожидания истекло")
}
```
</details>

## Задание 3. Ожидайте оба экспорта с общим лимитом

Напишите функцию:

```go
func waitForExportsUntil(results <-chan exportResult, timeout <-chan time.Time) error
```

Она должна получать успешные или ошибочные результаты до закрытия канала, но вернуть ошибку, если общий таймаут закончился раньше.

**Критерии проверки:**

- функция получает готовый канал таймаута;
- цикл читает результаты до закрытия канала;
- результат с `Err != nil` приводит к ошибке с названием экспорта;
- истечение таймаута приводит к ошибке;
- успешное закрытие канала после результатов возвращает `nil`.

<details>
  <summary>Подсказка</summary>

```go
for {
	select {
	case result, open := <-results:
		if !open {
			return nil
		}
		// обработка result
	case <-timeout:
		return fmt.Errorf("экспорты не завершились вовремя")
	}
}
```
</details>

<details>
  <summary>Решение</summary>

```go
func waitForExportsUntil(results <-chan exportResult, timeout <-chan time.Time) error {
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
		case <-timeout:
			return fmt.Errorf("экспорты не завершились вовремя")
		}
	}

}
```
</details>

## Задание 4. Используйте таймаут в main

Создайте две задачи, получите `results := startExports(tasks, textPath, jsonPath)` из предыдущей главы и вызовите обёртку:

```go
waitForExports(results, 3*time.Second)
```

При ошибке выведите `Ошибка экспорта: <ошибка>` и завершите программу. При успехе выведите `Все экспорты готовы`.

**Критерии проверки:**

- общий лимит равен трём секундам;
- ошибка проверяется через `if err != nil`;
- сообщение об успехе выводится только после успешного ожидания;
- в коде нет `time.Sleep`.

<details>
  <summary>Подсказка</summary>

```go
if err := waitForExports(results, 3*time.Second); err != nil {
	fmt.Println("Ошибка экспорта:", err)
	return
}

fmt.Println("Все экспорты готовы")
```
</details>

## Задание 5. Протестируйте таймаут мгновенно

Напишите тест для `waitForExportsUntil`, который проверяет таймаут без `time.Sleep` и без реального `time.After`. Создайте канал `timeout`, закройте его до вызова функции и убедитесь, что получена ошибка.

Затем добавьте успешный сценарий: отправьте один или несколько `exportResult` в буферизированный канал, закройте его и проверьте, что функция вернула `nil`.

**Критерии проверки:**

- тест не ждёт реальное время;
- закрытый `timeout`-канал используется как мгновенный сигнал таймаута;
- успешный results-канал закрывается после отправки результатов;
- ошибочный результат `exportResult{Err: ...}` возвращает ошибку;
- все сценарии запускаются через `t.Run`;
- `go test ./...` проходит быстро и стабильно.

<details>
  <summary>Подсказка</summary>

```go
timeout := make(chan time.Time)
close(timeout)

err := waitForExportsUntil(make(chan exportResult), timeout)
if err == nil {
	t.Fatal("ожидалась ошибка таймаута")
}
```
</details>

<details>
  <summary>Фрагмент успешного сценария</summary>

```go
results := make(chan exportResult, 1)
results <- exportResult{Name: "текстовый экспорт"}
close(results)

timeout := make(chan time.Time)
if err := waitForExportsUntil(results, timeout); err != nil {
	t.Fatalf("waitForExportsUntil вернул ошибку: %v", err)
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- написать `select` для двух каналов;
- объяснить назначение `default`;
- добавить таймаут через `time.After`;
- отличить общий таймаут от таймаута каждой итерации;
- обработать закрытый канал через второй результат получения;
- протестировать таймаут через готовый канал без `time.Sleep`;
- объяснить, почему таймаут не отменяет работающую goroutine.

## Полный исходный код

Здесь будет размещён полный исходный код к практическим заданиям этой главы.

<ExampleSource
  path="examples/23/select-and-timeouts"
  description="заготовка для полного исходного кода практических заданий главы"
/>
