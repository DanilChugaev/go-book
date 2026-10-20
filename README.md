# Учебник Go

[![Проверка документации](https://github.com/DanilChugaev/go-book/actions/workflows/verify.yml/badge.svg)](https://github.com/DanilChugaev/go-book/actions/workflows/verify.yml)
[![Деплой на GitHub Pages](https://github.com/DanilChugaev/go-book/actions/workflows/deploy.yml/badge.svg)](https://github.com/DanilChugaev/go-book/actions/workflows/deploy.yml)
[![Лицензия: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Интерактивный русскоязычный учебник по Go: от первой программы до backend-проекта **Task Manager API** с Gin, PostgreSQL, Docker и CI/CD.

**Сайт:** [danilchugaev.github.io/go-book](https://danilchugaev.github.io/go-book/)

## Что внутри

Основной маршрут состоит из 35 последовательных глав:

- основы Go: типы, строки, функции, слайсы, `map`, структуры, методы, указатели и интерфейсы;
- ошибки, пакеты, модули, тесты, файлы, JSON и время;
- конкурентный код: goroutine, каналы, `select`, mutex и `context`;
- backend: `net/http`, Gin, логи, HTTP-клиенты на `http.Client` и Resty;
- production-подготовка: конфигурация, graceful shutdown, Docker Compose, PostgreSQL, Goose, DBeaver, GitHub Actions и базовый деплой.

В каждой законченной главе есть теория, самопроверка, задания с критериями и скрытыми решениями, а также рекомендации по коду. После основного маршрута запланирован продвинутый блок: ошибки и ресурсы, generics, конкурентные паттерны и производительность.

Подробная программа — в [содержании учебника](docs/guide/content.md).

## Возможности сайта

- русскоязычная навигация по главам;
- квизы с сохранением ответов в `localStorage`;
- примеры с копированием и переходом в Go Playground;
- полная PDF-версия учебника, сформированная вместе с сайтом;
- адаптивная версия;
- PWA: сайт можно установить как приложение на телефон или компьютер и читать закэшированные материалы офлайн.

## Быстрый старт для читателя

Откройте [учебник](https://danilchugaev.github.io/go-book/) и начните с [предисловия](https://danilchugaev.github.io/go-book/guide/).

Для практики по Go понадобятся Go, редактор кода и терминал. В инфраструктурных главах понадобятся Docker Desktop или Docker Engine с Docker Compose; DBeaver опционален для изучения PostgreSQL.

## Локальный запуск сайта

### Требования

- Node.js LTS;
- npm, входящий в Node.js.

Репозиторий использует `package-lock.json`, поэтому для воспроизводимой установки зависимостей используйте `npm ci`.

```bash
git clone https://github.com/DanilChugaev/go-book.git
cd go-book
npm ci
npm run docs:dev
```

Сайт откроется по адресу [http://localhost:6060/go-book/](http://localhost:6060/go-book/).

### Сборка production-версии

```bash
npm run docs:build
```

Результат создаётся в `docs/.vuepress/dist/`. Эта директория генерируется автоматически и не должна редактироваться вручную.

## Основные команды

| Команда | Назначение |
| --- | --- |
| `npm ci` | Установить зависимости по `package-lock.json` |
| `npm run docs:dev` | Запустить сайт на порту `6060` |
| `npm run docs:clean-dev` | Запустить сайт с очисткой кэша VuePress |
| `npm run docs:build` | Собрать статическую production-версию |
| `npm run book:build` | Локально собрать сайт и полную PDF-версию в `docs/.vuepress/public/go-book.pdf` |
| `npm run verify` | Запустить тесты, собрать и проверить сайт и PDF |
| `npm run docs:update-package` | Запустить VuePress updater; перед применением проверьте diff |

## Структура репозитория

```text
.
├── docs/
│   ├── README.md                    # главная страница сайта
│   ├── guide/                       # главы учебника и программа
│   └── .vuepress/                   # VuePress, компоненты и PWA
├── examples/                         # полные исходники к практическим заданиям
├── .github/
│   ├── workflows/                   # CI и GitHub Pages deploy
│   └── ISSUE_TEMPLATE/              # шаблоны обратной связи
├── CONTRIBUTING.md                  # правила вклада
├── CODE_OF_CONDUCT.md               # правила сообщества
├── SECURITY.md                      # политика сообщения об уязвимостях
├── LICENSE                          # MIT License
├── package.json
└── package-lock.json
```

## PWA и GitHub Pages

Сайт публикуется в подпути `/go-book/`; manifest и service worker настроены для этого адреса. После обновления production-сайта браузер может предложить обновить установленное приложение.

- **Android / Chrome:** «Установить приложение» или «Добавить на главный экран».
- **iOS / Safari:** «Поделиться» → «На экран „Домой“».
- **Chrome / Edge на компьютере:** кнопка установки в адресной строке.

Если PWA показывает старую версию, в DevTools откройте **Application** → **Service Workers**, unregister старый worker, очистите site data и загрузите сайт заново.

## Как внести вклад

Вклад приветствуется: исправления фактов, опечаток и ссылок, улучшения объяснений и упражнений, воспроизводимые примеры и предложения по программе.

Перед началом прочитайте:

- [CONTRIBUTING.md](CONTRIBUTING.md) — процесс работы, стиль и проверки;
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — правила общения;
- [SECURITY.md](SECURITY.md) — сообщение о чувствительных проблемах.

Коротко:

1. Найдите существующий issue или создайте новый через шаблон.
2. Сделайте небольшую самостоятельную ветку от `master`.
3. Проверьте изменения командами `npm run docs:build` и `git diff --check`.
4. Откройте pull request с понятным описанием, ссылками на страницы и результатом проверки.

Не добавляйте secrets, `.env`, сгенерированный `docs/.vuepress/dist/` или изменения в `node_modules`.

## Обратная связь и поддержка

- Ошибка в уроке или нерабочий пример — [создайте issue](https://github.com/DanilChugaev/go-book/issues/new/choose).
- Идея новой темы или улучшения — [создайте feature request](https://github.com/DanilChugaev/go-book/issues/new/choose).
- Уязвимость или чувствительная проблема — следуйте [политике безопасности](SECURITY.md), не публикуйте детали в открытом issue.

Для исполняемых примеров указывайте ссылку на страницу, версию Go, ОС, команду запуска, ожидаемый и фактический результат.

## Лицензия

Исходный код и учебные материалы распространяются по лицензии [MIT](LICENSE). При использовании или распространении сохраняйте уведомление об авторских правах и текст лицензии.

## Благодарности

Для точных деталей языка и библиотек сверяйтесь с [go.dev/doc](https://go.dev/doc/), [спецификацией Go](https://go.dev/ref/spec) и официальной документацией используемых инструментов.

Go is a trademark of Google LLC.
