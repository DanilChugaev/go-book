---
prev: /guide/file-io/README.md
next: /guide/file-io/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Какая функция подходит для записи небольшого текста в файл одной командой?',
    options: [
      { text: 'os.WriteFile', correct: true },
      { text: 'fmt.Println' },
      { text: 'io.ReadAll' },
      { text: 'os.Open' },
    ],
  },
  {
    text: 'Какой тип данных возвращает os.ReadFile?',
    options: [
      { text: '[]byte и error', correct: true },
      { text: 'string и bool' },
      { text: '*os.File и error' },
      { text: 'только error' },
    ],
  },
  {
    text: 'Что обычно делают с []byte, полученным из os.ReadFile, чтобы вывести текст?',
    options: [
      { text: 'Преобразуют через string(content)', correct: true },
      { text: 'Передают в append' },
      { text: 'Разыменовывают через *content' },
      { text: 'Сравнивают с nil без чтения' },
    ],
  },
  {
    text: 'Что происходит, если os.WriteFile вызывают для существующего файла?',
    options: [
      { text: 'Старое содержимое заменяется новыми данными', correct: true },
      { text: 'Новые данные всегда добавляются в конец' },
      { text: 'Файл автоматически удаляется' },
      { text: 'Go всегда возвращает os.ErrExist' },
    ],
  },
  {
    text: 'Какую функцию используют для открытия файла, когда нужно работать с *os.File?',
    options: [
      { text: 'os.Open', correct: true },
      { text: 'os.ReadFile' },
      { text: 'fmt.Open' },
      { text: 'io.Open' },
    ],
  },
  {
    text: 'Зачем сразу после успешного os.Open пишут defer file.Close()?',
    options: [
      { text: 'Чтобы закрыть файл при выходе из текущей функции', correct: true },
      { text: 'Чтобы удалить файл после чтения' },
      { text: 'Чтобы открыть файл во второй раз' },
      { text: 'Чтобы преобразовать файл в строку' },
    ],
  },
  {
    text: 'Что делает os.Create с уже существующим файлом?',
    options: [
      { text: 'Очищает его и открывает для записи', correct: true },
      { text: 'Добавляет запись в конец' },
      { text: 'Всегда возвращает ошибку' },
      { text: 'Открывает его только для чтения' },
    ],
  },
  {
    text: 'Как проверить, что ошибка чтения возникла именно потому, что файла нет?',
    options: [
      { text: 'errors.Is(err, os.ErrNotExist)', correct: true },
      { text: 'err.Error() == "file not found"' },
      { text: 'err == false' },
      { text: 'len(err) == 0' },
    ],
  },
  {
    text: 'От чего считается относительный путь tasks.txt?',
    options: [
      { text: 'От текущей рабочей директории программы', correct: true },
      { text: 'Всегда от папки установки Go' },
      { text: 'Всегда от домашней папки пользователя' },
      { text: 'От папки пакета os' },
    ],
  },
  {
    text: 'Почему os.ReadFile не подходит для очень большого файла?',
    options: [
      { text: 'Он загружает всё содержимое в память', correct: true },
      { text: 'Он не возвращает error' },
      { text: 'Он работает только с JSON' },
      { text: 'Он удаляет файл после чтения' },
    ],
  },
]
</script>
