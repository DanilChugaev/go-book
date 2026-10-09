---
prev: /guide/pointers/README.md
next: /guide/pointers/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Что хранит указатель типа *Task?',
    options: [
      { text: 'Адрес значения типа Task', correct: true },
      { text: 'Копию всех задач' },
      { text: 'Только название задачи' },
      { text: 'Размер структуры Task' },
    ],
  },
  {
    text: 'Как получить адрес переменной task?',
    options: [
      { text: '&task', correct: true },
      { text: '*task' },
      { text: 'task&' },
      { text: 'address(task)' },
    ],
  },
  {
    text: 'Что делает *taskPointer, если taskPointer имеет тип *Task?',
    options: [
      { text: 'Даёт доступ к значению Task по адресу', correct: true },
      { text: 'Создаёт новую Task' },
      { text: 'Получает адрес указателя' },
      { text: 'Удаляет указатель' },
    ],
  },
  {
    text: 'Какое нулевое значение у указателя?',
    options: [
      { text: 'nil', correct: true },
      { text: 'false' },
      { text: '0' },
      { text: '""' },
    ],
  },
  {
    text: 'Что произойдёт при попытке разыменовать nil-указатель?',
    options: [
      { text: 'Будет panic во время выполнения', correct: true },
      { text: 'Вернётся нулевое значение' },
      { text: 'Компилятор всегда автоматически создаст значение' },
      { text: 'Указатель станет пустой структурой' },
    ],
  },
  {
    text: 'Что возвращает new(Task)?',
    options: [
      { text: 'Указатель на Task с нулевыми полями', correct: true },
      { text: 'Task с заполненными полями' },
      { text: 'Слайс Task' },
      { text: 'Map задач' },
    ],
  },
  {
    text: 'Как передать исходную переменную task в функцию, которая принимает *Task?',
    options: [
      { text: 'Передать &task', correct: true },
      { text: 'Передать *task' },
      { text: 'Передать task без изменений' },
      { text: 'Передать new(task)' },
    ],
  },
  {
    text: 'Какой получатель нужен методу Complete, который меняет поле Completed исходной задачи?',
    options: [
      { text: 'func (task *Task) Complete()', correct: true },
      { text: 'func (task Task) Complete()' },
      { text: 'func Complete(task Task)' },
      { text: 'func (*Task Complete)' },
    ],
  },
  {
    text: 'Почему вызов task.Complete() работает, если Complete имеет получатель *Task?',
    options: [
      { text: 'Компилятор берёт адрес адресуемой переменной task автоматически', correct: true },
      { text: 'Task всегда является указателем' },
      { text: 'Методы не используют получателей' },
      { text: 'Go копирует task в map' },
    ],
  },
  {
    text: 'Как обновить Task, который хранится значением в map[int]Task?',
    options: [
      { text: 'Получить Task, изменить его и присвоить обратно в map', correct: true },
      { text: 'Вызвать tasksByID[id].Complete() напрямую' },
      { text: 'Использовать append для map' },
      { text: 'Разыменовать ключ map' },
    ],
  },
]
</script>
