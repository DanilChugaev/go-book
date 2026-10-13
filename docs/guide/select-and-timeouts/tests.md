---
prev: /guide/select-and-timeouts/README.md
next: /guide/select-and-timeouts/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Что ждёт select без default?',
    options: [
      { text: 'Пока хотя бы одна операция с каналом не станет готова', correct: true },
      { text: 'Строго все case одновременно' },
      { text: 'Только первый case по порядку' },
      { text: 'Ровно одну секунду' },
    ],
  },
  {
    text: 'Что произойдёт, если в select одновременно готовы несколько case?',
    options: [
      { text: 'Go выберет один из готовых case', correct: true },
      { text: 'Всегда выполнится первый case в коде' },
      { text: 'Выполнятся все готовые case' },
      { text: 'Будет panic' },
    ],
  },
  {
    text: 'Когда выполняется default в select?',
    options: [
      { text: 'Когда ни один другой case не готов сразу', correct: true },
      { text: 'После каждого case' },
      { text: 'Только после закрытия канала' },
      { text: 'Через заданный таймаут' },
    ],
  },
  {
    text: 'Что возвращает time.After(2 * time.Second)?',
    options: [
      { text: 'Канал, в который придёт время примерно через две секунды', correct: true },
      { text: 'Число миллисекунд' },
      { text: 'WaitGroup' },
      { text: 'Закрытый канал строк' },
    ],
  },
  {
    text: 'Где создать time.After, если два результата должны уложиться в общий таймаут?',
    options: [
      { text: 'Перед циклом получения результатов', correct: true },
      { text: 'Внутри каждого case с результатом' },
      { text: 'После цикла' },
      { text: 'Внутри exportText' },
    ],
  },
  {
    text: 'Что вернёт получение из закрытого и опустошённого канала с формой value, open := <-channel?',
    options: [
      { text: 'Нулевое значение и false', correct: true },
      { text: 'Только panic' },
      { text: 'Последнее значение и true всегда' },
      { text: 'nil и ошибку' },
    ],
  },
  {
    text: 'Зачем присваивать закрытому каналу nil внутри select?',
    options: [
      { text: 'Чтобы его case больше не был готов и не мешал другим case', correct: true },
      { text: 'Чтобы снова открыть канал' },
      { text: 'Чтобы удалить все сообщения из канала' },
      { text: 'Чтобы ускорить JSON-сериализацию' },
    ],
  },
  {
    text: 'Останавливает ли time.After экспортные goroutine автоматически?',
    options: [
      { text: 'Нет, он прекращает только ожидание в текущем select', correct: true },
      { text: 'Да, все goroutine завершаются сразу' },
      { text: 'Да, но только JSON-экспорт' },
      { text: 'Только если канал закрыт' },
    ],
  },
  {
    text: 'Кто должен закрывать канал результатов exportResult?',
    options: [
      { text: 'Код, который владеет всеми отправителями результатов', correct: true },
      { text: 'Любой получатель после первого результата' },
      { text: 'Функция time.After' },
      { text: 'fmt.Println' },
    ],
  },
  {
    text: 'Почему default в бесконечном цикле без паузы опасен?',
    options: [
      { text: 'Цикл может постоянно использовать CPU, не блокируясь', correct: true },
      { text: 'default автоматически закрывает канал' },
      { text: 'Он удаляет результаты из канала' },
      { text: 'Go перестаёт выполнять goroutine' },
    ],
  },
  {
    text: 'Зачем waitForExportsUntil принимает timeout <-chan time.Time вместо готовой duration?',
    options: [
      { text: 'Чтобы тест мог передать готовый канал таймаута без реальной паузы', correct: true },
      { text: 'Чтобы time.After перестал работать' },
      { text: 'Чтобы автоматически отменить goroutine' },
      { text: 'Чтобы отправлять JSON в канал' },
    ],
  },
  {
    text: 'Как в тесте мгновенно имитировать истечение таймаута?',
    options: [
      { text: 'Создать chan time.Time и закрыть его до вызова функции', correct: true },
      { text: 'Вызвать time.Sleep(time.Second)' },
      { text: 'Закрыть results до запуска select' },
      { text: 'Передать nil вместо timeout' },
    ],
  },
]
</script>
