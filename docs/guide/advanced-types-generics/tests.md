---
prev: /guide/advanced-types-generics/generic-types-design.md
next: /guide/advanced-types-generics/practice.md
---

# Самопроверка: типы и generics

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Что создаёт объявление type TaskID int64?',
    options: [
      { text: 'Новый defined type с underlying type int64', correct: true },
      { text: 'Только второе имя встроенного int64' },
      { text: 'Интерфейс для всех числовых значений' },
      { text: 'Generic-тип без параметров' },
    ],
  },
  {
    text: 'Чем type LegacyTaskID = int64 отличается от type TaskID int64?',
    options: [
      { text: 'Alias не создаёт новый тип и совместим с int64 без преобразования', correct: true },
      { text: 'Alias запрещает хранить отрицательные значения' },
      { text: 'Alias автоматически добавляет методы int64' },
      { text: 'Alias можно использовать только внутри generic-функций' },
    ],
  },
  {
    text: 'Почему type TaskID int64 может быть полезен в доменном коде?',
    options: [
      { text: 'Компилятор не даст случайно передать UserID вместо TaskID', correct: true },
      { text: 'Он автоматически проверяет наличие задачи в PostgreSQL' },
      { text: 'Он превращает JSON-строку в число без ошибки' },
      { text: 'Он отменяет необходимость валидировать ID из HTTP-запроса' },
    ],
  },
  {
    text: 'Какой constraint нужен функции Contains, которая сравнивает элементы через ==?',
    options: [
      { text: 'comparable', correct: true },
      { text: 'any' },
      { text: 'error' },
      { text: 'nil' },
    ],
  },
  {
    text: 'Какой тип нельзя подставить вместо T comparable?',
    options: [
      { text: '[]string', correct: true },
      { text: 'string' },
      { text: 'TaskID с underlying type int64' },
      { text: 'struct с полями int и bool' },
    ],
  },
  {
    text: 'Что сохраняет T any в функции First[T any]([]T) (T, bool) по сравнению с параметром any?',
    options: [
      { text: 'Конкретный тип результата для каждого вызова', correct: true },
      { text: 'Возможность сравнивать любые значения через ==' },
      { text: 'Автоматическое JSON-кодирование' },
      { text: 'Обязательную проверку nil для любого T' },
    ],
  },
  {
    text: 'Что означает ~int в constraint?',
    options: [
      { text: 'int и defined types с underlying type int', correct: true },
      { text: 'Любое целое и дробное число' },
      { text: 'Только встроенный int' },
      { text: 'Тип, который может быть nil' },
    ],
  },
  {
    text: 'Подойдёт ли type RetryCount int для функции Double[T ~int](value T) T?',
    options: [
      { text: 'Да, потому что underlying type RetryCount — int', correct: true },
      { text: 'Нет, потому что defined types нельзя передавать в generic-код' },
      { text: 'Только после преобразования RetryCount в string' },
      { text: 'Только если RetryCount реализует error' },
    ],
  },
  {
    text: 'Почему interface с type term ~string нельзя объявить как обычную переменную?',
    options: [
      { text: 'Это constraint interface, предназначенный для параметра типа, а не value type', correct: true },
      { text: 'Строки нельзя хранить в интерфейсах' },
      { text: 'У него нет метода Error()' },
      { text: 'Его можно использовать только в package main' },
    ],
  },
  {
    text: 'Как получить нулевое значение неизвестного параметра типа T?',
    options: [
      { text: 'Объявить var zero T и вернуть zero', correct: true },
      { text: 'Всегда вернуть nil' },
      { text: 'Всегда вернуть 0' },
      { text: 'Вызвать new(any)' },
    ],
  },
  {
    text: 'Какое свойство имеет нулевое значение Set[T], объявленного как type Set[T comparable] map[T]struct{}?',
    options: [
      { text: 'Можно читать и проверять ключи, но Add вызовет panic из-за nil map', correct: true },
      { text: 'Оно автоматически инициализируется при первом Add' },
      { text: 'Нельзя даже вызвать len или Has' },
      { text: 'Оно содержит один нулевой элемент T' },
    ],
  },
  {
    text: 'Когда generic-абстракция скорее избыточна?',
    options: [
      { text: 'Есть только один конкретный случай, а параметр T скрывает бизнес-смысл', correct: true },
      { text: 'Алгоритм одинаков для нескольких типов и constraint короткий' },
      { text: 'Функция сохраняет конкретный тип результата и убирает дублирование' },
      { text: 'Тип используется для технического Set[TaskID]' },
    ],
  },
]
</script>
