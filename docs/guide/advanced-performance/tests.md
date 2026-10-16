---
prev: /guide/advanced-performance/allocations-optimization.md
next: /guide/advanced-performance/practice.md
---

# Самопроверка: производительность и диагностика

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'С чего нужно начать работу над предполагаемой проблемой производительности?',
    options: [
      { text: 'Сформулировать сценарий, важную метрику и воспроизводимую гипотезу', correct: true },
      { text: 'Сразу добавить sync.Pool ко всем временным объектам' },
      { text: 'Заменить все строки на []byte' },
      { text: 'Запустить goroutine для каждой операции' },
    ],
  },
  {
    text: 'Какой файл содержит Go benchmark?',
    options: [
      { text: 'Файл с суффиксом _test.go и функцию BenchmarkXxx(*testing.B)', correct: true },
      { text: 'Любой .go с функцией main' },
      { text: 'Только файл go.mod' },
      { text: 'Файл с суффиксом _profile.go' },
    ],
  },
  {
    text: 'Зачем вызывать b.ResetTimer() после подготовки benchmark-данных?',
    options: [
      { text: 'Чтобы setup не попадал во время измеряемой операции', correct: true },
      { text: 'Чтобы сборщик мусора перестал работать' },
      { text: 'Чтобы b.Loop стал бесконечным' },
      { text: 'Чтобы включить race detector' },
    ],
  },
  {
    text: 'Зачем сохранять результат benchmark-функции в package-level sink?',
    options: [
      { text: 'Чтобы вычисление было observable и компилятор не смог удалить его как ненужное', correct: true },
      { text: 'Чтобы результат автоматически попал в pprof' },
      { text: 'Чтобы запретить любые аллокации' },
      { text: 'Чтобы тест всегда выполнялся в одной goroutine' },
    ],
  },
  {
    text: 'Что добавляет флаг -benchmem к benchmark-выводу?',
    options: [
      { text: 'B/op и allocs/op', correct: true },
      { text: 'HTTP latency percentiles' },
      { text: 'Список goroutine' },
      { text: 'Только покрытие тестами' },
    ],
  },
  {
    text: 'Какое утверждение о B/op верно?',
    options: [
      { text: 'Это байты, выделенные на операцию; показатель не равен удерживаемой памяти после GC', correct: true },
      { text: 'Это точный размер binary-файла программы' },
      { text: 'Это p99 latency endpoint' },
      { text: 'Это число CPU-ядер' },
    ],
  },
  {
    text: 'Для чего используют benchstat?',
    options: [
      { text: 'Для статистического сравнения серий benchmark до и после изменения', correct: true },
      { text: 'Для автоматического исправления гонок данных' },
      { text: 'Для генерации SQL-миграций' },
      { text: 'Для запуска pprof endpoint в Gin' },
    ],
  },
  {
    text: 'Какой профиль отвечает на вопрос, где программа проводит CPU-время?',
    options: [
      { text: 'CPU profile', correct: true },
      { text: 'Heap profile только inuse_space' },
      { text: 'Race detector' },
      { text: 'go vet' },
    ],
  },
  {
    text: 'В чём разница между alloc_space и inuse_space heap profile?',
    options: [
      { text: 'alloc_space показывает всего выделенную память, inuse_space — память, остающуюся живой в heap', correct: true },
      { text: 'Первый измеряет CPU, второй HTTP-запросы' },
      { text: 'Они всегда содержат идентичные данные' },
      { text: 'inuse_space запрещён в Go' },
    ],
  },
  {
    text: 'Что означает сообщение escape analysis "moved to heap"?',
    options: [
      { text: 'Компилятор выбрал размещение объекта в heap; это повод проверить метрики, а не автоматический баг', correct: true },
      { text: 'В программе обязательно произошла утечка памяти' },
      { text: 'Файл удалён из проекта' },
      { text: 'Нужно немедленно применить unsafe' },
    ],
  },
  {
    text: 'Когда strings.Builder наиболее оправдан?',
    options: [
      { text: 'При построении большого текста последовательными добавлениями в цикле', correct: true },
      { text: 'Для любого сложения двух коротких строк' },
      { text: 'Вместо JSON Encoder при любом HTTP-ответе' },
      { text: 'Для хранения database/sql соединений' },
    ],
  },
  {
    text: 'Почему sync.Pool нельзя использовать как обязательный ресурсный pool или постоянный cache?',
    options: [
      { text: 'Runtime может очистить pool, а Get может вернуть nil; pool предназначен для временного reuse', correct: true },
      { text: 'sync.Pool нельзя применять с bytes.Buffer' },
      { text: 'Он автоматически сохраняет объекты в PostgreSQL' },
      { text: 'Он гарантирует возврат объекта той же goroutine' },
    ],
  },
]
</script>
