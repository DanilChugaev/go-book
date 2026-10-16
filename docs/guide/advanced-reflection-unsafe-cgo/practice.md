---
prev: /guide/advanced-reflection-unsafe-cgo/tests.md
next: /guide/advanced-reflection-unsafe-cgo/best-practices.md
---

# Задания: reflection, `unsafe` и cgo

Цель практики — научиться строить узкие безопасные границы и так же уверенно отказываться от low-level решения. Не внедряйте эти фрагменты напрямую в production Task Manager API: создайте изолированный учебный пакет, например `internal/metadata` или `internal/native`.

Перед и после изменения запускайте:

```bash
go test ./...
go vet ./...
go test -race ./...
```

Для cgo выполняйте задания, только если на вашей системе установлен C compiler. Отсутствие cgo toolchain — не ошибка Go-кода и не повод отключать его глобально в основном проекте.

## Задание 1. Безопасная инспекция JSON metadata

Напишите функцию:

```go
func JSONFields(value any) ([]string, error)
```

Она принимает struct или non-nil pointer на struct и возвращает имена экспортируемых полей в JSON-представлении. Учитывайте `json:"name"`, пропускайте `json:"-"`; для поля без тега используйте Go-имя. Функция не должна паниковать на `nil`, typed nil pointer, число или слайс.

**Критерии проверки:**

- `reflect.TypeOf(nil)` обрабатывается до вызовов, требующих type;
- pointer разворачивается через `Elem`, но typed nil pointer отклоняется;
- non-struct возвращает обычный `error`;
- private поля не попадают в ответ;
- `StructTag.Lookup` либо обоснованно `Get` корректно обрабатывает теги;
- тесты покрывают DTO с `json:"-"`, tag options (`json:"title,omitempty"`) и невалидный input.

<details>
  <summary>Подсказка</summary>

```go
if typ.Kind() == reflect.Ptr {
	typ = typ.Elem()
}
if typ.Kind() != reflect.Struct {
	return nil, errors.New("ожидалась структура")
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package metadata

import (
	"errors"
	"reflect"
	"strings"
)

func JSONFields(value any) ([]string, error) {
	if value == nil {
		return nil, errors.New("значение не должно быть nil")
	}

	reflected := reflect.ValueOf(value)
	typ := reflected.Type()
	if typ.Kind() == reflect.Ptr {
		if reflected.IsNil() {
			return nil, errors.New("указатель не должен быть nil")
		}
		typ = typ.Elem()
	}
	if typ.Kind() != reflect.Struct {
		return nil, errors.New("ожидалась структура или указатель на структуру")
	}

	fields := make([]string, 0, typ.NumField())
	for index := 0; index < typ.NumField(); index++ {
		field := typ.Field(index)
		if field.PkgPath != "" {
			continue
		}

		tag, exists := field.Tag.Lookup("json")
		if exists && tag == "-" {
			continue
		}
		name, _, _ := strings.Cut(tag, ",")
		if name == "" {
			name = field.Name
		}
		fields = append(fields, name)
	}

	return fields, nil
}
```

Этот helper не повторяет все правила `encoding/json`: embedded fields, conflicts, custom marshalers и другие случаи требуют отдельного контракта. Не используйте его как замену JSON encoder.
</details>

## Задание 2. Reflection setter с явным контрактом

Напишите:

```go
func SetExportedString(target any, fieldName, value string) error
```

Функция меняет только экспортируемое строковое поле у non-nil pointer на struct. Для отсутствующего поля, private поля, поля другого типа, неуказателя и typed nil верните error без panic.

**Критерии проверки:**

- проверяются `IsValid`, `Kind`, `IsNil` и `CanSet` до `SetString`;
- helper не использует `unsafe` для private field;
- в unit-тесте успешный вызов меняет исходную структуру;
- ошибки проверяются для `Task{}` вместо `&Task{}`, поля `Priority`, несуществующего и private поля;
- README/комментарий объясняет, почему Task Manager не использует функцию для обычного обновления title.

<details>
  <summary>Подсказка</summary>

```go
field := value.Elem().FieldByName(fieldName)
if !field.IsValid() || field.Kind() != reflect.String || !field.CanSet() {
	return errors.New("поле недоступно для изменения")
}
```
</details>

<details>
  <summary>Решение</summary>

```go
func SetExportedString(target any, fieldName, newValue string) error {
	value := reflect.ValueOf(target)
	if !value.IsValid() || value.Kind() != reflect.Ptr || value.IsNil() {
		return errors.New("target должен быть non-nil указателем на структуру")
	}

	value = value.Elem()
	if value.Kind() != reflect.Struct {
		return errors.New("target должен указывать на структуру")
	}

	field := value.FieldByName(fieldName)
	if !field.IsValid() || field.Kind() != reflect.String || !field.CanSet() {
		return fmt.Errorf("поле %q недоступно для изменения", fieldName)
	}

	field.SetString(newValue)
	return nil
}
```

Для решения нужны импорты `errors`, `fmt` и `reflect`. В прикладном коде предпочтительнее `task.Title = newValue`: его контракт проверяется компилятором.
</details>

## Задание 3. Бинарный формат без `unsafe`

Нужно передать заголовок протокола: `version uint16`, `flags uint8`, `length uint32` в network byte order. Напишите `EncodeHeader` и `DecodeHeader` через `encoding/binary`, без преобразования Go struct к `[]byte` через `unsafe`.

