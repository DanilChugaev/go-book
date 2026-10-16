---
prev: /guide/final-integration/best-practices.md
next: /guide/advanced-errors-resources/defer-resources.md
---

# Продвинутый Go A: ошибки и управление ресурсами

## Цель главы

Научиться проектировать ошибки как часть контракта программы, безопасно освобождать ресурсы, осознанно ограничивать `panic` и `recover`, а также переводить внутренние причины в стабильные ошибки HTTP API.

Этот блок рассчитан на читателя, который уже завершил Task Manager API. Мы не повторяем базовый паттерн `if err != nil`: теперь важны границы между слоями приложения и последствия решений для вызывающего кода, логов, тестов и публичного API.

## Карта главы

1. **Эта страница** — цепочки ошибок, собственные типы, `errors.As` и `errors.Join`.
2. [`defer` и ресурсы](defer-resources.md) — порядок очистки, ошибки `Close`, транзакции и циклы.
3. [`panic` и `recover` в библиотечном коде](panic-recover.md) — когда такая граница оправдана, а когда она скрывает дефект.
4. [Ошибки HTTP API](http-api-errors.md) — перевод доменных ошибок в HTTP-ответы, один осмысленный лог и защита публичного контракта.

## Ошибка — это контракт, а не только текст

У ошибки обычно есть два получателя:

- **человек** читает `Error()` в логе или в диагностике;
- **код** выбирает действие: повторить запрос, показать поле формы, вернуть `404`, завершить процесс.

Поэтому полезно разделять три вещи:

```text
контекст операции  → «сохранить задачу 42»
машинная причина   → sql.ErrNoRows, ErrTaskNotFound, *ValidationError
сообщение клиенту  → «задача не найдена»
```

Текст ошибки нужен для диагностики, но он не должен быть единственным API между пакетами. Если вызывающему коду важно распознать ситуацию, дайте ему стабильную причину для `errors.Is` или структурированные данные для `errors.As`.

## Цепочка обёрнутых ошибок

Каждый слой добавляет только тот контекст, который ему известен:

```go
func (repository *Repository) Get(ctx context.Context, id int64) (Task, error) {
	row := repository.db.QueryRowContext(ctx, getTaskQuery, id)

	var task Task
	if err := row.Scan(&task.ID, &task.Title); err != nil {
		return Task{}, fmt.Errorf("прочитать задачу %d: %w", id, err)
	}

	return task, nil
}

func (service *Service) Complete(ctx context.Context, id int64) (Task, error) {
	task, err := service.repository.Get(ctx, id)
	if err != nil {
		return Task{}, fmt.Errorf("получить задачу для завершения: %w", err)
	}

	// ...
	return task, nil
}
```

Если `Scan` вернул `sql.ErrNoRows`, итоговый текст будет содержать оба контекста. Главное — `%w` сохраняет связь между ошибками. `errors.Is` и `errors.As` пройдут по этой связи без ручного разбора текста.

```go
task, err := service.Complete(ctx, 42)
if errors.Is(err, sql.ErrNoRows) {
	// Техническая причина найдена внутри цепочки.
}
```

В реальном приложении HTTP-слой не должен зависеть от `sql.ErrNoRows`; эту проблему разберём на странице об HTTP API. Пример выше показывает именно механику цепочки.

::: warning Оборачивать — значит раскрывать зависимость
Когда пакет возвращает `fmt.Errorf("...: %w", sql.ErrNoRows)`, его вызывающий код получает возможность проверять `sql.ErrNoRows`. Иногда это нужно, но чаще связывает верхний слой с деталями базы данных. На границе repository лучше преобразовать техническую причину в доменную ошибку, например `ErrTaskNotFound`.
:::

## `errors.Is`: известная причина

`errors.Is` отвечает на вопрос: «есть ли в цепочке именно эта причина?» Он подходит для ошибок-маркеров и стандартных значений:

```go
var ErrTaskNotFound = errors.New("задача не найдена")

func (repository *Repository) Get(ctx context.Context, id int64) (Task, error) {
	var task Task

	// ...
	if errors.Is(err, sql.ErrNoRows) {
		return Task{}, ErrTaskNotFound
	}
	if err != nil {
		return Task{}, fmt.Errorf("получить задачу %d: %w", id, err)
	}

	return task, nil
}
```

Теперь service и HTTP handler могут проверять `ErrTaskNotFound`, не зная, PostgreSQL, файл или другой источник данных используется внутри.

Не создавайте новый `errors.New("задача не найдена")` при каждом возврате: это другое значение, и `errors.Is` его не узнает. Сравнение `err.Error()` со строкой ещё хрупче — текст можно уточнить, локализовать или дополнить контекстом.

## Собственные типы ошибок

Ошибка-маркер сообщает только факт. Иногда вызывающему коду нужны данные: имя поля, нарушенное правило, лимит, задержка повторной попытки или идентификатор внешнего сервиса. Для этого создают тип ошибки.

Ниже `ValidationError` хранит детали некорректного поля и при этом оборачивает общую причину `ErrInvalidInput`:

```go
var ErrInvalidInput = errors.New("некорректные входные данные")

type ValidationError struct {
	Field string
	Rule  string
	Value string
}

func (err *ValidationError) Error() string {
	return fmt.Sprintf("поле %q не прошло правило %q", err.Field, err.Rule)
}

func (err *ValidationError) Unwrap() error {
	return ErrInvalidInput
}

func validateTitle(title string) error {
	title = strings.TrimSpace(title)
	if title == "" {
		return &ValidationError{
			Field: "title",
			Rule:  "required",
		}
	}
	if utf8.RuneCountInString(title) > 120 {
		return &ValidationError{
			Field: "title",
			Rule:  "max_length",
			Value: strconv.Itoa(utf8.RuneCountInString(title)),
		}
	}

	return nil
}
```

