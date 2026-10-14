---
prev: /guide/docker/README.md
next: /guide/docker/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Чем container отличается от image?',
    options: [
      { text: 'Image — шаблон, container — его запущенный экземпляр', correct: true },
      { text: 'Это два названия одного файла' },
      { text: 'Container существует только для PostgreSQL' },
      { text: 'Image всегда хранит данные базы' },
    ],
  },
  {
    text: 'Зачем в Go Dockerfile используют multi-stage build?',
    options: [
      { text: 'Чтобы оставить компилятор в build-стадии, а в final image скопировать только бинарник', correct: true },
      { text: 'Чтобы каждый запрос запускал две копии API' },
      { text: 'Чтобы не использовать go.mod' },
      { text: 'Чтобы открыть PostgreSQL в интернете' },
    ],
  },
  {
    text: 'Что делает .dockerignore?',
    options: [
      { text: 'Исключает файлы из Docker build context', correct: true },
      { text: 'Удаляет файлы из Git-репозитория' },
      { text: 'Останавливает container' },
      { text: 'Шифрует secrets' },
    ],
  },
  {
    text: 'Как API-container обращается к PostgreSQL внутри Compose?',
    options: [
      { text: 'По hostname postgres и порту 5432', correct: true },
      { text: 'По localhost:5432' },
      { text: 'По IP Docker Desktop из браузера' },
      { text: 'Через порт API 8080' },
    ],
  },
  {
    text: 'Для чего нужен named volume postgres-data?',
    options: [
      { text: 'Чтобы данные PostgreSQL переживали пересоздание container', correct: true },
      { text: 'Чтобы пересылать HTTP-логи в браузер' },
      { text: 'Чтобы заменить Dockerfile' },
      { text: 'Чтобы открыть порт 5432 наружу' },
    ],
  },
  {
    text: 'Что удалит docker compose down -v?',
    options: [
      { text: 'Containers, сеть и named volumes, включая данные локальной БД', correct: true },
      { text: 'Только логи API' },
      { text: 'Только source code проекта' },
      { text: 'Ничего: это команда просмотра' },
    ],
  },
  {
    text: 'Почему в health-check PostgreSQL используют $$POSTGRES_USER?',
    options: [
      { text: 'Чтобы Compose передал переменную внутрь container, а не подставил её на хосте', correct: true },
      { text: 'Чтобы пароль стал сильнее' },
      { text: 'Чтобы Docker удалил volume' },
      { text: 'Это синтаксис Go' },
    ],
  },
  {
    text: 'Для чего PostgreSQL-порт привязан к 127.0.0.1?',
    options: [
      { text: 'Чтобы DBeaver на этом компьютере мог подключиться, но БД не слушала внешнюю сеть', correct: true },
      { text: 'Чтобы API не мог подключиться к БД' },
      { text: 'Чтобы volume не создавался' },
      { text: 'Чтобы включить production mode' },
    ],
  },
  {
    text: 'Какая команда показывает итоговую Compose-конфигурацию после подстановки env?',
    options: [
      { text: 'docker compose config', correct: true },
      { text: 'docker compose down -v' },
      { text: 'go mod tidy' },
      { text: 'curl /healthz' },
    ],
  },
  {
    text: 'Подключается ли API к PostgreSQL в этой главе?',
    options: [
      { text: 'Нет, PostgreSQL готовит инфраструктуру для следующей SQL-главы', correct: true },
      { text: 'Да, здесь уже реализован полный CRUD через database/sql' },
      { text: 'Да, но только через DBeaver' },
      { text: 'PostgreSQL вообще не запускается' },
    ],
  },
]
</script>
