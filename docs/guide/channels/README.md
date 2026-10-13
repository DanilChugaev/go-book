---
prev: /guide/goroutines/practice.md
next: /guide/channels/tests.md
---

# Каналы

## Цель урока

Научиться передавать значения между goroutine через каналы, понимать блокировку операций, использовать буфер, закрывать канал и получать результаты параллельных экспортов Task Manager API.

Канал (`chan`) — типизированный путь передачи значений между goroutine. В отличие от общих переменных, канал помогает явно показать, кто отправляет результат и кто его получает.

## Создание канала

Канал создают через `make` и указывают тип передаваемых значений:

```go
messages := make(chan string)
results := make(chan error)
```

`chan string` передаёт строки, а `chan error` — ошибки. Нулевое значение канала — `nil`, с ним нельзя выполнять обычную отправку и получение: такая операция заблокируется навсегда.

## Отправка и получение

Оператор `<-` используют с двух сторон:

```go
messages <- "Экспорт готов" // отправить в канал
message := <-messages        // получить из канала
```

Простейший рабочий пример требует двух goroutine:

```go
package main

import "fmt"

func main() {
	messages := make(chan string)

	go func() {
		messages <- "Текстовый экспорт готов"
	}()

	message := <-messages
	fmt.Println(message)
}
```

Здесь `main` ждёт результат через `<-messages`, а анонимная goroutine отправляет строку. После получения обе goroutine могут завершиться.

## Небуферизированный канал

Канал без размера — небуферизированный:

```go
messages := make(chan string)
```

Отправка в него ждёт, пока другая goroutine будет готова получить значение. Получение ждёт, пока кто-то отправит значение. Это называют синхронной передачей.

Такой код завершится deadlock:

```go
messages := make(chan string)
messages <- "сообщение" // main ждёт получателя, но получить некому
```

Нельзя сначала отправить, а затем получить в той же goroutine через небуферизированный канал. Нужна другая goroutine или буфер.

## Буферизированный канал

Размер канала указывают вторым аргументом `make`:

```go
messages := make(chan string, 2)
```

Такой канал хранит до двух сообщений без немедленного получателя:

```go
messages := make(chan string, 2)

messages <- "Текстовый экспорт готов"
messages <- "JSON-экспорт готов"

fmt.Println(<-messages)
fmt.Println(<-messages)
```

Третья отправка будет ждать, пока освободится место. Буфер не отменяет необходимость продумать синхронизацию: он только допускает ограниченное число отправок без ожидания.

Функции `len` и `cap` показывают текущее число сообщений и вместимость канала:

```go
messages := make(chan string, 2)
messages <- "готово"

fmt.Println(len(messages)) // 1
fmt.Println(cap(messages)) // 2
```

В прикладном коде не принимайте важные решения только по `len(channel)`: состояние может измениться другой goroutine сразу после проверки.

## Закрытие канала

Отправитель закрывает канал, когда новых значений больше не будет:

```go
close(messages)
```

Получать уже отправленные значения из закрытого канала можно. После опустошения получение вернёт нулевое значение типа и `false` во втором результате:

```go
message, open := <-messages
if !open {
	fmt.Println("Канал закрыт")
}
```

Для `chan string` нулевое значение — пустая строка. Поэтому проверка второго результата нужна, если пустая строка может быть настоящим сообщением.

```go
message, open := <-messages
fmt.Println(message, open)
```

Закрывать канал должен тот, кто отправляет значения. Получатель не знает, будут ли ещё сообщения, поэтому обычно не вызывает `close`.

::: warning Ошибочные операции с закрытым каналом
Повторный `close` и отправка в закрытый канал вызывают panic. Получение из закрытого канала безопасно.
:::

## `range` по каналу

`range` получает значения из канала до его закрытия и опустошения:

```go
package main

import "fmt"

func main() {
	messages := make(chan string)

	go func() {
		defer close(messages)

		messages <- "Текстовый экспорт готов"
		messages <- "JSON-экспорт готов"
	}()

	for message := range messages {
		fmt.Println(message)
	}
}
```

Если канал не закрыть, `range` будет ждать следующее сообщение вечно. Поэтому `defer close(messages)` удобно ставить в goroutine, которая владеет отправкой всех сообщений.

## Направление канала в параметрах

Функция может принимать канал только для отправки или только для получения:

```go
func sendStatus(statuses chan<- string, message string) {
	statuses <- message
}

func printStatuses(statuses <-chan string) {
	for message := range statuses {
		fmt.Println(message)
	}
}
```

