---
prev: /guide/time/practice.md
next: /guide/goroutines/tests.md
---

# Goroutine

## Цель урока

Научиться запускать независимую работу параллельно через `go`, ждать её завершения с `sync.WaitGroup`, тестировать фоновых работников без `time.Sleep` и понимать, почему порядок выполнения goroutine нельзя считать предсказуемым.

В Task Manager API goroutine пригодятся для независимых операций: например, можно одновременно подготовить текстовый экспорт и JSON-файл задач. Каналы появятся в следующей главе; пока для ожидания завершения достаточно `WaitGroup`.

## Что такое goroutine

Goroutine — лёгкая функция, которую Go runtime запускает конкурентно с остальным кодом. Чтобы запустить вызов в новой goroutine, поставьте перед ним `go`:

```go
go printTask("Купить молоко")
```

Для сравнения:

```go
printTask("Купить молоко")    // обычный последовательный вызов
go printTask("Оплатить интернет") // конкурентный запуск
```

Goroutine не означает, что работа обязательно будет выполняться на другом ядре процессора. Главное для начала: несколько задач могут продвигаться независимо, а Go runtime распределяет их выполнение.

## Порядок выполнения не определён

Рассмотрим пример:

```go
package main

import "fmt"

func printMessage(message string) {
	fmt.Println(message)
}

func main() {
	go printMessage("Первая goroutine")
	go printMessage("Вторая goroutine")

	fmt.Println("main завершает работу")
}
```

Программа может вывести строки в разном порядке или не вывести сообщения goroutine вовсе: когда `main` завершается, завершается вся программа вместе с незавершёнными goroutine.

::: warning Не используйте time.Sleep для синхронизации
`time.Sleep` иногда используют в короткой демонстрации, чтобы «дать goroutine время». Это ненадёжно: на медленном компьютере времени может не хватить, а на быстром программа просто будет ждать зря. Используйте синхронизацию — в этой главе `sync.WaitGroup`.
:::

## Ожидание через `sync.WaitGroup`

`sync.WaitGroup` хранит число незавершённых работ:

- `Add(n)` увеличивает число ожидаемых goroutine на `n`;
- `Done()` уменьшает его на единицу;
- `Wait()` блокирует текущую goroutine, пока счётчик не станет равен нулю.

```go
package main

import (
	"fmt"
	"sync"
)

func printTask(task string, wg *sync.WaitGroup) {
	defer wg.Done()
	fmt.Println(task)
}

func main() {
	var wg sync.WaitGroup

	wg.Add(2)
	go printTask("Купить молоко", &wg)
	go printTask("Оплатить интернет", &wg)

	wg.Wait()
	fmt.Println("Все задачи обработаны")
}
```

`defer wg.Done()` ставят в начало goroutine: это гарантирует уменьшение счётчика при любом обычном выходе из функции, включая ранний `return`.

## Правила работы с WaitGroup

### Вызывайте `Add` до запуска goroutine

Правильно:

```go
wg.Add(1)
go work(&wg)
```

Неправильно:

```go
go work(&wg)
wg.Add(1)
```

Во втором варианте goroutine может вызвать `Done` раньше `Add`, а программа завершится с panic.

### Один `Add` — один `Done`

Если добавили две работы, каждая должна вызвать `Done` ровно один раз:

```go
wg.Add(2)
go first(&wg)  // first вызывает Done
go second(&wg) // second вызывает Done
wg.Wait()
```

Забытый `Done` приведёт к вечному ожиданию в `Wait`. Лишний `Done` приведёт к panic из-за отрицательного счётчика.

### Передавайте WaitGroup указателем

`sync.WaitGroup` нельзя копировать после первого использования. Передавайте `*sync.WaitGroup`:

```go
func work(wg *sync.WaitGroup) {
	defer wg.Done()
}
```

## Анонимная goroutine

Для короткой работы можно использовать анонимную функцию:

```go
var wg sync.WaitGroup

wg.Add(1)
go func() {
	defer wg.Done()
	fmt.Println("Экспорт подготовлен")
}()

wg.Wait()
```

Круглые скобки `()` после закрывающей фигурной скобки немедленно вызывают анонимную функцию. Без них вы только объявили бы функцию, но не запустили её.

## Goroutine в цикле

Чтобы запустить работу для каждого значения, передавайте значение параметром в анонимную функцию:

```go
tasks := []string{"Купить молоко", "Оплатить интернет"}

var wg sync.WaitGroup

for _, title := range tasks {
	wg.Add(1)

	go func(currentTitle string) {
		defer wg.Done()
		fmt.Println("Обработка:", currentTitle)
	}(title)
}

wg.Wait()
```

