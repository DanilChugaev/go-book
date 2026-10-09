---
prev: /guide/maps/README.md
next: /guide/maps/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Для какой задачи лучше всего подходит map[int]string?',
    options: [
      { text: 'Хранить название задачи по её числовому ID', correct: true },
      { text: 'Хранить порядок символов в строке' },
      { text: 'Хранить только одно значение' },
      { text: 'Хранить элементы всегда в порядке добавления' },
    ],
  },
  {
    text: 'Как создать пустую map с ключами int и строковыми значениями?',
    options: [
      { text: 'make(map[int]string)', correct: true },
      { text: 'make([]int, string)' },
      { text: 'map(int, string)' },
      { text: 'new(map[int]string, 0)' },
    ],
  },
  {
    text: 'Как получить название задачи с ID 2?',
    options: [
      { text: 'taskTitles[2]', correct: true },
      { text: 'taskTitles.get(2)' },
      { text: 'taskTitles(2)' },
      { text: 'taskTitles.id(2)' },
    ],
  },
  {
    text: 'Что вернёт map[int]string при чтении отсутствующего ключа без проверки?',
    options: [
      { text: 'Пустую строку — нулевое значение string', correct: true },
      { text: 'Panic' },
      { text: 'nil' },
      { text: 'Ошибку компиляции' },
    ],
  },
  {
    text: 'Что означает второй результат exists в title, exists := taskTitles[id]?',
    options: [
      { text: 'Существует ли ключ в map', correct: true },
      { text: 'Является ли значение строкой' },
      { text: 'Количество задач' },
      { text: 'Можно ли удалить map' },
    ],
  },
  {
    text: 'Что произойдёт при taskTitles[1] = "Новое название", если ключ 1 уже есть?',
    options: [
      { text: 'Значение для ключа 1 обновится', correct: true },
      { text: 'Добавится второй элемент с ключом 1' },
      { text: 'Map станет nil' },
      { text: 'Будет ошибка компиляции' },
    ],
  },
  {
    text: 'Как удалить элемент с ключом id?',
    options: [
      { text: 'delete(taskTitles, id)', correct: true },
      { text: 'taskTitles.remove(id)' },
      { text: 'taskTitles[id] = nil' },
      { text: 'remove(taskTitles[id])' },
    ],
  },
  {
    text: 'Можно ли полагаться на порядок обхода map через range?',
    options: [
      { text: 'Нет, порядок не определён', correct: true },
      { text: 'Да, это порядок добавления' },
      { text: 'Да, ключи всегда идут по возрастанию' },
      { text: 'Только для map[int]string' },
    ],
  },
  {
    text: 'Какой тип нельзя использовать ключом map?',
    options: [
      { text: '[]string', correct: true },
      { text: 'int' },
      { text: 'string' },
      { text: 'bool' },
    ],
  },
  {
    text: 'Почему запись в var taskTitles map[int]string вызывает panic?',
    options: [
      { text: 'Map имеет значение nil и не была создана', correct: true },
      { text: 'У map не может быть ключей int' },
      { text: 'В map нельзя добавлять строки' },
      { text: 'Для записи нужно использовать copy' },
    ],
  },
]
</script>
