---
prev: /guide/final-integration/README.md
next: /guide/final-integration/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Какое направление зависимостей сохраняет итоговая архитектура?',
    options: [
      { text: 'Gin handler → service → интерфейс repository → PostgreSQL-реализация', correct: true },
      { text: 'PostgreSQL repository → Gin handler → service' },
      { text: 'Task напрямую импортирует Gin и Resty' },
      { text: 'DBeaver вызывает HTTP handler' },
    ],
  },
  {
    text: 'Что должен содержать README, чтобы другой разработчик запустил API?',
    options: [
      { text: 'Требования, конфигурацию, команды запуска, миграций, проверок и API-примеры', correct: true },
      { text: 'Только название проекта' },
      { text: 'Пароли production-базы' },
      { text: 'Только скриншот DBeaver' },
    ],
  },
  {
    text: 'Какой статус успешного DELETE без response body?',
    options: [
      { text: '204 No Content', correct: true },
      { text: '201 Created' },
      { text: '400 Bad Request' },
      { text: '500 Internal Server Error' },
    ],
  },
  {
    text: 'Что нельзя делать после ответа 204 No Content?',
    options: [
      { text: 'Пытаться декодировать обещанный JSON-body, которого нет', correct: true },
      { text: 'Проверить HTTP-статус' },
      { text: 'Завершить curl-команду' },
      { text: 'Логировать факт удаления на сервере' },
    ],
  },
  {
    text: 'Почему DBeaver не заменяет Goose-миграции?',
    options: [
      { text: 'Ручное изменение через UI не хранится в Git и не воспроизводится в других средах', correct: true },
      { text: 'DBeaver не умеет подключаться к PostgreSQL' },
      { text: 'Goose не работает с SQL' },
      { text: 'Миграции нужны только в браузере' },
    ],
  },
  {
    text: 'Какой образ нужно передавать в production deployment?',
    options: [
      { text: 'Immutable image с SHA commit', correct: true },
      { text: 'Только latest' },
      { text: 'Локальный image без registry' },
      { text: 'Image без тега' },
    ],
  },
  {
    text: 'Какую базу должны использовать destructive PostgreSQL integration-тесты?',
    options: [
      { text: 'Отдельную test-БД из TEST_DATABASE_URL', correct: true },
      { text: 'Development DATABASE_URL' },
      { text: 'Production database' },
      { text: 'Базу, выбранную в DBeaver вручную' },
    ],
  },
  {
    text: 'Что должно произойти после deployment?',
    options: [
      { text: 'Проверка /healthz и сохранение информации о рабочем SHA для rollback', correct: true },
      { text: 'Удаление PostgreSQL volume' },
      { text: 'Публикация .env в Git' },
      { text: 'Отключение CI' },
    ],
  },
  {
    text: 'Почему фильтр и сортировку нельзя без проверки подставлять в SQL?',
    options: [
      { text: 'Имена SQL-столбцов и направления сортировки нужно выбирать из whitelist', correct: true },
      { text: 'PostgreSQL запрещает ORDER BY' },
      { text: 'Параметры $1 работают для имён столбцов' },
      { text: 'Gin автоматически делает это безопасным' },
    ],
  },
  {
    text: 'Какой подход лучше для дальнейшего развития Task Manager?',
    options: [
      { text: 'Выбирать одно обоснованное улучшение и сначала проектировать контракт, миграции, тесты и наблюдаемость', correct: true },
      { text: 'Добавить все возможные функции в одном commit' },
      { text: 'Сразу удалить unit-тесты' },
      { text: 'Заменить PostgreSQL на ручной JSON без причины' },
    ],
  },
]
</script>
