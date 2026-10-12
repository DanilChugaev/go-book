---
prev: /guide/strings/README.md
next: /guide/strings/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Что возвращает len("Привет")?',
    options: [
      { text: 'Количество байтов: 12', correct: true },
      { text: 'Количество рун: 6' },
      { text: 'Всегда 0 для кириллицы' },
      { text: 'Ошибку компиляции' },
    ],
  },
  {
    text: 'Как посчитать количество рун в строке?',
    options: [
      { text: 'utf8.RuneCountInString(title)', correct: true },
      { text: 'len(title)' },
      { text: 'strings.Count(title)' },
      { text: 'int(title)' },
    ],
  },
  {
    text: 'Что делает strings.TrimSpace?',
    options: [
      { text: 'Удаляет пробельные символы в начале и конце строки', correct: true },
      { text: 'Удаляет все пробелы внутри строки' },
      { text: 'Переводит строку в нижний регистр' },
      { text: 'Считает количество символов' },
    ],
  },
  {
    text: 'Как выполнить поиск подстроки без учёта регистра?',
    options: [
      { text: 'Привести строку и подстроку к одному регистру через strings.ToLower', correct: true },
      { text: 'Использовать только len' },
      { text: 'Преобразовать строку в int' },
      { text: 'Вызвать time.Parse' },
    ],
  },
  {
    text: 'Что делает strings.HasPrefix(title, "Купить")?',
    options: [
      { text: 'Проверяет, начинается ли строка с указанного текста', correct: true },
      { text: 'Проверяет, заканчивается ли строка указанным текстом' },
      { text: 'Удаляет указанный текст из начала строки' },
      { text: 'Считает число слов в строке' },
    ],
  },
  {
    text: 'Что возвращает strings.ToUpper("задача")?',
    options: [
      { text: 'Новую строку "ЗАДАЧА"', correct: true },
      { text: 'Изменяет исходную строку на месте' },
      { text: 'Число заглавных букв' },
      { text: 'Слайс рун' },
    ],
  },
  {
    text: 'Что нужно использовать, если требуется обойти строку по Unicode-символам?',
    options: [
      { text: 'Цикл for range, который будет разобран позже в главе о циклах', correct: true },
      { text: 'Обычный доступ title[index] для всех языков' },
      { text: 'Только strings.TrimSpace' },
      { text: 'Преобразование строки в bool' },
    ],
  },
  {
    text: 'Можно ли изменить один символ строки через title[0] = \'П\'?',
    options: [
      { text: 'Нет, строки неизменяемы', correct: true },
      { text: 'Да, если строка содержит кириллицу' },
      { text: 'Да, после strings.TrimSpace' },
      { text: 'Только с типом byte' },
    ],
  },
  {
    text: 'Почему strings.TrimSpace("   ") полезен перед валидацией названия?',
    options: [
      { text: 'Он превращает строку из пробелов в пустую строку', correct: true },
      { text: 'Он создаёт JSON-представление строки' },
      { text: 'Он автоматически добавляет название в Task' },
      { text: 'Он заменяет все внутренние пробелы на запятые' },
    ],
  },
  {
    text: 'Почему строку из пробелов нужно сначала обработать TrimSpace, а потом валидировать?',
    options: [
      { text: 'После TrimSpace она станет пустой и корректно не пройдёт проверку', correct: true },
      { text: 'Иначе Go не скомпилирует строку' },
      { text: 'TrimSpace автоматически записывает строку в JSON' },
      { text: 'len не работает без TrimSpace' },
    ],
  },
]
</script>
