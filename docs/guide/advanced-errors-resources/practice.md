---
prev: /guide/advanced-errors-resources/tests.md
next: /guide/advanced-errors-resources/best-practices.md
---

# Задания: ошибки и управление ресурсами

Практика продолжает Task Manager API на уровне границ пакетов. Выполняйте задания по порядку: следующие используют типы и ошибки из предыдущих. Решения показывают один из вариантов; в production-коде зафиксируйте выбранные коды, статусы и правила в документации API.

## Задание 1. Ошибка валидации с данными

Создайте пакет `task` с ошибкой-маркером `ErrInvalidInput` и типом `ValidationError` с полями `Field` и `Rule`.

Напишите функцию:

```go
func ValidateCreateInput(title string, priority int) error
```

Правила:

- `title` после `strings.TrimSpace` не должен быть пустым — `Field: "title"`, `Rule: "required"`;
- `priority` должен быть от `1` до `5` — `Field: "priority"`, `Rule: "range"`;
- любая ошибка валидации должна быть доступна и через `errors.Is(err, ErrInvalidInput)`, и через `errors.As` к `*ValidationError`.

**Критерии проверки:**

- `ValidationError` реализует `error`;
- `Unwrap()` возвращает `ErrInvalidInput`;
- функция возвращает явный `nil`, когда оба поля корректны;
- нет сравнения текста ошибки;
- в ошибке не хранится весь пользовательский title: для этого правила достаточно поля и имени правила.

<details>
  <summary>Подсказка</summary>

```go
func (err *ValidationError) Unwrap() error {
	return ErrInvalidInput
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package task

import (
	"errors"
	"fmt"
	"strings"
)

var ErrInvalidInput = errors.New("некорректные входные данные")

type ValidationError struct {
	Field string
	Rule  string
}

func (err *ValidationError) Error() string {
	return fmt.Sprintf("поле %q не прошло правило %q", err.Field, err.Rule)
}

func (err *ValidationError) Unwrap() error {
	return ErrInvalidInput
}

func ValidateCreateInput(title string, priority int) error {
	if strings.TrimSpace(title) == "" {
		return &ValidationError{Field: "title", Rule: "required"}
	}
	if priority < 1 || priority > 5 {
		return &ValidationError{Field: "priority", Rule: "range"}
	}

	return nil
}
```
</details>

## Задание 2. Проверьте тип и общую причину

Напишите тест `TestValidateCreateInputEmptyTitle`. Он должен убедиться, что ошибка пустого title:

1. распознаётся через `errors.Is(err, ErrInvalidInput)`;
2. извлекается через `errors.As` в `*ValidationError`;
3. содержит `Field == "title"` и `Rule == "required"`.

**Критерии проверки:**

- тест не сравнивает `err.Error()`;
- `errors.As` получает указатель на переменную результата;
- тест завершается с понятным сообщением, если ошибка неожиданно равна `nil`;
- тест не зависит от порядка текста в `Error()`.

<details>
  <summary>Подсказка</summary>

```go
var validationErr *ValidationError
if !errors.As(err, &validationErr) {
	t.Fatal("ошибка не имеет тип ValidationError")
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package task

import (
	"errors"
	"testing"
)

func TestValidateCreateInputEmptyTitle(t *testing.T) {
	err := ValidateCreateInput("   ", 3)
	if err == nil {
		t.Fatal("ValidateCreateInput не вернул ошибку")
	}
	if !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("errors.Is(err, ErrInvalidInput) = false, err = %v", err)
	}

	var validationErr *ValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("errors.As не нашёл ValidationError, err = %v", err)
	}
	if validationErr.Field != "title" {
		t.Fatalf("Field = %q, want title", validationErr.Field)
	}
	if validationErr.Rule != "required" {
		t.Fatalf("Rule = %q, want required", validationErr.Rule)
	}
}
```
</details>

## Задание 3. Безопасная запись отчёта

Напишите `WriteReport(path, report string) error`, которая записывает отчёт в файл через `os.Create` и `io.WriteString`.

Если `Close` тоже вернул ошибку, она не должна потеряться: объедините её с возможной ошибкой записи через `errors.Join`. Используйте именованный результат и отложенную функцию.

**Критерии проверки:**

- `defer` ставится только после успешного `os.Create`;
- при записи и закрытии файл освобождается на любом пути;
- ошибка записи получает контекст `записать отчёт`;
- ошибка закрытия получает контекст `закрыть отчёт`;
- успешная операция возвращает `nil`.

<details>
  <summary>Подсказка</summary>

В `defer` можно присвоить именованному `err` новое значение:

```go
err = errors.Join(err, fmt.Errorf("закрыть отчёт: %w", closeErr))
```
</details>

<details>
  <summary>Решение</summary>

