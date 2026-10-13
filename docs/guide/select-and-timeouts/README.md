---
prev: /guide/channels/practice.md
next: /guide/select-and-timeouts/tests.md
---

# Select и таймауты

## Цель урока

Научиться ждать несколько операций через `select`, выполнять неблокирующую проверку с `default`, ограничивать ожидание через `time.After`, корректно обрабатывать закрытые каналы и тестировать таймаут без реальной паузы.

В Task Manager API текстовый и JSON-экспорты уже отправляют результаты в канал. Теперь ограничим общее время ожидания, чтобы программа не зависала бесконечно, если одна операция не завершилась.

## Что делает `select`

`select` ждёт, пока станет готова одна из операций с каналом. Его синтаксис похож на `switch`, но `case` содержит отправку или получение из канала:

```go
select {
case message := <-messages:
	fmt.Println(message)
case err := <-errors:
	fmt.Println(err)
}
```

Если готовы несколько `case`, Go выбирает один из них случайно. Если ни один пока не готов, `select` блокируется, пока хотя бы один не станет готов.

## Ожидание нескольких каналов

Пусть две goroutine отправляют сообщения в разные каналы:

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

	for range 2 {
		select {
		case message := <-textExport:
			fmt.Println(message)
		case message := <-jsonExport:
			fmt.Println(message)
		}
	}
}
```

Порядок первых двух сообщений не гарантирован: `select` обработает тот канал, который готов первым.

## `default`: не блокироваться

Ветка `default` выполняется сразу, если остальные операции не готовы:

```go
select {
case message := <-messages:
	fmt.Println("Получено:", message)
default:
	fmt.Println("Сообщений пока нет")
}
```

Это полезно для проверки «есть ли результат прямо сейчас». Но `default` легко создать активный бесконечный цикл, который постоянно использует CPU:

```go
// Не делайте так без паузы или другой логики:
for {
	select {
	case message := <-messages:
		fmt.Println(message)
	default:
	}
}
```

В большинстве задач лучше дождаться результата или использовать таймаут.

## Таймаут через `time.After`

`time.After` возвращает канал, в который придёт значение времени после указанной задержки:

```go
select {
case message := <-messages:
	fmt.Println("Получено:", message)
case <-time.After(2 * time.Second):
	fmt.Println("Время ожидания истекло")
}
```

В этом `select` будет обработано одно из двух событий:

- пришло сообщение;
- прошло две секунды.

`time.After` удобно для одного простого таймаута. Если таймер нужно останавливать, сбрасывать или использовать много раз, применяют `time.NewTimer`; это более продвинутый случай, который появится позже.

## Общий таймаут для нескольких результатов

Создадим один таймер перед циклом. Тогда у всех результатов будет общий лимит времени, а не новый таймаут для каждой итерации:

```go
timeout := time.After(3 * time.Second)

for received := 0; received < 2; {
	select {
	case result := <-results:
		fmt.Println(result)
		received++
	case <-timeout:
		fmt.Println("Не все экспорты завершились вовремя")
		return
	}
}
```

Если создать `time.After` внутри цикла, каждая итерация получит новый лимит, и общее время ожидания может стать больше задуманного.

## Закрытый канал в select

Получение из закрытого канала готово немедленно. Поэтому важно проверять второй результат:

```go
select {
case message, open := <-messages:
	if !open {
		fmt.Println("Канал закрыт")
		return
	}

	fmt.Println(message)
}
```

Если канал закрыт, но оставить `case message := <-messages` в цикле, этот `case` будет постоянно готов и может мешать обработке других событий. Обычно закрытый канал отключают, присваивая переменной `nil`:

```go
for messages != nil {
	select {
	case message, open := <-messages:
		if !open {
			messages = nil
			continue
		}

		fmt.Println(message)
	}
}
```

Операции с `nil`-каналом никогда не готовы, поэтому соответствующий `case` временно исключается из `select`.

## Таймаут экспортов Task Manager API

Из предыдущей главы у нас есть канал результатов:

```go
type exportResult struct {
	Name string
	Err  error
}

func startExports(tasks []task.Task, textPath, jsonPath string) <-chan exportResult {
	// запускает два экспорта и возвращает канал с двумя результатами
}
```

Разделим ожидание и создание таймера. В production-коде обёртка использует `time.After`:

```go
func waitForExports(results <-chan exportResult, timeout time.Duration) error {
	return waitForExportsUntil(results, time.After(timeout))
}

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

`waitForExportsUntil` принимает готовый канал таймаута. Это делает её детерминированной в тесте: вместо реальных секунд тест может передать уже закрытый канал.

Вызов из `main`:

```go
results := startExports(tasks, "tasks.txt", "tasks.json")

if err := waitForExports(results, 3*time.Second); err != nil {
	fmt.Println("Ошибка экспорта:", err)
	return
}
```

Функция не предполагает порядок результатов: текстовый и JSON-экспорт могут завершаться в любом порядке.

## Тестирование таймаута без ожидания

Тест не должен ждать три реальные секунды. Создайте канал `chan time.Time`, закройте его до вызова функции и передайте в `waitForExportsUntil`:

```go
func TestWaitForExportsUntilTimeout(t *testing.T) {
	results := make(chan exportResult)
	timeout := make(chan time.Time)
	close(timeout)

	err := waitForExportsUntil(results, timeout)
	if err == nil {
		t.Fatal("ожидалась ошибка таймаута")
	}
}
```

Закрытый канал готов к получению немедленно, поэтому `select` выбирает ветвь таймаута без паузы. Тест не зависит от скорости машины или планировщика.

Проверьте отдельно успешное завершение: создайте буферизированный канал, отправьте в него результаты, закройте и убедитесь, что `waitForExportsUntil` возвращает `nil`.

## Почему таймаут не отменяет работу

`time.After` прекращает **ожидание результата** в текущей goroutine, но не останавливает экспортные goroutine автоматически. Они могут завершиться позже и попытаться отправить результат.

В нашем примере используется буферизированный канал на два результата, поэтому поздняя отправка не заблокирует goroutine. Для настоящей отмены работы используют `context`, который появится в отдельной главе.

## Частые ошибки

### Таймер внутри цикла вместо общего лимита

```go
for range 2 {
	select {
	case result := <-results:
		fmt.Println(result)
	case <-time.After(3 * time.Second):
		return
	}
}
```

Это даёт до трёх секунд на каждый результат. Создайте один `timeout := time.After(...)` перед циклом, если нужен общий лимит.

### Ожидание закрытого канала без `ok`

```go
case result := <-results:
	// После закрытия result будет нулевым значением и case всегда готов.
```

Получайте второй результат `open` и завершайте или отключайте закрытый канал.

### `default` вместо ожидания

```go
select {
case result := <-results:
	fmt.Println(result)
default:
	fmt.Println("Нет результата")
}
```

Такой код не ждёт экспорт. Если результат должен прийти, используйте обычный `select` или таймаут.

### Реальный `time.After` в unit-тесте

```go
// Тест будет ждать реальную секунду.
err := waitForExports(results, time.Second)
```

Тестируйте `waitForExportsUntil` и передавайте готовый timeout-канал. Обёртка с `time.After` остаётся короткой и не требует отдельной задержки в тесте.

### Закрытие чужого канала

Функция `waitForExports` только получает результаты, поэтому не должна закрывать `results`. Закрывать канал имеет право код, который владеет всеми отправителями.

## Дальше

Закрепите ожидание экспортов с общим таймаутом. Затем перейдём к `Mutex` и синхронизации общего состояния: это дополнит каналы в задачах, где данные нужно не передавать, а безопасно изменять из нескольких goroutine.
