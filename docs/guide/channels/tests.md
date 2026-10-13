---
prev: /guide/channels/README.md
next: /guide/channels/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Как создать небуферизированный канал строк?',
    options: [
      { text: 'make(chan string)', correct: true },
      { text: 'make([]string)' },
      { text: 'new(chan string, 1)' },
      { text: 'chan string{}' },
    ],
  },
  {
    text: 'Как отправить значение message в канал messages?',
    options: [
      { text: 'messages <- message', correct: true },
      { text: 'message <- messages' },
      { text: 'messages.send(message)' },
      { text: 'messages => message' },
    ],
  },
  {
    text: 'Как получить значение из канала messages?',
    options: [
      { text: 'message := <-messages', correct: true },
      { text: 'message := messages<-' },
      { text: 'message := messages.receive()' },
      { text: '<-message = messages' },
    ],
  },
  {
    text: 'Что происходит при отправке в небуферизированный канал без готового получателя?',
    options: [
      { text: 'Отправка блокируется', correct: true },
      { text: 'Значение автоматически сохраняется навсегда' },
      { text: 'Значение удаляется' },
      { text: 'Канал автоматически закрывается' },
    ],
  },
  {
    text: 'Что означает make(chan string, 2)?',
    options: [
      { text: 'Канал строк с буфером на два значения', correct: true },
      { text: 'Слайс из двух каналов' },
      { text: 'Два небуферизированных канала' },
      { text: 'Канал, который можно читать только два раза' },
    ],
  },
  {
    text: 'Кто обычно закрывает канал?',
    options: [
      { text: 'Отправитель, когда новых значений больше не будет', correct: true },
      { text: 'Получатель сразу после первого чтения' },
      { text: 'Любая goroutine без согласования' },
      { text: 'WaitGroup автоматически' },
    ],
  },
  {
    text: 'Что произойдёт при отправке в закрытый канал?',
    options: [
      { text: 'Будет panic', correct: true },
      { text: 'Значение будет проигнорировано' },
      { text: 'Канал снова откроется' },
      { text: 'Вернётся false' },
    ],
  },
  {
    text: 'Когда завершается for value := range values?',
    options: [
      { text: 'Когда канал закрыт и все отправленные значения получены', correct: true },
      { text: 'После первого значения' },
      { text: 'Когда канал заполняет буфер' },
      { text: 'Сразу после запуска goroutine' },
    ],
  },
  {
    text: 'Что означает параметр типа <-chan error?',
    options: [
      { text: 'Канал ошибок только для получения', correct: true },
      { text: 'Канал ошибок только для отправки' },
      { text: 'Указатель на канал ошибок' },
      { text: 'Слайс ошибок' },
    ],
  },
  {
    text: 'Почему в saveExports удобно использовать буфер results размером 2?',
    options: [
      { text: 'Две goroutine могут отправить результаты без немедленного получателя', correct: true },
      { text: 'Канал автоматически проверяет ошибки' },
      { text: 'Это гарантирует порядок результатов' },
      { text: 'Буфер заменяет все проверки error' },
    ],
  },
  {
    text: 'Как корректно закрыть results, если в него отправляют несколько goroutine?',
    options: [
      { text: 'Дождаться всех отправителей через WaitGroup и закрыть канал в отдельной goroutine', correct: true },
      { text: 'Пусть каждый отправитель вызывает close(results)' },
      { text: 'Пусть получатель закрывает канал после первого результата' },
      { text: 'Не нужно ждать отправителей перед close' },
    ],
  },
  {
    text: 'Что доказывает завершение for result := range results в тесте экспортов?',
    options: [
      { text: 'Канал закрыт и все отправленные результаты получены', correct: true },
      { text: 'Результаты пришли строго в ожидаемом порядке' },
      { text: 'Файлы автоматически удалены' },
      { text: 'WaitGroup можно передавать по значению' },
    ],
  },
]
</script>
