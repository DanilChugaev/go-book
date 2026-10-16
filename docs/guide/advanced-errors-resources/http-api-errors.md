---
prev: /guide/advanced-errors-resources/panic-recover.md
next: /guide/advanced-errors-resources/tests.md
---

# Ошибки HTTP API: контракт, логи и panic

HTTP handler — граница между внутренностями приложения и клиентом. Он получает детали repository, service и внешних клиентов, но не должен выдавать клиенту SQL-текст, адрес базы, stack trace или сообщение panic. Вместо этого handler переводит известные доменные причины в стабильный публичный контракт.

## Один внутренний сбой — два разных представления

Пусть запрос на завершение несуществующей задачи прошёл путь:

```text
PostgreSQL: sql.ErrNoRows
        ↓ repository переводит
domain: ErrTaskNotFound
        ↓ handler переводит
HTTP: 404 + {"code":"task_not_found","message":"Задача не найдена"}
```

Каждое представление предназначено для своего слоя. Нельзя возвращать `err.Error()` в JSON только потому, что это быстро:

```go
// Небезопасно: текст может раскрыть SQL, URL, имя таблицы или внутренний контекст.
c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
```

## Стабильная форма ответа

Сделайте код ошибки машинно-читаемым, а сообщение — понятным человеку. Например:

```go
type errorResponse struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
}
```

Примеры контракта:

```json
{"code":"task_not_found","message":"Задача не найдена"}
```

```json
{
  "code":"validation_failed",
  "message":"Проверьте входные данные",
  "fields":{"title":"required"}
}
```

Клиентская программа должна ориентироваться на `code`, а не на русский текст `message`. Текст можно исправить или локализовать, не ломая интеграцию. Значения `code` и ключи `fields` документируют так же тщательно, как пути и HTTP-статусы.

::: warning Не меняйте текущий контракт незаметно
В основной версии Task Manager API из предыдущих глав ошибка имеет форму `{"error":"..."}`. Новый формат — пример развития API. Для существующих клиентов сохраните старую форму либо вводите новую версию маршрутов/контракта согласованно. «Улучшение» JSON без миграции — breaking change.
:::

## Центральная функция классификации

Не дублируйте длинный `switch` в каждом handler. Одна функция превращает доменную ошибку в HTTP-статус и безопасный payload:

```go
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
	case errors.Is(err, task.ErrTaskAlreadyCompleted):
		return http.StatusConflict, errorResponse{
			Code:    "task_already_completed",
			Message: "Задача уже выполнена",
		}
	default:
		return http.StatusInternalServerError, errorResponse{
			Code:    "internal_error",
			Message: "Внутренняя ошибка сервера",
		}
	}
}
```

Статус `422 Unprocessable Entity` здесь означает: JSON синтаксически корректен, но не проходит правила предметной области. Многие API используют для той же ситуации `400 Bad Request`. Оба подхода возможны; важнее выбрать правило команды, документировать его и не менять выбор от handler к handler.

Для ошибок синтаксиса JSON, неизвестных полей и неверного path-параметра обычно подходит `400`. `401`, `403`, `404`, `409`, `422`, `429`, `503` и другие статусы должны отражать осмысленную, стабильную семантику, а не просто «любой не-500».

## Handler: распознать, записать один ответ, завершиться

Handler вызывает service, классифицирует ошибку и после записи ответа делает `return`:

```go
func (api *API) completeTask(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, errorResponse{
			Code:    "invalid_task_id",
			Message: "Идентификатор задачи должен быть положительным числом",
		})
		return
	}

	completedTask, err := api.service.Complete(c.Request.Context(), id)
	if err != nil {
		status, response := classifyError(err)
		if status >= http.StatusInternalServerError {
			api.logger.Error(
				"не удалось завершить задачу",
				"task_id", id,
				"request_id", c.GetString(requestIDKey),
				"err", err,
			)
		}
		c.JSON(status, response)
		return
	}

	c.JSON(http.StatusOK, completedTask)
}
```

