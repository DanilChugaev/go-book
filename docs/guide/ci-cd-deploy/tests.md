---
prev: /guide/ci-cd-deploy/README.md
next: /guide/ci-cd-deploy/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'За что отвечает CI в этой главе?',
    options: [
      { text: 'За автоматическую проверку кода, тестов, миграций и сборки образа', correct: true },
      { text: 'Только за открытие DBeaver' },
      { text: 'За хранение production-паролей в Git' },
      { text: 'Только за публикацию сайта на GitHub Pages' },
    ],
  },
  {
    text: 'Зачем после go mod tidy в CI выполняют git diff --exit-code?',
    options: [
      { text: 'Чтобы проверить, что go.mod и go.sum уже актуальны в commit', correct: true },
      { text: 'Чтобы удалить go.mod' },
      { text: 'Чтобы выполнить миграции PostgreSQL' },
      { text: 'Чтобы опубликовать Docker image' },
    ],
  },
  {
    text: 'Как в CI запускаются PostgreSQL integration-тесты?',
    options: [
      { text: 'С PostgreSQL service container и TEST_DATABASE_URL', correct: true },
      { text: 'Против production PostgreSQL' },
      { text: 'Через DBeaver на компьютере разработчика' },
      { text: 'Без PostgreSQL и миграций' },
    ],
  },
  {
    text: 'Почему integration-тестам передают -count=1?',
    options: [
      { text: 'Чтобы не использовать кэш и действительно выполнить проверки против тестовой БД', correct: true },
      { text: 'Чтобы выполнить тест ровно один раз за весь проект' },
      { text: 'Чтобы включить Docker daemon' },
      { text: 'Чтобы заменить race detector' },
    ],
  },
  {
    text: 'Какой тег образа лучше использовать для production-деплоя?',
    options: [
      { text: 'Неизменяемый SHA commit', correct: true },
      { text: 'Только latest' },
      { text: 'Тег без имени registry' },
      { text: 'Случайный локальный tag' },
    ],
  },
  {
    text: 'Какое разрешение GitHub Actions требуется для публикации образа в GHCR?',
    options: [
      { text: 'packages: write', correct: true },
      { text: 'issues: write' },
      { text: 'actions: admin' },
      { text: 'checks: none' },
    ],
  },
  {
    text: 'Почему PostgreSQL не публикуют через ports на production VPS по умолчанию?',
    options: [
      { text: 'Базе достаточно внутренней сети Compose, а открытый порт увеличивает поверхность атаки', correct: true },
      { text: 'PostgreSQL не поддерживает Docker' },
      { text: 'Так невозможно использовать volumes' },
      { text: 'API не умеет подключаться по hostname postgres' },
    ],
  },
  {
    text: 'Что должен проверить deployment после docker compose up?',
    options: [
      { text: 'Health-check API, например curl --fail /healthz', correct: true },
      { text: 'Только наличие Dockerfile' },
      { text: 'Только git status на VPS' },
      { text: 'Только открытие веб-браузера' },
    ],
  },
  {
    text: 'Почему для SSH workflow нужен заранее проверенный VPS_KNOWN_HOSTS?',
    options: [
      { text: 'Чтобы проверять подлинность VPS и не отключать защиту SSH', correct: true },
      { text: 'Чтобы Docker быстрее собирал image' },
      { text: 'Чтобы GitHub автоматически создал PostgreSQL' },
      { text: 'Чтобы скрыть health-check' },
    ],
  },
  {
    text: 'Почему откат image не всегда откатывает приложение полностью?',
    options: [
      { text: 'Схема PostgreSQL могла измениться миграцией и остаться новой', correct: true },
      { text: 'Docker не поддерживает старые теги' },
      { text: 'go test удаляет все images' },
      { text: 'GHCR не хранит историю образов' },
    ],
  },
]
</script>
