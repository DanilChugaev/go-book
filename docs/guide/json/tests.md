---
prev: /guide/json/README.md
next: /guide/json/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Какой пакет стандартной библиотеки работает с JSON?',
    options: [
      { text: 'encoding/json', correct: true },
      { text: 'os/json' },
      { text: 'fmt/json' },
      { text: 'io/encoding' },
    ],
  },
  {
    text: 'Что делает json.Marshal?',
    options: [
      { text: 'Преобразует Go-значение в JSON-байты', correct: true },
      { text: 'Читает JSON-файл' },
      { text: 'Создаёт Go-структуру из JSON' },
      { text: 'Удаляет JSON-теги' },
    ],
  },
  {
    text: 'Что делает json.Unmarshal?',
    options: [
      { text: 'Записывает JSON-данные в переданное Go-значение', correct: true },
      { text: 'Красиво форматирует JSON' },
      { text: 'Открывает файл для записи' },
      { text: 'Преобразует string в []byte без ошибок' },
    ],
  },
  {
    text: 'Почему вторым аргументом json.Unmarshal передают &tasks?',
    options: [
      { text: 'Функции нужен адрес, чтобы изменить переменную tasks', correct: true },
      { text: 'JSON работает только с указателями на map' },
      { text: 'Так создаётся пустой слайс' },
      { text: 'Это синтаксис JSON-тега' },
    ],
  },
  {
    text: 'Что задаёт тег json:"title" у поля Title?',
    options: [
      { text: 'Имя ключа title в JSON', correct: true },
      { text: 'Новое имя Go-поля' },
      { text: 'Тип поля string' },
      { text: 'Максимальную длину строки' },
    ],
  },
  {
    text: 'Какие поля структура должна иметь для автоматической сериализации encoding/json?',
    options: [
      { text: 'Экспортируемые поля с заглавной буквы', correct: true },
      { text: 'Только поля типа string' },
      { text: 'Только неэкспортируемые поля' },
      { text: 'Поля без JSON-тегов' },
    ],
  },
  {
    text: 'Чем json.MarshalIndent отличается от json.Marshal?',
    options: [
      { text: 'Добавляет отступы для читаемого JSON', correct: true },
      { text: 'Не возвращает ошибку' },
      { text: 'Работает только с одним объектом' },
      { text: 'Автоматически записывает файл' },
    ],
  },
  {
    text: 'Что вернёт json.Marshal для nil-слайса?',
    options: [
      { text: 'null', correct: true },
      { text: '[]' },
      { text: '{}' },
      { text: 'Ошибка всегда' },
    ],
  },
  {
    text: 'Проверит ли json.Unmarshal, что priority находится в диапазоне от 1 до 3?',
    options: [
      { text: 'Нет, бизнес-валидацию нужно выполнить отдельно', correct: true },
      { text: 'Да, JSON всегда знает правила Task' },
      { text: 'Только если поле имеет тег json' },
      { text: 'Только для nil-слайса' },
    ],
  },
  {
    text: 'Какой порядок действий нужен для загрузки задач из tasks.json?',
    options: [
      { text: 'os.ReadFile, затем json.Unmarshal', correct: true },
      { text: 'json.Marshal, затем os.ReadFile' },
      { text: 'os.WriteFile, затем json.MarshalIndent' },
      { text: 'fmt.Println, затем copy' },
    ],
  },
]
</script>
