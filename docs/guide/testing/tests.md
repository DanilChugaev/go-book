---
prev: /guide/testing/README.md
next: /guide/testing/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Как должен называться файл с тестами Go?',
    options: [
      { text: 'Он должен заканчиваться на _test.go', correct: true },
      { text: 'Он должен заканчиваться на .spec.go' },
      { text: 'Он должен находиться только в папке tests' },
      { text: 'Он должен иметь расширение .test' },
    ],
  },
  {
    text: 'Какой вид имеет обычная тестовая функция?',
    options: [
      { text: 'func TestSomething(t *testing.T)', correct: true },
      { text: 'func testSomething()' },
      { text: 'test TestSomething(t)' },
      { text: 'func TestingSomething()' },
    ],
  },
  {
    text: 'Как запустить все тесты текущего модуля и вложенных пакетов?',
    options: [
      { text: 'go test ./...', correct: true },
      { text: 'go run ./...' },
      { text: 'go build test' },
      { text: 'go test all' },
    ],
  },
  {
    text: 'Когда стоит использовать t.Fatal?',
    options: [
      { text: 'Когда без успешной проверки нельзя продолжать текущий тест', correct: true },
      { text: 'Чтобы отметить любой успешный тест' },
      { text: 'Чтобы запустить следующую goroutine' },
      { text: 'Только для проверки строк' },
    ],
  },
  {
    text: 'Что делает t.Run?',
    options: [
      { text: 'Запускает именованный вложенный тест', correct: true },
      { text: 'Собирает приложение в бинарник' },
      { text: 'Запускает весь модуль повторно' },
      { text: 'Включает race detector' },
    ],
  },
  {
    text: 'Зачем нужны table-driven tests?',
    options: [
      { text: 'Чтобы проверить много похожих сценариев без дублирования теста', correct: true },
      { text: 'Чтобы хранить тесты только в map' },
      { text: 'Чтобы автоматически покрыть весь код' },
      { text: 'Чтобы не использовать t.Run' },
    ],
  },
  {
    text: 'Как проверить, что Rename вернул ErrEmptyTitle, в том числе при оборачивании ошибки?',
    options: [
      { text: 'errors.Is(err, ErrEmptyTitle)', correct: true },
      { text: 'err.Error() == "название задачи не должно быть пустым"' },
      { text: 'err == true' },
      { text: 'len(err) == 0' },
    ],
  },
  {
    text: 'Зачем в subtest обычно создают новое хранилище Store?',
    options: [
      { text: 'Чтобы сценарии не влияли на состояние друг друга', correct: true },
      { text: 'Store нельзя создать больше одного раза' },
      { text: 'Чтобы t.Run работал быстрее' },
      { text: 'Чтобы не проверять ошибки' },
    ],
  },
  {
    text: 'Что показывает команда go test -cover ./...?',
    options: [
      { text: 'Какая часть кода выполнялась во время тестов', correct: true },
      { text: 'Что все бизнес-правила точно проверены' },
      { text: 'Что в коде нет гонок данных' },
      { text: 'Список импортов проекта' },
    ],
  },
  {
    text: 'Какую команду следует использовать для тестов конкурентного кода?',
    options: [
      { text: 'go test -race ./...', correct: true },
      { text: 'go test -parallel false' },
      { text: 'go run -mutex .' },
      { text: 'go build -race' },
    ],
  },
]
</script>
