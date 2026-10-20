# Дополнительные ресурсы

Эта страница собирает материалы для самостоятельного углубления. Основной маршрут учебника остаётся достаточным для первого прохода: не пытайтесь изучить всё из списка одновременно. Выбирайте ресурс под текущую задачу — уточнить правило языка, потренироваться или разобрать production-паттерн.

## Исходный код примеров

Полные исходники к практическим заданиям находятся в каталоге [`examples/`](https://github.com/DanilChugaev/go-book/tree/master/examples) репозитория. На страницах с готовыми примерами есть отдельный блок с точным путём к соответствующему каталогу. Каждый пример запускайте из его собственной папки, чтобы не смешивать Go-модули разных глав.

Сейчас доступны:

- [`examples/01/hello-go`](https://github.com/DanilChugaev/go-book/tree/master/examples/01/hello-go) — первая программа и модуль Go;
- [`examples/01/task-manager-api`](https://github.com/DanilChugaev/go-book/tree/master/examples/01/task-manager-api) — начальная структура сквозного проекта;
- [`examples/32/task-manager-api`](https://github.com/DanilChugaev/go-book/tree/master/examples/32/task-manager-api) — Docker-конфигурация Task Manager API.

## Официальные материалы Go

- [Документация Go](https://go.dev/doc/) — стартовая точка для руководств, статей и инструментов.
- [A Tour of Go](https://go.dev/tour/) — интерактивное введение в синтаксис и стандартные конструкции.
- [Effective Go](https://go.dev/doc/effective_go) — принципы идиоматичного Go; читайте после освоения базы, не как замену практике.
- [Go by Example](https://gobyexample.com/) — короткие исполняемые примеры по отдельным темам.
- [Go Specification](https://go.dev/ref/spec) — точный источник правил языка. Полезна для спорных деталей, но не предназначена как первый учебник.
- [Документация стандартной библиотеки](https://pkg.go.dev/std) — API пакетов `context`, `net/http`, `database/sql`, `testing` и других.
- [Go Blog](https://go.dev/blog/) — статьи команды Go о runtime, toolchain и эволюции языка.

## Практика и инструменты

- [Go Playground](https://go.dev/play/) — быстро запустить небольшой автономный пример без локальной установки.
- [pkg.go.dev](https://pkg.go.dev/) — документация модулей и пакетов, включая версии и лицензии зависимостей.
- [Go Wiki](https://go.dev/wiki/) — подборка материалов сообщества и практик вокруг языка.
- [Awesome Go](https://github.com/avelino/awesome-go) — каталог библиотек и инструментов. Перед добавлением dependency проверяйте поддержку, security policy и необходимость для проекта.

## Книги

- Alan A. A. Donovan, Brian W. Kernighan — [The Go Programming Language](https://www.gopl.io/). Подробная книга по языку и его стандартной библиотеке.
- Jon Bodner — *Learning Go*. Современное практическое введение в язык и его идиомы.
- Katherine Cox-Buday — *Concurrency in Go*. Полезна после базовых глав о goroutine, channels и context; не начинайте с неё первый проход.

## Материалы по backend и production

- [Документация `net/http`](https://pkg.go.dev/net/http) — сервер, клиент, timeouts и transport.
- [Документация `database/sql`](https://pkg.go.dev/database/sql) — connection pool, context, transactions и правила закрытия ресурсов.
- [Документация PostgreSQL](https://www.postgresql.org/docs/) — SQL, индексы, транзакции и настройка базы.
- [OWASP API Security Top 10](https://owasp.org/API-Security/) — угрозы API: авторизация, resource limits, information disclosure и rate limiting.
- [OpenTelemetry Go](https://opentelemetry.io/docs/languages/go/) — tracing и metrics после освоения логов и HTTP context propagation.

## Как выбирать внешний материал

1. Предпочитайте официальную документацию для точного поведения языка и API.
2. Проверяйте дату публикации и совместимость с используемой версией Go.
3. Не копируйте production-рецепт без понимания его threat model, инфраструктуры и ограничений.
4. Перед добавлением библиотеки изучите документацию, лицензию, активность поддержки и alternative в standard library.
5. Закрепляйте новое знание небольшим примером, тестом или улучшением Task Manager API.
