---
prev: /guide/structs/README.md
next: /guide/structs/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Что описывает struct в Go?',
    options: [
      { text: 'Тип с именованными полями', correct: true },
      { text: 'Цикл с условием' },
      { text: 'Только список строк' },
      { text: 'Пакет стандартной библиотеки' },
    ],
  },
  {
    text: 'Как правильно объявить тип Task с полем Title string?',
    options: [
      { text: 'type Task struct { Title string }', correct: true },
      { text: 'struct Task { string Title }' },
      { text: 'type Task = { Title: string }' },
      { text: 'task Task struct { Title string }' },
    ],
  },
  {
    text: 'Какой способ создания структуры предпочтительнее?',
    options: [
      { text: 'Task{ID: 1, Title: "Купить молоко", Priority: 2}', correct: true },
      { text: 'Task{1, "Купить молоко", 2, false}' },
      { text: 'Task("Купить молоко")' },
      { text: 'new Task(1, "Купить молоко")' },
    ],
  },
  {
    text: 'Как получить значение поля Title у переменной task?',
    options: [
      { text: 'task.Title', correct: true },
      { text: 'task["Title"]' },
      { text: 'task->Title' },
      { text: 'Title(task)' },
    ],
  },
  {
    text: 'Какое нулевое значение у поля Completed типа bool?',
    options: [
      { text: 'false', correct: true },
      { text: 'true' },
      { text: 'nil' },
      { text: 'Ошибка компиляции' },
    ],
  },
  {
    text: 'Что происходит при copyOfTask := original, если оба значения имеют тип Task?',
    options: [
      { text: 'Копируются поля структуры', correct: true },
      { text: 'copyOfTask всегда указывает на original' },
      { text: 'Создаётся map' },
      { text: 'original удаляется' },
    ],
  },
  {
    text: 'Почему task.Completed = true внутри for _, task := range tasks не изменяет элементы слайса?',
    options: [
      { text: 'task — копия текущей структуры', correct: true },
      { text: 'Поле Completed нельзя изменять' },
      { text: 'range работает только со строками' },
      { text: 'Слайс всегда неизменяем' },
    ],
  },
  {
    text: 'Как изменить Completed у всех задач слайса?',
    options: [
      { text: 'for index := range tasks { tasks[index].Completed = true }', correct: true },
      { text: 'for _, task := range tasks { task.Completed = true }' },
      { text: 'tasks.Completed = true' },
      { text: 'append(tasks, Completed: true)' },
    ],
  },
  {
    text: 'Почему нельзя написать tasksByID[1].Completed = true для map[int]Task?',
    options: [
      { text: 'Map возвращает копию структуры, которую нельзя изменить через поле напрямую', correct: true },
      { text: 'Map не может хранить структуры' },
      { text: 'Ключ 1 запрещён' },
      { text: 'Поле Completed доступно только в слайсах' },
    ],
  },
  {
    text: 'Как правильно обновить Completed у Task в map?',
    options: [
      { text: 'Получить Task, изменить поле и присвоить Task обратно в map', correct: true },
      { text: 'Вызвать delete, затем читать map' },
      { text: 'Использовать append для map' },
      { text: 'Изменить ключ структуры' },
    ],
  },
]
</script>
