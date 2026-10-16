---
prev: /guide/advanced-errors-resources/README.md
next: /guide/advanced-errors-resources/panic-recover.md
---

# `defer` и жизненный цикл ресурсов

`defer` уже встречался при закрытии файлов, отмене context и снятии mutex. В production-коде важно не просто «поставить defer», а определить владельца ресурса, порядок его освобождения и судьбу ошибки очистки.

## Ресурс должен иметь владельца

Ресурсом может быть файл, HTTP response body, строка результатов SQL, транзакция, соединение, lock или context с `cancel`. У каждого ресурса должно быть понятно:

1. кто его получил;
2. кто обязан его освободить;
3. когда это произойдёт;
4. что делать, если освобождение не удалось.

Обычное правило владения: **функция, которая успешно получила ресурс и не передала владение явно, освобождает его сама**.

```go
func readConfig(path string) ([]byte, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("открыть конфигурацию: %w", err)
	}
	defer file.Close()

	content, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("прочитать конфигурацию: %w", err)
	}

	return content, nil
}
```

`file` не возвращается вызывающему коду, значит именно `readConfig` остаётся владельцем и гарантирует `Close`. Если функция возвращает `*os.File`, это должно быть явно отражено в документации: обязанность закрыть файл переходит к вызывающему коду.

## Что именно делает `defer`

Отложенный вызов выполняется при выходе из **текущей функции**: через `return` или при раскрутке стека из-за panic. Аргументы вызова вычисляются сразу, а несколько `defer` выполняются по правилу LIFO — последний зарегистрированный вызов сработает первым.

```go
func example() {
	name := "до изменения"
	defer fmt.Println(name) // аргумент уже вычислен
	defer func() {
		fmt.Println(name) // переменная будет прочитана позже
	}()

	name = "после изменения"
}

// Вывод:
// после изменения
// до изменения
```

LIFO естественно освобождает вложенные ресурсы в обратном порядке захвата. Если сначала открыли файл, а поверх него создали `bufio.Writer`, сначала нужно выполнить `Flush`, а затем закрыть файл.

## Ошибки `Close`: не теряйте значимую причину

Ошибка закрытия при чтении часто не меняет уже прочитанные данные, но не является невозможной. При записи она особенно важна: финальная запись буфера или синхронизация с файловой системой может произойти именно во время `Close`.

В функции с именованным результатом отложенная функция может дополнить итоговую ошибку. `errors.Join` сохраняет и исходную неудачу, и проблему очистки:

```go
func writeReport(path, report string) (err error) {
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

Если запись успешна, функция вернёт ошибку `Close`, если она возникла. Если не удались и запись, и закрытие, обе причины останутся доступны через `errors.Is`/`errors.As`.

Не усложняйте каждый короткий пример этим шаблоном. Выбирайте политику по контракту операции: для критичного экспорта ошибка закрытия важна; для best-effort чтения временного файла может быть достаточно зафиксировать решение в комментарии или документации.

## Зависимые ресурсы: буфер до файла

Порядок регистрации `defer` важнее порядка строк в итоговом выполнении:

```go
func writeBufferedReport(path, report string) (err error) {
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("создать отчёт: %w", err)
	}
	defer func() {
		if closeErr := file.Close(); closeErr != nil {
			err = errors.Join(err, fmt.Errorf("закрыть отчёт: %w", closeErr))
		}
	}()

	writer := bufio.NewWriter(file)
	defer func() {
		if flushErr := writer.Flush(); flushErr != nil {
			err = errors.Join(err, fmt.Errorf("сбросить буфер отчёта: %w", flushErr))
		}
	}()

	if _, err := writer.WriteString(report); err != nil {
		return fmt.Errorf("записать отчёт в буфер: %w", err)
	}

	return nil
}
```

Последний `defer` для `Flush` сработает первым, поэтому данные попадут в файл до `Close`. Если поменять их местами, `Flush` будет писать в уже закрытый файл.

## Мьютексы и короткие критические секции

Сразу после успешного `Lock` регистрируйте `Unlock`:

```go
store.mu.Lock()
defer store.mu.Unlock()

