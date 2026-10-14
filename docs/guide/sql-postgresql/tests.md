---
prev: /guide/sql-postgresql/README.md
next: /guide/sql-postgresql/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Что представляет собой *sql.DB?',
    options: [
      { text: 'Пул соединений и точку доступа к БД, а не одно готовое соединение', correct: true },
      { text: 'Одну строку результата SELECT' },
      { text: 'Только конфигурационный файл PostgreSQL' },
      { text: 'Docker-container PostgreSQL' },
    ],
  },
  {
    text: 'Как проверить доступность PostgreSQL после sql.Open?',
    options: [
      { text: 'Вызвать PingContext с ограниченным context', correct: true },
      { text: 'Считать успешный sql.Open достаточным' },
      { text: 'Открыть DBeaver' },
      { text: 'Вызвать fmt.Println(db)' },
    ],
  },
  {
    text: 'Какой драйвер используется в главе вместе с database/sql?',
    options: [
      { text: 'github.com/jackc/pgx/v5/stdlib с именем драйвера pgx', correct: true },
      { text: 'Gin' },
      { text: 'Goose как драйвер запросов' },
      { text: 'DBeaver JDBC внутри Go' },
    ],
  },
  {
    text: 'Как безопасно передать ID в PostgreSQL-запрос?',
    options: [
      { text: 'Использовать placeholder $1 и передать id отдельным аргументом', correct: true },
      { text: 'Собрать запрос через fmt.Sprintf' },
      { text: 'Добавить id к SQL через +' },
      { text: 'Передать id в комментарии SQL' },
    ],
  },
  {
    text: 'Что означает sql.ErrNoRows после QueryRowContext().Scan()?',
    options: [
      { text: 'Запрос выполнился, но подходящей строки не найдено', correct: true },
      { text: 'PostgreSQL выключен' },
      { text: 'В SQL обязательно есть инъекция' },
      { text: 'Транзакция уже зафиксирована' },
    ],
  },
  {
    text: 'Что необходимо сделать после успешного QueryContext?',
    options: [
      { text: 'Отложить rows.Close и после цикла проверить rows.Err', correct: true },
      { text: 'Сразу закрыть *sql.DB' },
      { text: 'Игнорировать rows, потому что это слайс' },
      { text: 'Вызвать os.Exit' },
    ],
  },
  {
    text: 'Для чего в Goose-миграции нужны разделы +goose Up и +goose Down?',
    options: [
      { text: 'Для применения и отката конкретного изменения схемы', correct: true },
      { text: 'Для запуска Docker-container' },
      { text: 'Для шифрования пароля БД' },
      { text: 'Для генерации Go-структур' },
    ],
  },
  {
    text: 'Когда нужна транзакция?',
    options: [
      { text: 'Когда несколько изменений должны выполниться все вместе или ни одно', correct: true },
      { text: 'Перед каждым одиночным SELECT' },
      { text: 'Только при открытии DBeaver' },
      { text: 'Вместо context.Context' },
    ],
  },
  {
    text: 'К какой базе должны обращаться интеграционные тесты?',
    options: [
      { text: 'К отдельной базе из TEST_DATABASE_URL, например task_manager_test', correct: true },
      { text: 'К production DATABASE_URL' },
      { text: 'К случайной публичной базе' },
      { text: 'К базе DBeaver без URL' },
    ],
  },
  {
    text: 'Какой hostname использует API-container для PostgreSQL из Compose?',
    options: [
      { text: 'postgres', correct: true },
      { text: 'localhost' },
      { text: 'dbeaver' },
      { text: '127.0.0.1 хоста' },
    ],
  },
]
</script>
