# Содержание

Это рабочая программа учебника. Главы из основного маршрута ведут к созданию Task Manager API: сначала в памяти, затем с JSON-хранилищем, HTTP API, PostgreSQL и деплоем. Продвинутый блок начинается после завершения основного проекта и не обязателен для первого прохода.

## Часть I. Основа языка

### Глава 1. Введение в Go

- задачи, для которых подходит Go;
- установка Go и редактора;
- терминал и команда `go version`;
- Go-модуль и файл `go.mod`;
- первая программа;
- `go run .`, `gofmt` и `go build`.

1. [Что такое Go и зачем он нужен?](introduction/what-is-go.md)
2. [Установка и настройка](introduction/installation.md)
3. [Первая программа и Go-модуль](introduction/first-program.md)
4. [Самопроверка](introduction/tests.md)
5. [Задания](introduction/practice.md)
6. [Рекомендации по коду](introduction/best-practices.md)

### Глава 2. Переменные и базовые типы

- `var`, `:=` и `=`;
- нулевые значения;
- константы, блок `const` и `iota`;
- целые числа, `float64` и `bool`;
- явные преобразования типов;
- переполнение и потеря данных при преобразовании.

1. [Переменные](variables-and-data-types/variables.md)
2. [Простые типы данных](variables-and-data-types/simple-data-types.md)
3. [Самопроверка](variables-and-data-types/tests.md)
4. [Задания](variables-and-data-types/practice.md)
5. [Рекомендации по коду](variables-and-data-types/best-practices.md)

### Глава 3. Строки и обработка текста

- строка как неизменяемая последовательность байтов;
- UTF-8, `byte`, `rune`, `len` и `utf8.RuneCountInString`;
- нормализация пользовательского ввода через `strings.TrimSpace`;
- регистр, поиск подстроки, префиксы и суффиксы;
- подготовка названия задачи к валидации.

1. [Строки и обработка текста](strings/README.md)
2. [Самопроверка](strings/tests.md)
3. [Задания](strings/practice.md)
4. [Рекомендации по коду](strings/best-practices.md)

### Глава 4. Операторы и выражения

- арифметические операторы;
- целочисленное и дробное деление;
- остаток от деления;
- сравнение значений;
- `&&`, `||` и `!`;
- присваивание, `+=`, `++`, `--`;
- приоритет операций и скобки;
- переполнение чисел.

1. [Операторы и выражения](operators-and-expressions/README.md)
2. [Самопроверка](operators-and-expressions/tests.md)
3. [Задания](operators-and-expressions/practice.md)
4. [Рекомендации по коду](operators-and-expressions/best-practices.md)

### Глава 5. Условия: `if` и `switch`

- `if`, `else if`, `else`;
- короткое объявление в условии;
- порядок проверок и ранний выход;
- `switch`, несколько значений в `case`, `default`;
- выбор между `if` и `switch`;
- валидация названия и приоритета задачи.

1. [Условия: if и switch](control-flow/README.md)
2. [Самопроверка](control-flow/tests.md)
3. [Задания](control-flow/practice.md)
4. [Рекомендации по коду](control-flow/best-practices.md)

### Глава 6. Циклы: `for` и `range`

- `for` с условием;
- классическая форма `for`;
- бесконечный цикл;
- `break` и `continue`;
- `range` для строк;
- байтовый индекс и руны;
- пустой идентификатор `_`.

1. [Циклы: for и range](loops/README.md)
2. [Самопроверка](loops/tests.md)
3. [Задания](loops/practice.md)
4. [Рекомендации по коду](loops/best-practices.md)

### Глава 7. Функции

- объявление и вызов функций;
- параметры и передача аргументов по значению;
- один и несколько результатов;
- ранний `return`;
- именованные результаты;
- область видимости;
- вынос валидации задачи из `main`.

1. [Функции](functions/README.md)
2. [Самопроверка](functions/tests.md)
3. [Задания](functions/practice.md)
4. [Рекомендации по коду](functions/best-practices.md)

## Часть II. Данные и модели

### Глава 8. Массивы и слайсы

- разница между массивом и слайсом;
- индексы, `len` и `cap`;
- литералы и `make`;
- добавление через `append`;
- срезы `from:to`;
- безопасная проверка индекса;
- удаление элемента;
- копирование через `copy`;
- обход слайса через `range`.

1. [Массивы и слайсы](slices-and-arrays/README.md)
2. [Самопроверка](slices-and-arrays/tests.md)
3. [Задания](slices-and-arrays/practice.md)
4. [Рекомендации по коду](slices-and-arrays/best-practices.md)

### Глава 9. Map: ключ и значение

- создание map через литерал и `make`;
- чтение, добавление и обновление значений;
- безопасный поиск через `value, ok`;
- `delete` и `len`;
- обход map через `range`;
- отсутствие гарантированного порядка;
- задачи по числовому ID.

