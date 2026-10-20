---
prev: /guide/testing/tests.md
next: /guide/testing/best-practices.md
---

# Задания: тесты Task и Store

В этой практике напишем первые unit-тесты для модели задачи и простого Store. Все тесты запускайте из корня модуля командой `go test ./...`.

## Задание 1. Тест Rename

В `internal/task/task_test.go` напишите `TestTaskRename`. Проверьте, что корректное название меняет `Title`, а метод возвращает `nil`.

**Критерии проверки:**

- тест находится в файле с суффиксом `_test.go`;
- функция называется `TestTaskRename`;
- задача создаётся внутри теста;
- проверяется отсутствие ошибки;
- проверяется новое значение `Title`.

<details>
  <summary>Подсказка</summary>

```go
if err := currentTask.Rename("Купить продукты"); err != nil {
	t.Fatalf("Rename вернул ошибку: %v", err)
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package task

import "testing"

func TestTaskRename(t *testing.T) {
	currentTask := Task{ID: 1, Title: "Купить молоко", Priority: 2}

	if err := currentTask.Rename("Купить продукты"); err != nil {
		t.Fatalf("Rename вернул ошибку: %v", err)
	}

	if currentTask.Title != "Купить продукты" {
		t.Errorf("Title = %q, ожидалось %q", currentTask.Title, "Купить продукты")
	}
}
```
</details>

## Задание 2. Table-driven test для Rename

Расширьте тест Rename таблицей сценариев:

- корректное название;
- пустая строка;
- строка только из пробелов;
- слишком длинное название.

Для ошибочных случаев проверьте, что исходное название не меняется и возвращается нужная ошибка.

**Критерии проверки:**

- используется слайс test cases;
- каждый сценарий запускается через `t.Run`;
- известная ошибка проверяется через `errors.Is`;
- состояние задачи создаётся заново в каждом subtest;
- неуспешное переименование не меняет `Title`.

<details>
  <summary>Подсказка</summary>

Добавьте в структуру test case поля `name`, `title`, `wantTitle` и `wantErr`.
</details>

<details>
  <summary>Фрагмент решения</summary>

```go
for _, testCase := range testCases {
	t.Run(testCase.name, func(t *testing.T) {
		currentTask := Task{ID: 1, Title: "Купить молоко", Priority: 2}

		err := currentTask.Rename(testCase.title)
		if !errors.Is(err, testCase.wantErr) {
			t.Fatalf("Rename error = %v, ожидалось %v", err, testCase.wantErr)
		}

		if currentTask.Title != testCase.wantTitle {
			t.Errorf("Title = %q, ожидалось %q", currentTask.Title, testCase.wantTitle)
		}
	})
}
```
</details>

## Задание 3. Тест IsValid

Напишите table-driven test для `Task.IsValid()`. Проверьте корректную задачу, нулевой ID, пустое название и приоритет вне диапазона.

**Критерии проверки:**

- тест содержит минимум четыре сценария;
- каждый сценарий создаёт свой `Task`;
- ожидаемый результат имеет тип `bool`;
- сообщение теста показывает фактическое и ожидаемое значения.

<details>
  <summary>Подсказка</summary>

```go
if got := currentTask.IsValid(); got != testCase.want {
	t.Errorf("IsValid() = %t, ожидалось %t", got, testCase.want)
}
```
</details>

## Задание 4. Тесты Store

Создайте пакет `internal/store` с простым `Store` из главы. Напишите тесты для:

- успешного `Add` и `Get`;
- повторного добавления того же ID;
- отсутствующей задачи;
- `Rename` и `Complete`.

**Критерии проверки:**

- Store создаётся заново в каждом тесте или subtest;
- повторный ID проверяется через `errors.Is(err, ErrTaskAlreadyExists)`;
- отсутствующая задача проверяется через `exists == false` или `ErrTaskNotFound`;
- Rename и Complete проверяют итоговую задачу через `Get`;
- все тесты проходят через `go test ./...`.

<details>
  <summary>Подсказка</summary>

Для начала напишите небольшой тест добавления и получения:

```go
store := New()
wantTask := task.Task{ID: 1, Title: "Купить молоко", Priority: 2}

if err := store.Add(wantTask); err != nil {
	t.Fatalf("Add вернул ошибку: %v", err)
}
```
</details>

<details>
  <summary>Решение для Add и Get</summary>

```go
func TestStoreAddAndGet(t *testing.T) {
	store := New()
	wantTask := task.Task{ID: 1, Title: "Купить молоко", Priority: 2}

	if err := store.Add(wantTask); err != nil {
		t.Fatalf("Add вернул ошибку: %v", err)
	}

	gotTask, exists := store.Get(1)
	if !exists {
		t.Fatal("задача не найдена после Add")
	}

	if gotTask != wantTask {
		t.Errorf("Get = %+v, ожидалось %+v", gotTask, wantTask)
	}
}
```
</details>

## Команды проверки

После выполнения заданий запустите:

```bash
go test ./...
go test -cover ./...
```

Позже, после перехода на потокобезопасный `TaskStore`, добавьте:

```bash
go test -race ./...
```

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- создать файл `_test.go`;
- написать `Test...` с `*testing.T`;
- выбрать между `t.Error` и `t.Fatal`;
- оформить набор сценариев таблицей и `t.Run`;
- проверить ошибку через `errors.Is`;
- создать независимое состояние для каждого теста;
- запустить весь набор тестов и посмотреть покрытие.

## Полный исходный код

Здесь будет размещён полный исходный код к практическим заданиям этой главы.

<ExampleSource
  path="examples/17/testing"
  description="заготовка для полного исходного кода практических заданий главы"
/>
