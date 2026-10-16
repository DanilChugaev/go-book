---
prev: /guide/advanced-performance/benchmarks.md
next: /guide/advanced-performance/allocations-optimization.md
---

# CPU, память и `pprof`

Benchmark говорит, **насколько** изменилась одна операция. `pprof` помогает понять, **где** расходуются CPU и память. Профиль — статистическая выборка или снимок, а не абсолютная трассировка каждого вызова, поэтому интерпретируйте его вместе со сценарием и benchmark.

## CPU profile из benchmark

Для CPU profile лучше выбрать один репрезентативный benchmark и достаточную длительность:

```bash
go test -run '^$' -bench '^BenchmarkBuildExportBuilder$' \
  -benchtime=3s -cpuprofile=cpu.out ./internal/export

go tool pprof cpu.out
```

`-benchtime=3s` даёт profiler больше выборок, чем очень короткий запуск. Не сравнивайте profile, снятые с разных входных данных или разных benchmark: сначала зафиксируйте сценарий.

В интерактивном режиме начните с:

```text
(pprof) top
(pprof) top -cum
(pprof) list buildExportBuilder
```

- `top` показывает flat time: время непосредственно в функции;
- `top -cum` показывает cumulative time: функция плюс вызванный ею код;
- `list name` показывает строки исходника с затратами рядом.

Если большая доля находится в `runtime`, это не автоматически дефект runtime. Часто причина выше по стеку: много аллокаций создают GC work, блокировки дают scheduler overhead, а форматирование вызывает reflection/конверсии. Поднимайтесь по callers и проверяйте гипотезу.

## Heap profile: выделено или удерживается?

Память можно смотреть с разными вопросами:

- **alloc space / alloc objects** — сколько всего выделила операция за период; полезно для allocation rate;
- **inuse space / inuse objects** — что остаётся живым в heap на момент профиля; полезно для роста памяти и утечек.

Снять heap profile из теста/benchmark:

```bash
go test -run '^$' -bench '^BenchmarkBuildExportBuilder$' \
  -benchtime=3s -memprofile=mem.out ./internal/export

go tool pprof -alloc_space mem.out
go tool pprof -inuse_space mem.out
```

Внутри `pprof` можно сменить sample type:

```text
(pprof) sample_index=alloc_space
(pprof) top
(pprof) list buildExportBuilder
```

Высокий `alloc_space` не равен утечке: короткоживущие объекты могут активно выделяться и освобождаться. Высокий и растущий `inuse_space` после GC — повод искать удерживающие ссылки, кэш без ограничения, глобальную map или goroutine, которая держит данные.

## Сравнение профилей

Снимите профиль до и после изменения в одинаковом сценарии. Для сравнения используйте `-base`:

```bash
go tool pprof -base old.mem new.mem
```

Положительные значения показывают рост относительно baseline, отрицательные — уменьшение. Это полезнее, чем смотреть два `top` глазами, но не отменяет проверку того, что оба файла получены одинаковыми командами и на сходном объёме работы.

Для CPU profiles также можно передать `-base`, однако различия профилей чувствительны к шуму. Сопроводите изменение benchmark-серией и `benchstat`.

## Веб-интерфейс и граф вызовов

Из интерактивного `pprof`:

```text
(pprof) web
```

Команда строит граф вызовов и обычно требует Graphviz (`dot`). Альтернатива — локальный web UI:

```bash
go tool pprof -http=:0 cpu.out
```

Инструмент выберет свободный порт и напечатает URL. В UI можно увидеть graph, flame graph, source и top. Профиль может содержать внутренние имена пакетов и пути, поэтому не публикуйте его в открытом issue или репозитории без проверки.

## Runtime endpoint `net/http/pprof`

Для работающего процесса пакет `net/http/pprof` регистрирует debug endpoints в `DefaultServeMux` через blank import:

```go
import _ "net/http/pprof"
```

В приложении с отдельным debug-сервером лучше не использовать основной public router. Ограничьте доступ loopback-адресом или внутренней сетью:

```go
func startDebugServer() *http.Server {
	server := &http.Server{
		Addr:              "127.0.0.1:6060",
		Handler:           http.DefaultServeMux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("debug-сервер завершился", "err", err)
		}
	}()

	return server
}
```

Снять 30-секундный CPU profile:

```bash
go tool pprof http://127.0.0.1:6060/debug/pprof/profile?seconds=30
```

Посмотреть heap:

```bash
go tool pprof http://127.0.0.1:6060/debug/pprof/heap
```

Другие полезные endpoints: `/debug/pprof/goroutine`, `/debug/pprof/block`, `/debug/pprof/mutex`. Block/mutex profiles нужно включать и интерпретировать осторожно; они добавляют overhead и полезны только при гипотезе о contention.

::: danger Не открывайте pprof в публичный интернет
Pprof раскрывает структуру программы, package paths, stack traces и потенциально данные в аргументах. Не подключайте `net/http/pprof` к публичному Gin router, не публикуйте порт Docker без ограничения и не полагайтесь только на «сложный URL». Доступ должен ограничиваться сетью и политикой инфраструктуры.
:::

## CPU профиль реального HTTP endpoint

Для HTTP API есть два разных шага:

1. нагрузчик создаёт воспроизводимый поток запросов с тем же payload, auth и concurrency, что интересует вас;
2. pprof снимается во время стабильной нагрузки.

Не снимайте CPU profile с простаивающего API: он покажет idle runtime, а не стоимость endpoint. Также не делайте вывод по одному «самому медленному» запросу: warm-up, connection establishment и cache miss могут быть отдельными явлениями.

## Полезные вопросы к profile

Вместо «какую строку оптимизировать?» спрашивайте:

- какая функция имеет большой cumulative cost в пути endpoint?
- почему она вызывается столько раз?
- это CPU, allocations/GC, блокировка или I/O wait?
- есть ли более высокий уровень, где можно сократить количество работы?
- изменится ли публичный контракт, порядок, memory ownership или error handling?

Например, profile может показать много времени в сортировке. Не обязательно менять алгоритм: возможно, endpoint сортирует 50 000 задач, хотя пользователю нужна пагинация и фильтр на уровне SQL. Производительная архитектура часто сокращает работу, а не ускоряет каждую локальную операцию.

Следующая страница разберёт аллокации и несколько часто предлагаемых оптимизаций — с условиями, при которых они действительно оправданы.