**Критерии проверки:**

- wire format всегда ровно 7 байт;
- используется `binary.BigEndian`;
- `DecodeHeader` проверяет длину до slice expressions;
- round-trip test подтверждает все три поля;
- test с коротким input возвращает error, а не panic;
- комментарий объясняет, почему `unsafe.Sizeof(Header{})` не определяет network format.

<details>
  <summary>Подсказка</summary>

```go
data := make([]byte, 7)
binary.BigEndian.PutUint16(data[0:2], version)
data[2] = flags
binary.BigEndian.PutUint32(data[3:7], length)
```
</details>

<details>
  <summary>Решение</summary>

```go
package protocol

import (
	"encoding/binary"
	"errors"
)

const headerSize = 7

type Header struct {
	Version uint16
	Flags   uint8
	Length  uint32
}

func EncodeHeader(header Header) []byte {
	data := make([]byte, headerSize)
	binary.BigEndian.PutUint16(data[0:2], header.Version)
	data[2] = header.Flags
	binary.BigEndian.PutUint32(data[3:7], header.Length)
	return data
}

func DecodeHeader(data []byte) (Header, error) {
	if len(data) < headerSize {
		return Header{}, errors.New("недостаточно байтов для заголовка")
	}

	return Header{
		Version: binary.BigEndian.Uint16(data[0:2]),
		Flags:   data[2],
		Length:  binary.BigEndian.Uint32(data[3:7]),
	}, nil
}
```

`unsafe.Sizeof(Header{})` зависит от padding и выравнивания на архитектуре; network protocol должен задаваться явно, поэтому wire format здесь фиксирован константой `headerSize`.
</details>

## Задание 4. Проверьте low-level пакет

Создайте небольшой изолированный пакет с одним допустимым применением `unsafe.Sizeof` или `unsafe.Offsetof` для диагностического теста layout. Добавьте комментарий о target architecture и о том, что значение не используется как внешний формат. Запустите:

```bash
go vet ./...
go test -gcflags=all=-d=checkptr=2 ./internal/lowlevel
go test -race ./internal/lowlevel
```

**Критерии проверки:**

- пакет не содержит преобразование `uintptr` с хранением адреса для будущего использования;
- нет доступа к private полям другого пакета;
- нет zero-copy `string`/`[]byte` helper без задокументированного ownership;
- тесты проходят с `checkptr` и race detector;
- проверка layout не заявляет portability без фактических target OS/arch тестов;
- в review описано, почему обычный Go-код не решал именно эту узкую задачу.

<details>
  <summary>Направление решения</summary>

В большинстве прикладных проектов верный ответ — не создавать такой пакет вовсе. Упражнение нужно, чтобы отличать относительно безопасную compile-time диагностику layout от указательной арифметики и обхода GC. Если нет конкретной платформенной интеграции, зафиксируйте в отчёте отказ от `unsafe`.
</details>

## Задание 5. Тонкая cgo-обёртка или обоснованный отказ

Если есть C compiler, реализуйте `CLength(value string) int` из теории в изолированном package `internal/native`. Добавьте тесты для пустой строки и UTF-8 текста. Запустите integration-команду:

```bash
CGO_ENABLED=1 go test ./internal/native
```

Если C compiler нет или у проекта нет реальной native-зависимости, вместо кода подготовьте design note с отказом от cgo: укажите, что `len(value)` решает учебный пример без native toolchain, C heap ownership и platform-specific сборки.

**Критерии проверки для cgo-варианта:**

- C preamble находится непосредственно перед `import "C"`;
- `C.CString` освобождается через `C.free` на каждом пути;
- Go API возвращает `int`, а не `*C.char` или другой `C.*` тип;
- вызов изолирован от domain/service/handler пакетов;
- README описывает нужный compiler, target OS/arch и команду CI/Docker build;
- тесты не предполагают, что каждый символ UTF-8 занимает один byte: C `strlen` и Go `len` считают байты.

<details>
  <summary>Решение</summary>

```go
package native

/*
#include <stdlib.h>
#include <string.h>
*/
import "C"

import "unsafe"

func CLength(value string) int {
	cValue := C.CString(value)
	defer C.free(unsafe.Pointer(cValue))

	return int(C.strlen(cValue))
}
```

```go
func TestCLength(t *testing.T) {
	for _, value := range []string{"", "Go", "Привет"} {
		if got, want := CLength(value), len(value); got != want {
			t.Fatalf("CLength(%q) = %d, want %d", value, got, want)
		}
	}
}
```

Этот пример демонстрационный. В production `len(value)` всегда предпочтительнее: cgo не даёт здесь ни функции, ни performance-выгоды.
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- выбрать явный код, интерфейс, generic-функцию или generation вместо runtime reflection, когда тип известен;
- проверить `Kind`, `IsValid`, `IsNil` и `CanSet` до потенциально опасных reflection-операций;
- объяснить, почему tags — metadata, а не бесплатная реализация JSON/ORM/validation;
- не использовать `unsafe` для network format, private fields или сомнительного zero-copy;
- объяснить разницу Go heap и C heap и ownership C allocation;
- изолировать cgo boundary и обосновать native-зависимость в CI/Docker/production;
- признать отказ от reflection, `unsafe` или cgo корректным инженерным решением.