if _, exists := store.tasks[id]; exists {
	return ErrTaskAlreadyExists
}
store.tasks[id] = task
return nil
```

Так ранний `return` не оставит mutex заблокированным. Но `defer` не оправдывает долгую критическую секцию: не держите lock во время HTTP-вызова, обращения к БД, записи файла или ожидания канала. Сначала скопируйте необходимые данные под lock, снимите его и только потом выполняйте медленную работу.

## `cancel` у context

`context.WithCancel`, `WithTimeout` и `WithDeadline` возвращают функцию отмены. Она освобождает внутренние ресурсы раньше, чем истечёт дедлайн, поэтому её вызывают всегда:

```go
func fetchPriority(parent context.Context, client *http.Client, url string) error {
	ctx, cancel := context.WithTimeout(parent, 2*time.Second)
	defer cancel()

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("создать запрос приоритета: %w", err)
	}

	response, err := client.Do(request)
	if err != nil {
		return fmt.Errorf("получить приоритет: %w", err)
	}
	defer response.Body.Close()

	return nil
}
```

У `http.Response.Body` тот же контракт владения: после успешного `Do` вызывающий обязан закрыть body, даже если код статуса неуспешный. Это позволяет transport вернуть соединение в пул. Для переиспользования HTTP-соединения обычно также нужно дочитать body до конца, если это оправдано контрактом клиента.

## Опасность `defer` в долгом цикле

`defer` выполняется при выходе из функции, а не в конце итерации. Поэтому код ниже откроет все файлы до завершения `processAll` и может исчерпать файловые дескрипторы:

```go
func processAll(paths []string) error {
	for _, path := range paths {
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close() // Плохо: закроется только в конце processAll.
		// ...
	}
	return nil
}
```

Выберите один из безопасных вариантов.

**Вариант 1: вынести одну итерацию в отдельную функцию.** Тогда `defer` относится к короткой области видимости:

```go
func processOne(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("открыть %q: %w", path, err)
	}
	defer file.Close()

	// Обработка одного файла.
	return nil
}

func processAll(paths []string) error {
	for _, path := range paths {
		if err := processOne(path); err != nil {
			return err
		}
	}
	return nil
}
```

**Вариант 2: закрыть ресурс явно в конце каждой итерации.** Здесь нужно аккуратно объединить ошибку обработки и ошибку закрытия. В большинстве случаев маленькая вспомогательная функция читается лучше.

Та же проблема бывает с `defer cancel()` внутри цикла. Создавайте context на одну итерацию во вложенной функции или вызовите `cancel()` явно сразу после работы.

## Транзакция SQL: rollback по умолчанию

У транзакции есть два корректных финала: `Commit` при успехе и `Rollback` при любой ошибке. Удобный шаблон — сразу отложить rollback:

```go
func (repository *Repository) Complete(ctx context.Context, id int64) error {
	tx, err := repository.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("начать транзакцию: %w", err)
	}
	defer tx.Rollback()

	result, err := tx.ExecContext(ctx, completeTaskQuery, id)
	if err != nil {
		return fmt.Errorf("завершить задачу %d: %w", id, err)
	}

	updated, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("получить число обновлённых задач: %w", err)
	}
	if updated == 0 {
		return ErrTaskNotFound
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("зафиксировать завершение задачи %d: %w", id, err)
	}

	return nil
}
```

После успешного `Commit` отложенный `Rollback` вернёт `sql.ErrTxDone`; его здесь безопасно игнорировать, потому что транзакция уже завершена. Если контракт требует диагностировать rollback или cleanup отдельно, используйте явную, протестированную политику — не добавляйте сложность автоматически.

## `defer` не заменяет измерения

В современном Go стоимость `defer` в обычном коде обычно не повод для микрооптимизации. Сначала пишите понятный безопасный код, затем измеряйте benchmark и profile, если операция действительно находится на горячем пути. В первую очередь избегайте не самого `defer`, а неверной области его действия: длинного цикла, долгого lock или неочевидного порядка очистки.

## Итог

`defer` хорош, когда ресурс живёт до конца небольшой функции и его освобождение неизбежно. Следующая страница разберёт другое поведение, которое тоже запускает отложенные вызовы, — `panic`, и объяснит, почему библиотека почти никогда не должна скрывать его без строгого контракта.
