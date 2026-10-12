---
prev: /guide/strings/tests.md
next: /guide/strings/best-practices.md
---

# Практика: нормализация и поиск названия

Название задачи — пользовательский ввод. Уберём лишние пробелы перед проверкой, выполним поиск без учёта регистра и разберём разницу между байтами и рунами.

## Задание 1. Нормализуйте название

Создайте функцию `normalizeTitle(title string) string`, которая удаляет пробелы по краям. Передайте ей строку `"  Купить продукты  "` и выведите результат в кавычках.

**Критерии проверки:**

- используется `strings.TrimSpace`;
- функция возвращает новую строку;
- результат равен `"Купить продукты"`;
- исходная строка не изменяется.

<details>
  <summary>Подсказка</summary>

```go
func normalizeTitle(title string) string {
	return strings.TrimSpace(title)
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import (
	"fmt"
	"strings"
)

func normalizeTitle(title string) string {
	return strings.TrimSpace(title)
}

func main() {
	title := "  Купить продукты  "

	fmt.Printf("%q\n", normalizeTitle(title))
}
```
</details>

## Задание 2. Проверьте слово в названии

Проверьте, содержит ли строка `Купить МОЛОКО` слово `молоко` без учёта регистра. Выведите результат типа `bool`.

**Критерии проверки:**

- используется `strings.Contains`;
- название и искомое слово приводятся к одному регистру;
- программа выводит `true`.

<details>
  <summary>Подсказка</summary>

```go
strings.Contains(strings.ToLower(title), strings.ToLower(query))
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	title := "Купить МОЛОКО"
	query := "молоко"

	found := strings.Contains(strings.ToLower(title), strings.ToLower(query))
	fmt.Println(found)
}
```
</details>

## Задание 3. Посчитайте символы названия

Для строки `"Купить молоко"` выведите количество байтов и количество рун. Используйте `len` и `utf8.RuneCountInString`.

**Критерии проверки:**

- импортирован `unicode/utf8`;
- байты получены через `len`;
- руны получены через `utf8.RuneCountInString`;
- результаты различаются из-за кириллицы.

<details>
  <summary>Подсказка</summary>

```go
fmt.Println("Байты:", len(title))
fmt.Println("Руны:", utf8.RuneCountInString(title))
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import (
	"fmt"
	"unicode/utf8"
)

func main() {
	title := "Купить молоко"

	fmt.Println("Байты:", len(title))
	fmt.Println("Руны:", utf8.RuneCountInString(title))
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- объяснить разницу между байтами и рунами;
- очистить пользовательский текст до валидации;
- выполнить поиск подстроки без учёта регистра;
- отличить количество байтов от количества рун.