Явный параметр `currentTitle` фиксирует значение для конкретного запуска и делает намерение кода очевидным. В современных версиях Go переменная каждой итерации `range` создаётся заново, но передача параметра остаётся понятным и безопасным стилем, особенно при более сложной логике.

## Независимый параллельный экспорт

Текстовый и JSON-экспорт используют один и тот же неизменяемый список задач, но записывают разные файлы. Это хороший первый случай для goroutine: операции независимы.

```go
func saveExports(tasks []task.Task, textPath, jsonPath string) (error, error) {
	var wg sync.WaitGroup
	var textErr error
	var jsonErr error

	wg.Add(2)

	go func() {
		defer wg.Done()
		textErr = exportText(textPath, tasks)
	}()

	go func() {
		defer wg.Done()
		jsonErr = storage.SaveTasks(jsonPath, tasks)
	}()

	wg.Wait()
	return textErr, jsonErr
}
```

Каждая goroutine записывает только свою переменную ошибки, а вызывающий код читает результаты только после `wg.Wait()`. Пути передаются параметрами: это позволяет не создавать файлы в рабочей папке при тестировании.

Использование:

```go
textErr, jsonErr := saveExports(tasks, "tasks.txt", "tasks.json")

if textErr != nil {
	fmt.Println("Ошибка текстового экспорта:", textErr)
}
if jsonErr != nil {
	fmt.Println("Ошибка JSON-экспорта:", jsonErr)
}
```

## Тестирование goroutine без `time.Sleep`

Тест не должен ждать «достаточно долго» в надежде, что работники уже завершились. Вместо этого он должен получить явный сигнал завершения. Для проверки параллельного экспорта удобно использовать временную директорию и канал результатов.

Каналы подробно появятся в следующей главе. Здесь достаточно использовать один буферизированный канал как тестовый контракт: каждый worker отправляет результат, а отдельная goroutine закрывает канал после `wg.Wait()`.

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
		result := exportResult{
			Name: "text",
			Err:  exportText(textPath, tasks),
		}
		results <- result
	}()

	go func() {
		defer wg.Done()
		result := exportResult{
			Name: "json",
			Err:  storage.SaveTasks(jsonPath, tasks),
		}
		results <- result
	}()

	go func() {
		wg.Wait()
		close(results)
	}()

	return results
}
```

Тест читает канал до закрытия. Это означает, что оба worker завершились, и никаких искусственных пауз не нужно:

```go
func TestStartExports(t *testing.T) {
	directory := t.TempDir()
	tasks := []task.Task{{ID: 1, Title: "Купить молоко", Priority: 2}}

	results := startExports(
		tasks,
		filepath.Join(directory, "tasks.txt"),
		filepath.Join(directory, "tasks.json"),
	)

	for result := range results {
		if result.Err != nil {
			t.Errorf("%s export returned error: %v", result.Name, result.Err)
		}
	}
}
```

В следующей главе разберём, почему отправка и получение через канал работают именно так, как закрывать канал при нескольких отправителях и как выражать направление канала в API.

## Что пока не делать

Не запускайте goroutine просто «для ускорения». Конкурентный код становится сложнее: появляются гонки данных, ошибки синхронизации, утечки goroutine и неопределённый порядок.

Пока избегайте общего изменяемого состояния:

```go
// Плохой пример: несколько goroutine меняют одну переменную.
// total++
```

Без синхронизации это создаёт гонку данных. `Mutex`, атомарные операции и `go test -race` разберём позже, после каналов и контекста.

## Частые ошибки

### `main` завершилась раньше goroutine

```go
go exportText("tasks.txt", tasks)
fmt.Println("Готово")
```

Сообщение «Готово» не означает, что экспорт действительно завершился. Используйте `WaitGroup`.

### Забытый `Done`

```go
func export(wg *sync.WaitGroup) {
	// wg.Done() забыли
}
```

`wg.Wait()` будет ждать бесконечно. Добавляйте `defer wg.Done()` первой строкой тела goroutine.

### Копирование WaitGroup

```go
func export(wg sync.WaitGroup) {
	defer wg.Done()
}
```

Так функция получает копию счётчика, а исходный `WaitGroup` не изменяется. Передавайте `*sync.WaitGroup`.

### Ожидание фиксированное время

```go
go exportText("tasks.txt", tasks)
time.Sleep(time.Second)
```

Время не доказывает завершение работы. Синхронизация должна отражать событие завершения, а не предположение о скорости компьютера.

### Тест без ожидания завершения

```go
go saveExports(tasks, textPath, jsonPath)
// Сразу проверяется файл: worker мог ещё не успеть его создать.
```

В тесте дождитесь `WaitGroup` или прочитайте все результаты из канала, который закрывается после завершения worker.

## Дальше

Закрепите параллельный экспорт задач. Затем перейдём к каналам: они позволят goroutine обмениваться результатами и сигналами без ручных переменных ошибок.
