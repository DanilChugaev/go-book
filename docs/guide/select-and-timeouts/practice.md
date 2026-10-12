---
prev: /guide/select-and-timeouts/tests.md
---

# Практика: таймаут экспортов

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
func waitForExports(results <-chan exportResult, expected int, timeout time.Duration) error
```

Она должна получить `expected` успешных или ошибочных результатов, но вернуть ошибку, если общий таймаут закончился раньше.

**Критерии проверки:**

- `time.After(timeout)` создаётся один раз до цикла;
- цикл считает полученные результаты;
- результат с `Err != nil` приводит к ошибке с названием экспорта;
- истечение таймаута приводит к ошибке;
- успешное получение `expected` результатов возвращает `nil`.

<details>
  <summary>Подсказка</summary>

```go
timeoutChannel := time.After(timeout)

for received := 0; received < expected; {
	select {
	case result := <-results:
		received++
		// обработка result
	case <-timeoutChannel:
		return fmt.Errorf("экспорты не завершились за %s", timeout)
	}
}
```
</details>

<details>
  <summary>Решение</summary>

```go
func waitForExports(results <-chan exportResult, expected int, timeout time.Duration) error {
	timeoutChannel := time.After(timeout)

	for received := 0; received < expected; {
		select {
		case result, open := <-results:
			if !open {
				return fmt.Errorf("канал результатов закрылся: получено %d из %d", received, expected)
			}

			received++

			if result.Err != nil {
				return fmt.Errorf("%s завершился с ошибкой: %w", result.Name, result.Err)
			}

			fmt.Printf("%s готов\n", result.Name)
		case <-timeoutChannel:
			return fmt.Errorf("экспорты не завершились за %s", timeout)
		}
	}

	return nil
}
```
</details>

## Задание 4. Используйте таймаут в main

Создайте две задачи, получите `results := saveExports(tasks)` из предыдущей главы и вызовите:

```go
waitForExports(results, 2, 3*time.Second)
```

При ошибке выведите `Ошибка экспорта: <ошибка>` и завершите программу. При успехе выведите `Все экспорты готовы`.

**Критерии проверки:**

- в `main` передаётся ожидаемое число результатов `2`;
- общий лимит равен трём секундам;
- ошибка проверяется через `if err != nil`;
- сообщение об успехе выводится только после успешного ожидания;
- в коде нет `time.Sleep`.

<details>
  <summary>Подсказка</summary>

```go
if err := waitForExports(results, 2, 3*time.Second); err != nil {
	fmt.Println("Ошибка экспорта:", err)
	return
}

fmt.Println("Все экспорты готовы")
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- написать `select` для двух каналов;
- объяснить назначение `default`;
- добавить таймаут через `time.After`;
- отличить общий таймаут от таймаута каждой итерации;
- обработать закрытый канал через второй результат получения;
- объяснить, почему таймаут не отменяет работающую goroutine.