1. [Map: ключ и значение](maps/README.md)
2. [Самопроверка](maps/tests.md)
3. [Задания](maps/practice.md)
4. [Рекомендации по коду](maps/best-practices.md)

### Глава 10. Структуры

- объявление собственных типов;
- поля и нулевые значения;
- литералы с именами полей;
- чтение и изменение полей;
- копирование структур;
- `[]Task` и `map[int]Task`;
- изменение элементов слайса и map.

1. [Структуры: модель задачи](structs/README.md)
2. [Самопроверка](structs/tests.md)
3. [Задания](structs/practice.md)
4. [Рекомендации по коду](structs/best-practices.md)

### Глава 11. Методы

- разница между функцией и методом;
- receiver по значению;
- методы `Summary` и `IsValid`;
- `fmt.Sprintf`;
- размещение поведения рядом с данными;
- ограничения методов с value receiver.

1. [Методы](methods/README.md)
2. [Самопроверка](methods/tests.md)
3. [Задания](methods/practice.md)
4. [Рекомендации по коду](methods/best-practices.md)

### Глава 12. Указатели

- адрес через `&` и разыменование через `*`;
- типы `*T` и `nil`;
- `new` и `&Task{...}`;
- изменение структуры через указатель;
- pointer receiver;
- методы `Complete` и `Rename`;
- указатели и структуры в map.

1. [Указатели](pointers/README.md)
2. [Самопроверка](pointers/tests.md)
3. [Задания](pointers/practice.md)
4. [Рекомендации по коду](pointers/best-practices.md)

### Глава 13. Интерфейсы

- интерфейс как набор методов;
- неявная реализация без `implements`;
- маленькие интерфейсы;
- зависимость от поведения, а не конкретного типа;
- value receiver и pointer receiver в интерфейсах;
- интерфейсные значения и `nil`;
- пример `TaskFormatter`.

1. [Интерфейсы](interfaces/README.md)
2. [Самопроверка](interfaces/tests.md)
3. [Задания](interfaces/practice.md)
4. [Рекомендации по коду](interfaces/best-practices.md)

## Часть III. Надёжный код и организация проекта

### Глава 14. Обработка ошибок

- тип `error`;
- успех через `nil`;
- `errors.New` и ошибки `Err...`;
- проверка `if err != nil`;
- ранний `return`;
- `fmt.Errorf` и `%w`;
- `errors.Is`;
- ошибки в методе `Task.Rename`.

1. [Обработка ошибок](errors/README.md)
2. [Самопроверка](errors/tests.md)
3. [Задания](errors/practice.md)
4. [Рекомендации по коду](errors/best-practices.md)

### Глава 15. `defer`, `panic` и `recover`

- отложенное выполнение через `defer`;
- порядок нескольких `defer`;
- освобождение ресурсов;
- `panic` как аварийное завершение;
- `recover` и его ограниченное применение;
- отличие ожидаемой ошибки от panic;
- безопасное закрытие ресурсов Task Manager API.

1. [`defer`, `panic` и `recover`](defer-panic-recover/README.md)
2. [Самопроверка](defer-panic-recover/tests.md)
3. [Задания](defer-panic-recover/practice.md)
4. [Рекомендации по коду](defer-panic-recover/best-practices.md)

### Глава 16. Пакеты и модули

- различие модуля и пакета;
- module path и `go.mod`;
- `package main`;
- импорт собственного кода;
- экспортируемые и неэкспортируемые имена;
- папка `internal`;
- разделение Task Manager API на `main` и `internal/task`;
- несколько файлов одного пакета.

1. [Пакеты и модули](packages-and-modules/README.md)
2. [Самопроверка](packages-and-modules/tests.md)
3. [Задания](packages-and-modules/practice.md)
4. [Рекомендации по коду](packages-and-modules/best-practices.md)

### Глава 17. Тестирование

- команда `go test`;
- unit-тесты функций и методов;
- table-driven tests;
- subtests;
- проверки ошибок через `errors.Is`;
- тестирование `Task` и простого Store;
- покрытие тестами;
- `go test -race ./...`.

1. [Тестирование](testing/README.md)
2. [Самопроверка](testing/tests.md)
3. [Задания](testing/practice.md)
4. [Рекомендации по коду](testing/best-practices.md)

### Глава 18. Файлы и ввод-вывод

- `os.ReadFile` и `os.WriteFile`;
- `os.Open`, `os.Create`, `io.ReadAll`;
- закрытие файла через `defer file.Close()`;
- пути к файлам;
- `filepath.Join` и `os.MkdirAll`;
- `os.ErrNotExist`;
- текстовый экспорт задач;
- `strings.Builder` для формирования экспорта.
- тестирование файлового кода через `t.TempDir`.

