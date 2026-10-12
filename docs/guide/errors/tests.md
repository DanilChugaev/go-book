---
prev: /guide/errors/README.md
next: /guide/errors/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Какой тип обычно возвращают последним результатом функции, которая может завершиться неудачей?',
    options: [
      { text: 'error', correct: true },
      { text: 'panic' },
      { text: 'bool всегда' },
      { text: 'string всегда' },
    ],
  },
  {
    text: 'Какое значение error означает успешное выполнение операции?',
    options: [
      { text: 'nil', correct: true },
      { text: 'true' },
      { text: '""' },
      { text: '0' },
    ],
  },
  {
    text: 'Как создать простую ошибку с постоянным сообщением?',
    options: [
      { text: 'errors.New("сообщение")', correct: true },
      { text: 'error.New("сообщение")' },
      { text: 'new(error, "сообщение")' },
      { text: 'panic("сообщение")' },
    ],
  },
  {
    text: 'Какой паттерн используют сразу после вызова функции, возвращающей error?',
    options: [
      { text: 'if err != nil { ... }', correct: true },
      { text: 'if err == false { ... }' },
      { text: 'if error { ... }' },
      { text: 'switch nil { ... }' },
    ],
  },
  {
    text: 'Что делает return внутри ветви обработки ошибки?',
    options: [
      { text: 'Завершает текущую функцию и не даёт продолжить успешный путь', correct: true },
      { text: 'Повторяет вызов функции' },
      { text: 'Удаляет ошибку' },
      { text: 'Всегда завершает всю программу' },
    ],
  },
  {
    text: 'Как добавить контекст к ошибке и сохранить её для errors.Is?',
    options: [
      { text: 'fmt.Errorf("контекст: %w", err)', correct: true },
      { text: 'fmt.Printf("контекст: %w", err)' },
      { text: 'errors.New("контекст: %w")' },
      { text: 'fmt.Errorf("контекст: %v", err)' },
    ],
  },
  {
    text: 'Зачем используют errors.Is(err, ErrEmptyTitle)?',
    options: [
      { text: 'Чтобы проверить известную причину, включая обёрнутую ошибку', correct: true },
      { text: 'Чтобы вывести текст ошибки в терминал' },
      { text: 'Чтобы создать новую ошибку' },
      { text: 'Чтобы превратить error в string' },
    ],
  },
  {
    text: 'Почему не стоит сравнивать err.Error() с текстом?',
    options: [
      { text: 'Текст предназначен для человека и может измениться', correct: true },
      { text: 'У error нет метода Error' },
      { text: 'Строки нельзя сравнивать в Go' },
      { text: 'errors.Is работает только с числами' },
    ],
  },
  {
    text: 'Что должен вернуть Rename при успешном переименовании?',
    options: [
      { text: 'nil', correct: true },
      { text: 'ErrEmptyTitle' },
      { text: 'false' },
      { text: 'panic' },
    ],
  },
  {
    text: 'Почему пустое название задачи не стоит обрабатывать через panic?',
    options: [
      { text: 'Это ожидаемая ошибка ввода, которую вызывающий код может обработать', correct: true },
      { text: 'panic нельзя вызывать в Go' },
      { text: 'panic возвращает nil' },
      { text: 'Пустые строки автоматически становятся корректными' },
    ],
  },
]
</script>