У типа есть три полезных свойства:

- `Error()` даёт человекочитаемую диагностику;
- поля дают коду структурированные данные, не требуя разбора строки;
- `Unwrap()` делает одновременно верными две проверки: конкретного типа и общей причины.

```go
err := validateTitle("")

fmt.Println(errors.Is(err, ErrInvalidInput)) // true

var validationErr *ValidationError
if errors.As(err, &validationErr) {
	fmt.Println(validationErr.Field) // title
	fmt.Println(validationErr.Rule)  // required
}
```

## `errors.As`: получить тип и его данные

`errors.As` ищет в цепочке ошибку, которую можно присвоить указанному типу. Второй аргумент — **указатель на переменную для результата**, поэтому для `*ValidationError` получается `**ValidationError`:

```go
var validationErr *ValidationError
if errors.As(err, &validationErr) {
	// validationErr уже содержит найденную ошибку.
	return validationErr.Field
}
```

Можно искать и интерфейс. Например, стандартный `net.Error` сообщает, что сетевая ошибка временная или связана с timeout:

```go
var networkErr net.Error
if errors.As(err, &networkErr) && networkErr.Timeout() {
	// Политика повторной попытки зависит от операции.
}
```

Не используйте `errors.As` только потому, что тип существует. Если вызывающему коду достаточно вопроса «это отсутствие задачи?», проще и понятнее `errors.Is(err, ErrTaskNotFound)`. Тип вводят тогда, когда его поля действительно становятся частью контракта.

## Указатель, значение и ловушка typed `nil`

В примере `ValidationError` возвращается указателем. Это позволяет не копировать структуру и делает стиль единообразным. Но интерфейс `error` состоит из динамического типа и значения. Интерфейс с типом `*ValidationError` и значением `nil` **не равен `nil`**:

```go
func invalidReturn() error {
	var validationErr *ValidationError
	return validationErr // error содержит тип *ValidationError, поэтому он не nil
}

func main() {
	if err := invalidReturn(); err != nil {
		fmt.Println("неожиданная ошибка")
	}
}
```

При отсутствии ошибки всегда возвращайте явный `nil`:

```go
func validatePriority(priority int) error {
	if priority < 1 || priority > 5 {
		return &ValidationError{Field: "priority", Rule: "range"}
	}

	return nil
}
```

## Несколько причин: `errors.Join`

Начиная с Go 1.20, `errors.Join` объединяет независимые ошибки. Это полезно, когда операция выполнила несколько обязательных действий и нужно не потерять ни одну неудачу: например, основная запись не удалась, а закрытие ресурса тоже вернуло ошибку.

```go
func validateCreateInput(title string, priority int) error {
	var errs []error

	if err := validateTitle(title); err != nil {
		errs = append(errs, err)
	}
	if err := validatePriority(priority); err != nil {
		errs = append(errs, err)
	}

	return errors.Join(errs...)
}
```

`errors.Join()` возвращает `nil`, если все аргументы равны `nil` или аргументов нет. Для объединённой ошибки работают `errors.Is` и `errors.As`:

```go
err := validateCreateInput("", 10)

fmt.Println(errors.Is(err, ErrInvalidInput)) // true

var validationErr *ValidationError
fmt.Println(errors.As(err, &validationErr)) // true
```

Но первый найденный `ValidationError` — не полноценный список ошибок для JSON-ответа. Если API должно сообщать обо всех проблемных полях, храните их в явной структуре ответа или возвращайте отдельную доменную коллекцию. Не пытайтесь строить публичный контракт, перебирая внутреннюю цепочку через `errors.Unwrap`: у объединённой ошибки может быть несколько дочерних ошибок.

::: tip Не применяйте `errors.Join` вместо решения
Одна операция должна иметь ясную главную причину. Объединяйте ошибки, когда обе важны для диагностики или очистки ресурсов. Не добавляйте в `Join` повтор одного и того же контекста на каждом уровне — лог и итоговая строка станут шумными.
:::

## Контракт пакета: что можно проверять снаружи

Перед тем как вернуть или обернуть ошибку, ответьте на вопросы:

1. **Кто будет её обрабатывать?** Этот же пакет, service, HTTP handler, `main`?
2. **Какое действие доступно вызывающему коду?** Отдать `404`, попросить исправить поле, повторить операцию, завершить запуск?
3. **Нужно ли раскрывать внутреннюю причину?** Например, внешний пакет обычно не должен зависеть от драйвера БД.
4. **Какие поля стабильны?** Если это `ValidationError`, пользователь `Field` и `Rule` должны иметь документированные значения.

Практическое правило границ Task Manager:

| Слой | Что делает с ошибкой |
| --- | --- |
| repository | Переводит технические ожидаемые причины в доменные; добавляет контекст к непредвиденным инфраструктурным сбоям. |
| service | Применяет бизнес-правила, при необходимости добавляет бизнес-контекст; не знает HTTP-статусы. |
| HTTP handler | Распознаёт доменные ошибки и строит безопасный публичный ответ. |
| `main` / worker | Принимает окончательное решение о завершении процесса и логирует необработанную ошибку. |

Следующая страница посвящена другой стороне надёжности: действия, которые должны произойти при любом выходе из функции.