1. [Файлы и ввод-вывод](file-io/README.md)
2. [Самопроверка](file-io/tests.md)
3. [Задания](file-io/practice.md)
4. [Рекомендации по коду](file-io/best-practices.md)

### Глава 19. JSON и сериализация

- `encoding/json`;
- `json.Marshal`, `json.MarshalIndent` и `json.Unmarshal`;
- JSON-теги;
- экспортируемые поля;
- `nil`- и пустые слайсы в JSON;
- сохранение и загрузка `[]Task`;
- пакет `internal/storage`;
- тестирование JSON-хранилища через `t.TempDir`;
- различие JSON-формата и бизнес-валидации.

1. [JSON и сериализация](json/README.md)
2. [Самопроверка](json/tests.md)
3. [Задания](json/practice.md)
4. [Рекомендации по коду](json/best-practices.md)

### Глава 20. Время и дедлайны

- `time.Time` и нулевое время;
- `time.Duration`;
- `Add`, `Sub`, `Before`, `After`, `Equal`;
- `Format`, layout эталонной даты и `Parse`;
- UTC и RFC3339;
- поле `DueAt`;
- методы `IsOverdue` и `Remaining`.
- table-driven tests дедлайна с фиксированным `now`;
- JSON round-trip для `DueAt`.

1. [Время и дедлайны](time/README.md)
2. [Самопроверка](time/tests.md)
3. [Задания](time/practice.md)
4. [Рекомендации по коду](time/best-practices.md)

## Часть IV. Конкурентность

### Глава 21. Goroutine

- запуск работы через `go`;
- непредсказуемый порядок выполнения;
- завершение goroutine вместе с `main`;
- `sync.WaitGroup`;
- `Add`, `Done`, `Wait`;
- `defer wg.Done()`;
- goroutine в цикле;
- параллельная подготовка экспортов.
- тестирование фоновых worker через `t.TempDir` и сигнал завершения.

1. [Goroutine](goroutines/README.md)
2. [Самопроверка](goroutines/tests.md)
3. [Задания](goroutines/practice.md)
4. [Рекомендации по коду](goroutines/best-practices.md)

### Глава 22. Каналы

- создание `chan`;
- отправка и получение через `<-`;
- небуферизированные и буферизированные каналы;
- блокировка и deadlock;
- закрытие канала;
- `range` по каналу;
- направленные каналы `chan<-` и `<-chan`;
- результаты экспортов через канал.
- закрытие канала после нескольких отправителей;
- тестирование результатов и закрытия без `time.Sleep`.

1. [Каналы](channels/README.md)
2. [Самопроверка](channels/tests.md)
3. [Задания](channels/practice.md)
4. [Рекомендации по коду](channels/best-practices.md)

### Глава 23. `select` и таймауты

- `select` для нескольких каналов;
- выбор между готовыми `case`;
- `default` и неблокирующая проверка;
- `time.After`;
- общий таймаут нескольких операций;
- закрытые и `nil`-каналы в `select`;
- ожидание экспортов с таймаутом.

1. [Select и таймауты](select-and-timeouts/README.md)
2. [Самопроверка](select-and-timeouts/tests.md)
3. [Задания](select-and-timeouts/practice.md)
4. [Рекомендации по коду](select-and-timeouts/best-practices.md)

### Глава 24. Mutex и синхронизация

- гонки данных;
- `go run -race .` и `go test -race ./...`;
- `sync.Mutex`;
- `Lock`, `Unlock` и `defer Unlock`;
- `sync.RWMutex`, `RLock`, `RUnlock`;
- роли `WaitGroup`, mutex и каналов;
- потокобезопасный `TaskStore`;
- короткие критические секции.

1. [Mutex и синхронизация](mutex-and-synchronization/README.md)
2. [Самопроверка](mutex-and-synchronization/tests.md)
3. [Задания](mutex-and-synchronization/practice.md)
4. [Рекомендации по коду](mutex-and-synchronization/best-practices.md)

### Глава 25. Context: отмена и дедлайны

- `context.Background`;
- context как первый параметр;
- `WithCancel` и `WithTimeout`;
- `defer cancel()`;
- `Done` и `Err`;
- `context.Canceled` и `context.DeadlineExceeded`;
- кооперативная отмена goroutine;
- отменяемые экспорты.

1. [Context: отмена и дедлайны](context/README.md)
2. [Самопроверка](context/tests.md)
3. [Задания](context/practice.md)
4. [Рекомендации по коду](context/best-practices.md)

## Часть V. HTTP API и production-подготовка

### Глава 26. Логирование и отладка

- пакет `log/slog`;
- уровни `Debug`, `Info`, `Warn`, `Error`;
- структурированные поля логов;
- `go vet`;
- запуск отдельных тестов;
- чтение stack trace;
- отладчик IDE;
- диагностика через race detector;
- краткое введение в `pprof`.