`return` после `c.JSON` предотвращает попытку записать второй ответ. Не маскируйте ожидаемые клиентские ошибки (`404`, `422`) как `Error` в каждом слое: access log уже запишет статус, а дополнительный error-log для каждого неверного запроса создаст шум. Непредвиденный `500` нужно записать с внутренней ошибкой и безопасным операционным контекстом.

## Где логировать ошибку

Ошибка и лог решают разные задачи:

| Ситуация | Возврат `error` | Лог |
| --- | --- | --- |
| repository не нашёл строку | вернуть `ErrTaskNotFound` | обычно нет |
| service отверг бизнес-правило | вернуть доменную ошибку | обычно нет |
| handler вернул ожидаемый `4xx` | обработать и вернуть JSON | access log со статусом; отдельный error-log обычно не нужен |
| handler вернул непредвиденный `5xx` | обработать и вернуть безопасный JSON | один `Error` на границе с request ID и внутренней причиной |
| `main` не смог запустить приложение | вернуть ошибку из `run` | один финальный `Error` перед выходом |
| middleware перехватил panic | завершить запрос `500` | один `Error` со stack trace в защищённом журнале |

Логировать ошибку в repository, затем service, затем handler и `main` — значит получить несколько почти одинаковых записей. Добавляйте контекст в возвращаемую цепочку на нижних слоях; логируйте там, где ошибка окончательно обработана.

## Context: отмена клиента и timeout

`c.Request.Context()` отменяется, когда клиент разорвал соединение или сервер прекращает запрос. Не превращайте каждую отмену в `500` и не пытайтесь писать клиенту ответ, который уже отключился.

Политика зависит от того, где установлен дедлайн:

- `context.Canceled` часто означает, что клиент уже ушёл; завершите работу и учитывайте это отдельно от ошибки сервера;
- `context.DeadlineExceeded` из дедлайна gateway или handler может соответствовать `504 Gateway Timeout`, но это решение архитектуры, а не автоматическое правило;
- timeout к внешнему сервису иногда правильнее отдать как `503 Service Unavailable`, иногда как `502 Bad Gateway` или `504`.

Сначала передайте context во все отменяемые операции (`QueryContext`, `http.NewRequestWithContext`), затем договоритесь о статусах и метриках на границе API. Не подменяйте отменённый context новым `context.Background()` ради продолжения работы: это нарушит shutdown и отмену запроса.

## Recovery middleware — последний слой защиты

В Gin recovery должен располагаться в цепочке middleware и возвращать такой же безопасный контракт `500`:

```go
func recovery(logger *slog.Logger) gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		logger.Error(
			"panic в HTTP handler",
			"request_id", c.GetString(requestIDKey),
			"recovered", recovered,
			"stack", string(debug.Stack()),
		)

		c.AbortWithStatusJSON(http.StatusInternalServerError, errorResponse{
			Code:    "internal_error",
			Message: "Внутренняя ошибка сервера",
		})
	})
}
```

Recovery не исправляет код и не отменяет уже выполненные side effects. После инцидента найдите причину по логу, добавьте воспроизводящий тест и исправьте дефект. Тело ответа никогда не должно содержать `recovered`, `debug.Stack()` или внутренний `err`.

## Тестируйте контракт, а не строку лога

Минимальные тесты функции `classifyError` проверяют публичное поведение без Gin и базы:

```go
func TestClassifyErrorTaskNotFound(t *testing.T) {
	status, response := classifyError(fmt.Errorf("завершить задачу: %w", task.ErrTaskNotFound))

	if status != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", status, http.StatusNotFound)
	}
	if response.Code != "task_not_found" {
		t.Fatalf("code = %q", response.Code)
	}
}
```

Для handler добавьте `httptest`: проверьте статус, `Content-Type`, JSON `code` и отсутствие внутреннего текста. Отдельно протестируйте, что middleware возвращает безопасный `500` при panic. Не делайте stack trace частью тестируемого HTTP-ответа.

## Итоговая граница

Хороший HTTP API не заставляет клиента знать устройство Go-пакетов, драйвер БД или текст panic. Он публикует документированные статусы и коды ошибок, сохраняет внутреннюю диагностику в один защищённый лог и оставляет `panic` последним сигналом о дефекте, а не регулярным механизмом управления программой.
