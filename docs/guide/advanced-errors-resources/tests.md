---
prev: /guide/advanced-errors-resources/http-api-errors.md
next: /guide/advanced-errors-resources/practice.md
---

# Самопроверка: ошибки и управление ресурсами

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Что сохраняет fmt.Errorf("операция: %w", err) в дополнение к тексту контекста?',
    options: [
      { text: 'Связь с исходной ошибкой для errors.Is и errors.As', correct: true },
      { text: 'Только строку err.Error() без связи с причиной' },
      { text: 'Stack trace любой ошибки' },
      { text: 'HTTP-статус ошибки' },
    ],
  },
  {
    text: 'Когда errors.Is(err, target) подходит лучше errors.As?',
    options: [
      { text: 'Когда нужно узнать наличие известной причины-маркера без дополнительных данных', correct: true },
      { text: 'Когда нужно прочитать поля структурированной ошибки' },
      { text: 'Когда нужно сравнить тексты ошибок' },
      { text: 'Только когда err равен nil' },
    ],
  },
  {
    text: 'Для чего в собственной ошибке ValidationError может понадобиться метод Unwrap() error?',
    options: [
      { text: 'Чтобы errors.Is мог распознать общую причину ErrInvalidInput', correct: true },
      { text: 'Чтобы автоматически отправить ошибку клиенту как JSON' },
      { text: 'Чтобы удалить поля Field и Rule' },
      { text: 'Чтобы recover мог перехватить ошибку' },
    ],
  },
  {
    text: 'Почему для поиска *ValidationError используют var validationErr *ValidationError и errors.As(err, &validationErr)?',
    options: [
      { text: 'errors.As записывает найденную ошибку в переданную переменную', correct: true },
      { text: 'errors.As принимает строковое имя типа' },
      { text: 'Так errors.As создаёт новую ошибку' },
      { text: 'Иначе Go автоматически вызовет panic' },
    ],
  },
  {
    text: 'Почему функция не должна возвращать типизированный nil-указатель как error?',
    options: [
      { text: 'Интерфейс error будет содержать динамический тип и окажется не равен nil', correct: true },
      { text: 'Указатель автоматически превратится в errors.New' },
      { text: 'Компилятор всегда запретит такой return' },
      { text: 'errors.Is всегда вернёт false' },
    ],
  },
  {
    text: 'Что вернёт errors.Join(), если ему передать только nil-ошибки?',
    options: [
      { text: 'nil', correct: true },
      { text: 'Пустую строку' },
      { text: 'PanicError' },
      { text: 'sql.ErrNoRows' },
    ],
  },
  {
    text: 'В каком порядке сработают несколько defer в одной функции?',
    options: [
      { text: 'В обратном порядке регистрации: LIFO', correct: true },
      { text: 'В порядке регистрации: FIFO' },
      { text: 'В случайном порядке' },
      { text: 'Только последний defer' },
    ],
  },
  {
    text: 'Почему defer file.Close() опасен внутри большого цикла?',
    options: [
      { text: 'Файлы закроются лишь при выходе из внешней функции и могут исчерпаться дескрипторы', correct: true },
      { text: 'defer нельзя применять к файлам' },
      { text: 'Close всегда вызывает panic в цикле' },
      { text: 'defer отключает обработку ошибок io.ReadAll' },
    ],
  },
  {
    text: 'Зачем после BeginTx обычно сразу вызывают defer tx.Rollback()?',
    options: [
      { text: 'Чтобы незавершённая транзакция откатилась при любом раннем return', correct: true },
      { text: 'Чтобы Commit сработал два раза' },
      { text: 'Чтобы не передавать context в SQL-запросы' },
      { text: 'Чтобы превратить sql.ErrNoRows в 404 автоматически' },
    ],
  },
  {
    text: 'Где должен находиться recover, чтобы перехватить panic в goroutine worker?',
    options: [
      { text: 'В defer внутри той же goroutine worker', correct: true },
      { text: 'В defer функции main в другой goroutine' },
      { text: 'В любом месте после оператора go' },
      { text: 'В errorResponse HTTP handler' },
    ],
  },
  {
    text: 'Что безопасно вернуть клиенту при непредвиденной внутренней ошибке HTTP API?',
    options: [
      { text: 'Стабильный код и общее сообщение без текста внутренней ошибки', correct: true },
      { text: 'err.Error() вместе со строкой SQL' },
      { text: 'debug.Stack() в поле stack' },
      { text: 'Значение recovered из panic' },
    ],
  },
  {
    text: 'Где обычно нужно записывать непредвиденную ошибку 500?',
    options: [
      { text: 'Один раз на границе окончательной обработки, например в HTTP handler, с операционным контекстом', correct: true },
      { text: 'Во всех слоях: repository, service, handler и main' },
      { text: 'Нигде: достаточно вернуть клиенту err.Error()' },
      { text: 'Только внутри Error() собственной ошибки' },
    ],
  },
]
</script>
