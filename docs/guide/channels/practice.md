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
func saveExports(tasks []task.Task) <-chan exportResult
```

Она запускает `exportText` и `exportJSON` в отдельных goroutine и возвращает канал с двумя результатами.

**Критерии проверки:**

- возвращаемый тип — `<-chan exportResult`;
- внутри создан `make(chan exportResult, 2)`;
- каждая goroutine отправляет `Name` и ошибку своей операции;
- функция не использует `WaitGroup`;
- обе операции получают одинаковый слайс задач только для чтения.

<details>
  <summary>Подсказка</summary>

```go
go func() {
	err := exportText("tasks.txt", tasks)
	results <- exportResult{Name: "текстовый экспорт", Err: err}
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

func saveExports(tasks []task.Task) <-chan exportResult {
	results := make(chan exportResult, 2)

	go func() {
		err := exportText("tasks.txt", tasks)
		results <- exportResult{Name: "текстовый экспорт", Err: err}
	}()

	go func() {
		err := exportJSON("tasks.json", tasks)
		results <- exportResult{Name: "JSON-экспорт", Err: err}
	}()

	return results
}
```
</details>

## Задание 4. Обработайте оба результата

В `main` создайте две задачи, вызовите `saveExports` и получите два результата. Для каждого успешного результата выведите `<название> готов`, для ошибки — `Ошибка <название>: <ошибка>`.

**Критерии проверки:**

- результаты получают из канала ровно два раза;
- успех и ошибка обрабатываются отдельно;
- нет `time.Sleep`;
- `main` не предполагает порядок текстового и JSON-результата;
- при успешных операциях создаются `tasks.txt` и `tasks.json`.

<details>
  <summary>Подсказка</summary>

В Go 1.22+ удобно получить известное число результатов так:

```go
for range 2 {
	result := <-results
	// обработка
}
```
</details>

<details>
  <summary>Возможное решение</summary>

```go
results := saveExports(tasks)

for range 2 {
	result := <-results

	if result.Err != nil {
		fmt.Printf("Ошибка %s: %v\n", result.Name, result.Err)
		continue
	}

	fmt.Printf("%s готов\n", result.Name)
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- создать канал нужного типа;
- отправить и получить значение через `<-`;
- объяснить блокировку небуферизированного канала;
- выбрать буфер для двух известных результатов;
- объяснить, кто и когда должен закрывать канал;
- вернуть канал только для чтения из функции.