TODO добавить ссылки на страницы

### Глава 27. HTTP-сервер и JSON API

- `net/http` и `ServeMux`;
- request и response;
- HTTP-методы и коды статусов;
- JSON-запросы и ответы;
- валидация входных данных;
- маршруты Task Manager API;
- handler, service и repository как уровни приложения;
- обработка ошибок и логирование в HTTP-слое.

TODO добавить ссылки на страницы

### Глава 28. HTTP-клиент

- `http.Client`;
- `http.NewRequestWithContext`;
- headers и body;
- чтение и закрытие response body;
- проверка HTTP-статусов;
- таймауты и context;
- вызов внешнего API;
- обработка сетевых ошибок.

TODO добавить ссылки на страницы

### Глава 29. Конфигурация и жизненный цикл приложения

- переменные окружения;
- конфигурация порта, пути хранилища и адреса БД;
- валидация конфигурации при старте;
- `signal.NotifyContext`;
- graceful shutdown HTTP-сервера;
- закрытие файловых и сетевых ресурсов;
- health-check.

TODO добавить ссылки на страницы

### Глава 30. SQL и PostgreSQL

- `database/sql`;
- подключение и проверка соединения;
- параметры запроса и защита от SQL-инъекций;
- контекст в SQL-операциях;
- CRUD задач;
- репозиторий PostgreSQL;
- миграции;
- транзакции — базово;
- интеграционные тесты.

TODO добавить ссылки на страницы

### Глава 31. Docker, CI/CD и деплой

- multi-stage Docker build;
- Docker Compose для API и PostgreSQL;
- переменные окружения в контейнере;
- GitHub Actions;
- `go test`, `go vet`, `go test -race` в CI;
- сборка контейнера;
- базовые production-настройки.

TODO добавить ссылки на страницы

### Глава 32. Итоговая интеграция

- финальная структура Task Manager API;
- README и запуск проекта;
- примеры HTTP-запросов;
- итоговый чек-лист качества;
- направления дальнейшего развития: авторизация, фильтрация, пагинация, метрики и rate limiting.

TODO добавить ссылки на страницы

## Часть VI. Продвинутый Go

Этот блок предполагает, что основной Task Manager API уже завершён. Темы здесь нужны для углубления, а не для первого рабочего backend-проекта.

### Продвинутая глава A. Ошибки и управление ресурсами

- углублённая работа с `defer`;
- порядок отложенных вызовов;
- `panic` и `recover` в библиотечном коде;
- собственные типы ошибок;
- `errors.As`;
- цепочки обёрнутых ошибок;
- проектирование ошибок HTTP API;
- границы между ошибкой, логом и panic.

TODO добавить ссылки на страницы

### Продвинутая глава B. Типы и generics

- defined types и type alias;
- type parameters;
- `any` и `comparable`;
- constraints и type sets;
- оператор `~` в ограничениях;
- generic-функции;
- generic-типы;
- оправданное и избыточное применение generics.

TODO добавить ссылки на страницы

### Продвинутая глава C. Конкурентные паттерны

- worker pool;
- fan-out и fan-in;
- pipeline;
- ограничение параллелизма через buffered channel;
- `errgroup`;
- распространение отмены;
- graceful shutdown группы goroutine;
- backpressure;
- утечки goroutine и их диагностика.

TODO добавить ссылки на страницы

### Продвинутая глава D. Производительность и диагностика

- benchmarks;
- `go test -bench`;
- `benchstat`;
- CPU profiling;
- memory profiling;
- `pprof`;
- аллокации и escape analysis;
- измерение до оптимизации;
- `strings.Builder` и `sync.Pool` с ограничениями применения.

TODO добавить ссылки на страницы

### Продвинутая глава E. Reflection, `unsafe` и cgo

- `reflect.Type` и `reflect.Value`;
- практическая роль reflection в JSON, ORM и фреймворках;
- ограничения, производительность и хрупкость reflection;
- обзор `unsafe`;
- риски ручной работы с памятью;
- основы cgo;
- случаи, когда эти инструменты лучше не использовать.

TODO добавить ссылки на страницы

### Продвинутая глава F. Архитектура production-сервиса

- направления зависимостей;
- интерфейсы на границах приложения;
- handler, service и repository без избыточной абстракции;
- конфигурация и секреты;
- observability: логи, метрики и трассировка;
- readiness и liveness;
- retries, timeouts и idempotency;
- rate limiting;
- безопасность API;
- code review checklist.

TODO добавить ссылки на страницы

## Справочник

- базовые понятия Go;
- продвинутые понятия Go;
- команды Go toolchain;
- типичные ошибки новичков;
- дополнительные ресурсы.

TODO добавить ссылки на страницы