```go
package report

import (
	"errors"
	"fmt"
	"io"
	"os"
)

func WriteReport(path, report string) (err error) {
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("создать отчёт: %w", err)
	}

	defer func() {
		if closeErr := file.Close(); closeErr != nil {
			err = errors.Join(err, fmt.Errorf("закрыть отчёт: %w", closeErr))
		}
	}()

	if _, err := io.WriteString(file, report); err != nil {
		return fmt.Errorf("записать отчёт: %w", err)
	}

	return nil
}
```
</details>

## Задание 4. Переведите доменную ошибку в HTTP-контракт

Для Gin API напишите функцию `classifyError`, которая преобразует:

- `task.ErrTaskNotFound` в `404` и код `task_not_found`;
- `*task.ValidationError` в `422` и код `validation_failed`, добавляя поле и правило в `fields`;
- всё остальное в `500` и код `internal_error`.

Не передавайте `err.Error()` в ответ для `500`. Напишите unit-тест хотя бы для обёрнутого `ErrTaskNotFound`.

**Критерии проверки:**

- используется `errors.Is` для ошибки-маркера;
- используется `errors.As` для `ValidationError`;
- функция не зависит от Gin, поэтому тестируется без `httptest`;
- код и сообщение `500` не содержат внутренних деталей;
- обёрнутая ошибка задачи тоже даёт `404`.

<details>
  <summary>Подсказка</summary>

```go
if errors.Is(err, task.ErrTaskNotFound) {
	return http.StatusNotFound, errorResponse{...}
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package api

import (
	"errors"
	"net/http"

	"example.com/task-manager/internal/task"
)

type errorResponse struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
}

func classifyError(err error) (int, errorResponse) {
	var validationErr *task.ValidationError

	switch {
	case errors.As(err, &validationErr):
		return http.StatusUnprocessableEntity, errorResponse{
			Code:    "validation_failed",
			Message: "Проверьте входные данные",
			Fields: map[string]string{
				validationErr.Field: validationErr.Rule,
			},
		}
	case errors.Is(err, task.ErrTaskNotFound):
		return http.StatusNotFound, errorResponse{
			Code:    "task_not_found",
			Message: "Задача не найдена",
		}
	default:
		return http.StatusInternalServerError, errorResponse{
			Code:    "internal_error",
			Message: "Внутренняя ошибка сервера",
		}
	}
}
```

```go
func TestClassifyErrorTaskNotFound(t *testing.T) {
	status, response := classifyError(fmt.Errorf("завершить задачу: %w", task.ErrTaskNotFound))

	if status != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", status, http.StatusNotFound)
	}
	if response.Code != "task_not_found" {
		t.Fatalf("Code = %q, want task_not_found", response.Code)
	}
}
```

Во втором фрагменте нужны импорты `fmt`, `net/http`, `testing` и пакет `task`.
</details>

## Задание 5. Изолируйте callback с `recover`

Напишите функцию:

```go
func RunCallback(callback func() error) (err error)
```

Если callback вызывает panic, функция должна вернуть `*PanicError` с полем `Value any`. Если callback обычным образом вернул ошибку, она должна остаться исходной. Добавьте тест для обоих сценариев.

**Критерии проверки:**

- `recover` находится в отложенной функции внутри `RunCallback`;
- обычная `error` не заменяется `PanicError`;
- panic распознаётся через `errors.As`;
- `PanicError.Value` не отправляется клиенту или в незащищённый лог;
- функция документирована как граница изоляции callback, а не применяется ко всему прикладному коду.

<details>
  <summary>Подсказка</summary>

Именованный результат позволяет установить `err` внутри `defer`:

```go
defer func() {
	if recovered := recover(); recovered != nil {
		err = &PanicError{Value: recovered}
	}
}()
```
</details>

<details>
  <summary>Решение</summary>

```go
package callback

import "errors"

type PanicError struct {
	Value any
}

func (err *PanicError) Error() string {
	return "callback завершился panic"
}

// RunCallback изолирует panic кода, переданного вызывающим пакетом.
func RunCallback(callback func() error) (err error) {
	defer func() {
		if recovered := recover(); recovered != nil {
			err = &PanicError{Value: recovered}
		}
	}()

	return callback()
}

func IsPanic(err error) bool {
	var panicErr *PanicError
	return errors.As(err, &panicErr)
}
```
</details>

## Проверьте себя

Перед переходом к следующей продвинутой главе убедитесь, что вы можете:

- выбрать между ошибкой-маркером, собственным типом ошибки и `errors.Join`;
- объяснить, какую зависимость раскрывает `%w`;
- получить данные ошибки через `errors.As` без разбора текста;
- определить владельца файла, `rows`, response body, transaction, lock и `cancel`;
- не разместить `defer` в длинном цикле без отдельной области видимости;
- отличить recovery boundary от попытки скрыть дефект;
- вернуть наружу безопасный HTTP-контракт и оставить внутренние детали только в защищённой диагностике.

## Полный исходный код

Здесь будет размещён полный исходный код к практическим заданиям этой главы.

<ExampleSource
  path="examples/36/advanced-errors-resources"
  description="заготовка для полного исходного кода практических заданий главы"
/>
