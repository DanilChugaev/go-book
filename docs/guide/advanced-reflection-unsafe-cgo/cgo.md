---
prev: /guide/advanced-reflection-unsafe-cgo/unsafe.md
next: /guide/advanced-reflection-unsafe-cgo/tests.md
---

# cgo: вызов C-кода из Go

## Что делает cgo

cgo связывает Go-пакет с C compiler и C ABI. Файл с `import "C"` может содержать C preamble в комментарии непосредственно перед этим импортом:

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

`C.CString` выделяет null-terminated строку в C heap. Её освобождает C-функция `free`, а не Go garbage collector. Именно поэтому `defer C.free(...)` ставится сразу после успешного выделения.

Пример специально прост: в реальной программе `len(value)` быстрее, проще и не требует C compiler. Его цель — показать ownership на границе двух рантаймов, а не рекомендовать `strlen` через cgo.

## Почему cgo — не просто импорт

Обычный Go-код компилируется toolchain в один привычный workflow. cgo добавляет:

- установленный C compiler и headers на машине сборки;
- linker flags и native libraries на build/runtime machine;
- platform-specific ABI и различия Linux/macOS/Windows;
- отдельные правила lifetime для Go и C памяти;
- сложность cross-compilation, Docker images и CI;
- дополнительную security surface в C-коде и его зависимостях.

Перед `go get` wrapper-библиотеки проверьте, требует ли она cgo и какие system packages нужны. README приложения и Dockerfile должны воспроизводимо устанавливать эти зависимости.

## Владение памятью: Go heap и C heap

Есть два разных владельца:

| Память | Кто выделяет | Кто освобождает |
| --- | --- | --- |
| Go value / `make` / `new` | Go runtime | garbage collector, когда объект недостижим |
| `C.CString`, `C.malloc` | C runtime | соответствующий `C.free` |
| C buffer из library | C library | функция освобождения из этой library |

Нельзя освобождать Go-память через `C.free` и нельзя ждать, что Go GC освободит результат `C.malloc`. Всегда читайте C API: иногда библиотека требует `library_free`, а не стандартный `free`.

Если C возвращает `char*`, преобразуйте его и вызовите правильный cleanup:

```go
func readLibraryMessage() (string, error) {
	message := C.library_message()
	if message == nil {
		return "", errors.New("library_message вернул nil")
	}
	defer C.library_free(message)

	return C.GoString(message), nil
}
```

`C.GoString` копирует данные в Go string. Не возвращайте `*C.char` выше Go-обёртки: это распространяет C ownership в service/handler и почти гарантирует утечки.

## Правила указателей Go ↔ C

Главное упрощённое правило: **C не должен хранить Go pointer после завершения cgo-вызова**. Go GC не управляет C heap, а C runtime не знает lifetime Go объектов. Передача pointer в C также ограничена, если Go-объект содержит другие Go pointers.

Плохая модель:

```text
Go создаёт Task → C сохраняет указатель → Go возвращается из вызова
→ GC/Go-код меняет жизненный цикл → C позже читает устаревший pointer
```

Для асинхронного callback или долгоживущего состояния не передавайте прямой указатель на Go object. Используйте документированный механизм handles (`runtime/cgo.Handle`), копируйте данные в C-managed memory либо проектируйте callback boundary по правилам библиотеки. Это сложная интеграция, которую нужно изолировать и покрыть integration tests/race tests.

Не передавайте `&slice[0]`, если слайс пуст, и не позволяйте C писать за пределы переданного буфера. Входной размер и возвращаемый C размер проверяются до преобразования в Go slice/string.

## Ошибки C API

C часто возвращает код статуса, `NULL` или устанавливает `errno`, а не Go `error`. Тонкая Go-обёртка должна сразу переводить это в idiomatic contract:

```go
func encrypt(input []byte) ([]byte, error) {
	// 1. Проверить длину input и выделить output по правилам C API.
	// 2. Вызвать C.encrypt(...).
	// 3. Проверить status/NULL/errno.
	// 4. Скопировать успешный результат в Go-managed []byte.
	// 5. Освободить C resources на всех путях.
	return nil, errors.New("пример: реализация зависит от C API")
}
```

Не возвращайте «частично заполненный» output как успешный и не паникуйте на код статуса C. Добавьте контекст через `fmt.Errorf`, но не включайте секретные input/output в error или log.

## Производительность и блокировки

cgo call имеет стоимость перехода между runtime. Для редкой тяжёлой операции она может быть несущественной; для миллиона коротких вызовов она может доминировать. Измеряйте end-to-end benchmark и старайтесь использовать batch API вместо вызова C для каждого байта/поля.

Когда C блокируется в системном вызове, Go runtime может создать дополнительный OS thread, но это не делает вызов автоматически отменяемым через `context.Context`. Если C API не поддерживает отмену/timeout, shutdown Task Manager API может ждать native call до конца. Выбирайте библиотеку с timeout/cancel mechanism, изолируйте вызов и явно документируйте ограничение.

Не передавайте arbitrary Go callbacks в C, не блокируйте C callback на channel send и не вызывайте длительную C-функцию под mutex. Эти комбинации затрудняют shutdown и могут создавать deadlock на границе двух runtime.

## Сборка и portability

Для cgo сборка должна происходить в окружении, совместимом с target:

```bash
CGO_ENABLED=1 go build ./cmd/server
```

Cross-compilation больше не сводится к `GOOS=... GOARCH=... go build`: нужен подходящий cross C compiler, headers и target libraries. Docker build должен включать compiler в builder stage и нужные shared libraries в runtime stage, либо использовать статическую сборку, если это поддерживает конкретная library и license.

В CI добавьте отдельную job для cgo-package и целевой OS/architecture. Pure Go тесты не доказывают, что native linker, dynamic loader и system library работают в production image.

## Когда лучше не использовать cgo

Откажитесь от cgo, если:

- библиотека нужна только для функции, которую уже даёт Go standard library или mature pure-Go dependency;
- код нужен на разных OS/architecture, а нет ресурса поддерживать native builds;
- security policy не допускает C dependency или закрытый native binary;
- dependency не поддерживает timeout, обновления или прозрачную license;
- integration нельзя протестировать в Docker/CI близко к production;
- ожидаемая выгода не подтверждена benchmark/profile.

В backend-разработке простой pure-Go вариант почти всегда выигрывает по deployability и сопровождению. cgo — архитектурное решение, а не локальная оптимизация.

## Чек-лист C boundary

Перед merge убедитесь:

- [ ] `import "C"` и C code изолированы в маленьком пакете;
- [ ] для каждого C allocation есть правильный C cleanup на всех путях;
- [ ] Go API не экспортирует `C.*` типы наружу;
- [ ] C не хранит Go pointers после вызова; callback/handle lifetime документирован;
- [ ] входные размеры, nil и status codes валидируются;
- [ ] есть integration tests на target environment и воспроизводимый Docker/CI build;
- [ ] debug logs не раскрывают секреты из native boundary;
- [ ] известны поддерживаемые OS/arch, license и план обновления C dependency.
