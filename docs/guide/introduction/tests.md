---
prev: /guide/introduction/first-program.md
next: /guide/introduction/practice.md
---

# Самопроверка

Ответьте на вопросы после первой главы. Если ответ оказался неверным, вернитесь к соответствующему разделу и запустите пример ещё раз.

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Какой командой можно проверить, что Go установлен и доступен в терминале?',
    options: [
      { text: 'go install' },
      { text: 'go version', correct: true },
      { text: 'go init' },
      { text: 'go start' },
    ],
  },
  {
    text: 'Что создаёт команда go mod init example.com/hello-go?',
    options: [
      { text: 'Исполняемый файл программы' },
      { text: 'Файл go.mod для Go-модуля', correct: true },
      { text: 'Только файл main.go' },
      { text: 'Базу данных проекта' },
    ],
  },
  {
    text: 'Какую команду стоит использовать для запуска всего пакета в текущей папке?',
    options: [
      { text: 'go run .', correct: true },
      { text: 'go execute .' },
      { text: 'go build main.go' },
      { text: 'go fmt .' },
    ],
  },
  {
    text: 'Зачем в исполняемой Go-программе нужен package main?',
    options: [
      { text: 'Он подключает пакет fmt' },
      { text: 'Он обозначает пакет исполняемой программы', correct: true },
      { text: 'Он создаёт новую переменную' },
      { text: 'Он включает сборщик мусора' },
    ],
  },
  {
    text: 'Что делает import "fmt"?',
    options: [
      { text: 'Подключает пакет стандартной библиотеки для форматированного ввода и вывода', correct: true },
      { text: 'Создаёт файл go.mod' },
      { text: 'Объявляет функцию main' },
      { text: 'Компилирует программу' },
    ],
  },
  {
    text: 'Какая функция является точкой входа исполняемой программы на Go?',
    options: [
      { text: 'func start()' },
      { text: 'func run()' },
      { text: 'func main()', correct: true },
      { text: 'func initModule()' },
    ],
  },
  {
    text: 'Для чего используется команда gofmt -w main.go?',
    options: [
      { text: 'Для загрузки зависимостей' },
      { text: 'Для форматирования Go-файлов в текущей папке', correct: true },
      { text: 'Для удаления модуля' },
      { text: 'Для запуска HTTP-сервера' },
    ],
  },
]
</script>
