---
prev: /guide/channels/tests.md
next: /guide/channels/best-practices.md
---

# Задания: результаты экспортов через канал

В прошлой главе `WaitGroup` только ожидал завершения экспортов. Теперь каждая goroutine передаёт в `main` собственный результат через канал.

## Задание 1. Передайте одно сообщение

Создайте `chan string`. Запустите goroutine, которая отправит в него `Экспорт готов`. В `main` получите и выведите сообщение.

**Критерии проверки:**

- канал создан через `make(chan string)`;
- отправка находится внутри goroutine;
- `main` получает строку через `<-`;
- программа завершается без `time.Sleep`.

<details>
  <summary>Подсказка</summary>

```go
messages := make(chan string)

go func() {
	messages <- "Экспорт готов"
}()
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	messages := make(chan string)

	go func() {
		messages <- "Экспорт готов"
	}()

	fmt.Println(<-messages)
}
```
</details>

## Задание 2. Передайте два статуса

Создайте буферизированный канал строк на два значения. В двух goroutine отправьте статусы текстового и JSON-экспортов. Получите и выведите оба статуса.

**Критерии проверки:**

- используется `make(chan string, 2)`;
- запущены две goroutine;
- каждая отправляет один статус;
- получены два значения;
- код не предполагает фиксированный порядок первых двух строк.

<details>
  <summary>Подсказка</summary>

Получите сообщения дважды:

```go
fmt.Println(<-statuses)
fmt.Println(<-statuses)
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	statuses := make(chan string, 2)

	go func() {
		statuses <- "Текстовый экспорт готов"
	}()

	go func() {
		statuses <- "JSON-экспорт готов"
	}()

	fmt.Println(<-statuses)
	fmt.Println(<-statuses)
}
```
</details>

## Задание 3. Верните результаты экспортов

Создайте тип:

```go
type exportResult struct {
	Name string
	Err  error
}
```

Напишите функцию:

```go
func startExports(tasks []task.Task, textPath, jsonPath string) <-chan exportResult
```

Она запускает текстовый и JSON-экспорт в отдельных goroutine, возвращает канал с результатами и закрывает его после завершения обоих worker.

**Критерии проверки:**

- возвращаемый тип — `<-chan exportResult`;
- внутри создан `make(chan exportResult, 2)`;
- каждая goroutine отправляет `Name` и ошибку своей операции;
- `WaitGroup` ожидает завершения обоих отправителей;
- отдельная goroutine закрывает results после `wg.Wait()`;
- обе операции получают одинаковый слайс задач только для чтения.

<details>
  <summary>Подсказка</summary>

```go
go func() {
	wg.Wait()
	close(results)
}()
```
</details>

<details>
  <summary>Решение</summary>

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
</details>

## Задание 4. Обработайте оба результата

В `main` создайте две задачи, вызовите `startExports` с путями из временной директории и прочитайте результаты через `range`. Для каждого успешного результата выведите `<название> готов`, для ошибки — `Ошибка <название>: <ошибка>`.

**Критерии проверки:**

- результаты получаются через `range` до закрытия канала;
- успех и ошибка обрабатываются отдельно;
- нет `time.Sleep`;
- `main` не предполагает порядок текстового и JSON-результата;
- при успешных операциях создаются `tasks.txt` и `tasks.json`.

<details>
  <summary>Подсказка</summary>

Канал закрывается координатором после завершения worker, поэтому можно читать его через `range`:

```go
for result := range results {
	// обработка
}
```
</details>

<details>
  <summary>Возможное решение</summary>

```go
results := startExports(tasks, textPath, jsonPath)

for result := range results {

	if result.Err != nil {
		fmt.Printf("Ошибка %s: %v\n", result.Name, result.Err)
		continue
	}

	fmt.Printf("%s готов\n", result.Name)
}
```

## Задание 5. Протестируйте результаты и закрытие

Напишите `TestStartExports`. Передайте пути из `t.TempDir`, прочитайте канал через `range`, проверьте, что получены два результата без ошибок, а оба файла существуют после завершения цикла.

**Критерии проверки:**

- тест не использует `time.Sleep`;
- `range` завершился, значит канал был закрыт;
- получено ровно два результата;
- каждый `exportResult.Err` равен `nil`;
- `tasks.txt` и `tasks.json` существуют в временной директории;
- тест запускается с `go test -race ./...`.

<details>
  <summary>Подсказка</summary>

После цикла используйте `os.Stat`:

```go
if _, err := os.Stat(textPath); err != nil {
	t.Errorf("текстовый экспорт не создан: %v", err)
}
```
</details>
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- создать канал нужного типа;
- отправить и получить значение через `<-`;
- объяснить блокировку небуферизированного канала;
- выбрать буфер для двух известных результатов;
- объяснить, кто и когда должен закрывать канал;
- закрыть канал после нескольких отправителей через `WaitGroup`;
- протестировать результаты и закрытие канала без `time.Sleep`;
- вернуть канал только для чтения из функции.
