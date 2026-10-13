---
prev: /guide/defer-panic-recover/README.md
next: /guide/defer-panic-recover/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Когда выполняется отложенный вызов defer?',
    options: [
      { text: 'Перед завершением текущей функции', correct: true },
      { text: 'Сразу в момент объявления defer' },
      { text: 'Только при panic' },
      { text: 'После завершения всей программы' },
    ],
  },
  {
    text: 'Когда стоит написать defer file.Close()?',
    options: [
      { text: 'Сразу после успешной проверки ошибки открытия файла', correct: true },
      { text: 'До вызова os.Open' },
      { text: 'Только после io.ReadAll' },
      { text: 'Файл никогда не нужно закрывать' },
    ],
  },
  {
    text: 'В каком порядке выполнятся три defer, объявленные один за другим?',
    options: [
      { text: 'В обратном порядке объявления', correct: true },
      { text: 'В том же порядке объявления' },
      { text: 'В случайном порядке' },
      { text: 'Только первый defer' },
    ],
  },
  {
    text: 'Когда вычисляется аргумент defer fmt.Println(name)?',
    options: [
      { text: 'В момент объявления defer', correct: true },
      { text: 'Только после изменения name' },
      { text: 'После закрытия всех файлов' },
      { text: 'Никогда, defer не принимает аргументы' },
    ],
  },
  {
    text: 'Что такое panic?',
    options: [
      { text: 'Аварийное завершение нормального выполнения с раскруткой стека', correct: true },
      { text: 'Обычная ошибка валидации' },
      { text: 'Альтернатива return nil' },
      { text: 'Способ создать goroutine' },
    ],
  },
  {
    text: 'Что следует вернуть при пустом пользовательском названии задачи?',
    options: [
      { text: 'Обычный error, например ErrEmptyTitle', correct: true },
      { text: 'panic' },
      { text: 'recover' },
      { text: 'Закрытый канал' },
    ],
  },
  {
    text: 'Где должен находиться recover, чтобы перехватить panic?',
    options: [
      { text: 'В функции, вызванной через defer в той же goroutine', correct: true },
      { text: 'В любом месте main после panic' },
      { text: 'В другой goroutine' },
      { text: 'В блоке if err != nil' },
    ],
  },
  {
    text: 'Перехватит ли recover в main panic из другой goroutine?',
    options: [
      { text: 'Нет, recover работает только в той же goroutine', correct: true },
      { text: 'Да, всегда' },
      { text: 'Только при использовании WaitGroup' },
      { text: 'Только если panic содержит error' },
    ],
  },
  {
    text: 'Почему при записи файла иногда важно обработать ошибку Close?',
    options: [
      { text: 'Ошибка может возникнуть при финальной записи данных в файл', correct: true },
      { text: 'Close всегда удаляет файл' },
      { text: 'Close создаёт JSON' },
      { text: 'os.Create не возвращает файл до Close' },
    ],
  },
  {
    text: 'Какой паттерн корректен после mu.Lock()?',
    options: [
      { text: 'defer mu.Unlock()', correct: true },
      { text: 'defer mu.Lock()' },
      { text: 'recover(mu)' },
      { text: 'close(mu)' },
    ],
  },
]
</script>
