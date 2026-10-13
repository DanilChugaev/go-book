---
prev: /guide/mutex-and-synchronization/README.md
next: /guide/mutex-and-synchronization/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Когда возникает гонка данных?',
    options: [
      { text: 'Несколько goroutine обращаются к одной переменной, и хотя бы одна пишет без синхронизации', correct: true },
      { text: 'Одна функция вызывает другую' },
      { text: 'Канал имеет буфер' },
      { text: 'Map содержит больше одного элемента' },
    ],
  },
  {
    text: 'Как запустить детектор гонок для программы?',
    options: [
      { text: 'go run -race .', correct: true },
      { text: 'go run --mutex .' },
      { text: 'go build -lock .' },
      { text: 'go test --channel .' },
    ],
  },
  {
    text: 'Что делает mu.Lock()?',
    options: [
      { text: 'Получает эксклюзивный доступ к критической секции', correct: true },
      { text: 'Запускает новую goroutine' },
      { text: 'Закрывает канал' },
      { text: 'Ждёт WaitGroup' },
    ],
  },
  {
    text: 'Почему после Lock обычно сразу пишут defer Unlock?',
    options: [
      { text: 'Чтобы мьютекс освободился и при раннем return', correct: true },
      { text: 'Чтобы Lock выполнился дважды' },
      { text: 'Чтобы автоматически создать map' },
      { text: 'Чтобы запретить чтение из map навсегда' },
    ],
  },
  {
    text: 'Какой метод RWMutex используют для чтения map без изменения?',
    options: [
      { text: 'RLock и RUnlock', correct: true },
      { text: 'Lock и RUnlock' },
      { text: 'Read и Close' },
      { text: 'Wait и Done' },
    ],
  },
  {
    text: 'Какой метод RWMutex нужен, чтобы изменить map?',
    options: [
      { text: 'Lock и Unlock', correct: true },
      { text: 'RLock и RUnlock' },
      { text: 'Add и Done' },
      { text: 'Send и Receive' },
    ],
  },
  {
    text: 'Что решает sync.WaitGroup?',
    options: [
      { text: 'Ожидание завершения goroutine', correct: true },
      { text: 'Защиту map от одновременной записи' },
      { text: 'Передачу значений между goroutine' },
      { text: 'Сериализацию JSON' },
    ],
  },
  {
    text: 'Почему TaskStore обычно передают как *TaskStore?',
    options: [
      { text: 'Чтобы не копировать используемый мьютекс и работать с одним хранилищем', correct: true },
      { text: 'Потому что map нельзя хранить в структуре' },
      { text: 'Потому что все методы Go требуют указатель' },
      { text: 'Чтобы отключить -race' },
    ],
  },
  {
    text: 'Почему проверка наличия ID и добавление задачи должны быть под одним Lock?',
    options: [
      { text: 'Другая goroutine иначе может добавить тот же ID между проверкой и записью', correct: true },
      { text: 'Map не поддерживает len' },
      { text: 'errors.Is требует Lock' },
      { text: 'RLock автоматически удаляет элементы' },
    ],
  },
  {
    text: 'Почему не стоит выполнять долгую запись файла под Lock TaskStore?',
    options: [
      { text: 'Другие goroutine будут слишком долго ждать доступ к хранилищу', correct: true },
      { text: 'os.WriteFile нельзя вызвать из goroutine' },
      { text: 'Файл автоматически удалит Mutex' },
      { text: 'JSON всегда вызывает panic под Lock' },
    ],
  },
  {
    text: 'Почему каждый subtest TaskStore должен создавать новый Store?',
    options: [
      { text: 'Чтобы сценарии не влияли на состояние друг друга', correct: true },
      { text: 'Store нельзя использовать дважды' },
      { text: 'Чтобы отключить мьютекс' },
      { text: 'Чтобы ошибки стали nil' },
    ],
  },
  {
    text: 'Что нужно проверить при конкурентном Add одного ID?',
    options: [
      { text: 'Ровно один успех, ожидаемые ошибки дубликата и одну сохранённую задачу', correct: true },
      { text: 'Что первой всегда побеждает первая goroutine' },
      { text: 'Что все goroutine успешно добавляют одинаковый ID' },
      { text: 'Только итоговый текст fmt.Println' },
    ],
  },
]
</script>