- `chan<- string` — канал только для отправки;
- `<-chan string` — канал только для получения;
- `chan string` — двунаправленный канал.

Направление защищает API функции: компилятор не даст получить из `chan<- string` или отправить в `<-chan string`.

## Результаты параллельных экспортов

В прошлой главе `WaitGroup` ожидал два экспорта, а ошибки записывались в отдельные переменные. Теперь каждая goroutine передаёт свой результат в канал. Так получатель может обработать результаты по мере готовности и узнать момент завершения всех отправителей через закрытие канала.

```go
type exportResult struct {
	Name string
	Err  error
}

func startExports(tasks []task.Task, textPath, jsonPath string) <-chan exportResult {
	results := make(chan exportResult, 2)
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		err := exportText(textPath, tasks)
		results <- exportResult{Name: "текстовый экспорт", Err: err}
	}()

	go func() {
		defer wg.Done()
		err := storage.SaveTasks(jsonPath, tasks)
		results <- exportResult{Name: "JSON-экспорт", Err: err}
	}()

	go func() {
		wg.Wait()
		close(results)
	}()

	return results
}
```

У канала буфер размером `2`: обе goroutine могут отправить результат, даже если получатель начнёт читать их чуть позже. `WaitGroup` нужен только координатору, который закрывает канал после завершения обоих отправителей. Возвращаемое значение `<-chan exportResult` сообщает вызывающему коду: он может только получать результаты.

Получатель может использовать `range` и не знать количество worker заранее:

```go
results := startExports(tasks, "tasks.txt", "tasks.json")

for result := range results {

	if result.Err != nil {
		fmt.Printf("Ошибка %s: %v\n", result.Name, result.Err)
		continue
	}

	fmt.Printf("%s готов\n", result.Name)
}
```

Закрытие `results` — часть контракта `startExports`: после `range` вызывающий код знает, что все экспортные worker завершились. Получатель не закрывает канал, потому что не владеет отправителями.

## Тестирование жизненного цикла канала

Тест worker не должен использовать `time.Sleep` или получать «ровно два» результата по счётчику. Чтение `range` до закрытия канала одновременно проверяет три свойства:

1. каждый worker отправил результат;
2. координатор дождался worker через `WaitGroup`;
3. канал корректно закрыт.

```go
func TestStartExports(t *testing.T) {
	directory := t.TempDir()

	results := startExports(
		[]task.Task{{ID: 1, Title: "Купить молоко", Priority: 2}},
		filepath.Join(directory, "tasks.txt"),
		filepath.Join(directory, "tasks.json"),
	)

	resultCount := 0
	for result := range results {
		resultCount++
		if result.Err != nil {
			t.Errorf("%s export returned error: %v", result.Name, result.Err)
		}
	}

	if resultCount != 2 {
		t.Errorf("получено результатов: %d, ожидалось 2", resultCount)
	}
}
```

После `range` отдельно проверьте существование обоих файлов через `os.Stat`. Пути из `t.TempDir` изолируют тест от рабочей папки проекта.

## Частые ошибки

### Отправка без получателя в небуферизированный канал

```go
results := make(chan error)
results <- nil // deadlock, если получить некому
```

Запустите отправку в другой goroutine либо используйте канал с буфером, если это соответствует сценарию.

### `range` по незакрытому каналу

```go
for result := range results {
	fmt.Println(result)
}
```

Этот цикл закончится только после `close(results)`. Если канал никогда не закрывается, программа зависнет.

### Закрытие канала получателем

Получатель не должен закрывать канал, если другой код ещё может отправить значение. Это может вызвать `panic: send on closed channel`.

### Несколько отправителей закрывают один канал

```go
go func() {
	results <- textResult
	close(results)
}()

go func() {
	results <- jsonResult // может отправить в уже закрытый канал
}()
```

Когда отправителей несколько, отдельная координирующая goroutine должна дождаться их через `WaitGroup` и только затем вызвать `close(results)`.

### Использование канала как мьютекса без понимания

Канал не является универсальной заменой `Mutex`, `WaitGroup` или нормальной структуры программы. Сначала определите, передаёте ли вы данные между goroutine или защищаете общее состояние. `Mutex` подробно разберём позднее.

## Дальше

Закрепите передачу результатов экспортов через каналы. В следующей главе `select` позволит ждать один из нескольких каналов, добавлять таймауты и не блокировать работу, если результата пока нет.
