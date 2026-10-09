---
prev: /guide/slices-and-arrays/README.md
next: /guide/slices-and-arrays/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Чем массив отличается от слайса?',
    options: [
      { text: 'Размер массива является частью его типа, а длина слайса может меняться', correct: true },
      { text: 'Массив хранит только числа, а слайс — только строки' },
      { text: 'Массив нельзя обходить в цикле' },
      { text: 'Слайс всегда содержит ровно три элемента' },
    ],
  },
  {
    text: 'Какой тип у литерала []string{"Купить молоко"}?',
    options: [
      { text: 'Слайс строк', correct: true },
      { text: 'Массив строк с одним элементом' },
      { text: 'Одна строка' },
      { text: 'Map строк' },
    ],
  },
  {
    text: 'Какой индекс имеет первый элемент слайса?',
    options: [
      { text: '0', correct: true },
      { text: '1' },
      { text: '-1' },
      { text: 'Зависит от длины слайса' },
    ],
  },
  {
    text: 'Что возвращает len(titles)?',
    options: [
      { text: 'Количество элементов слайса', correct: true },
      { text: 'Вместимость слайса' },
      { text: 'Последний индекс' },
      { text: 'Размер одного элемента в байтах' },
    ],
  },
  {
    text: 'Что нужно сделать с результатом append?',
    options: [
      { text: 'Присвоить его обратно слайсу', correct: true },
      { text: 'Передать в len' },
      { text: 'Удалить через delete' },
      { text: 'Ничего: append всегда меняет переменную сам' },
    ],
  },
  {
    text: 'Как создать пустой слайс строк с вместимостью 5?',
    options: [
      { text: 'make([]string, 0, 5)', correct: true },
      { text: 'make([]string, 5)' },
      { text: '[5]string{}' },
      { text: 'make(string, 0, 5)' },
    ],
  },
  {
    text: 'Что означает titles[1:3]?',
    options: [
      { text: 'Элементы с индексами 1 и 2', correct: true },
      { text: 'Элементы с индексами 1, 2 и 3' },
      { text: 'Только элемент с индексом 3' },
      { text: 'Удаление элементов 1 и 3' },
    ],
  },
  {
    text: 'Как безопасно проверить, существует ли index в слайсе titles?',
    options: [
      { text: 'index >= 0 && index < len(titles)', correct: true },
      { text: 'index <= len(titles)' },
      { text: 'index > 0 && index <= cap(titles)' },
      { text: 'titles[index] != nil' },
    ],
  },
  {
    text: 'Что произойдёт при backup := titles; backup[0] = "Новая задача"?',
    options: [
      { text: 'Первый элемент titles тоже изменится', correct: true },
      { text: 'Создастся независимая копия' },
      { text: 'Будет ошибка компиляции' },
      { text: 'Изменится только длина titles' },
    ],
  },
  {
    text: 'Какой результат даёт range по слайсу?',
    options: [
      { text: 'Индекс и значение элемента', correct: true },
      { text: 'Только вместимость и длину' },
      { text: 'Ключ и значение map' },
      { text: 'Только число элементов' },
    ],
  },
]
</script>
