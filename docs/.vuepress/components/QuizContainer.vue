<template>
  <div class="quiz-container">
    <div v-if="hasSavedAnswers" class="quiz-container__saved-notice">
      <p>На этой странице сохранены ответы.</p>

      <button type="button" class="quiz-container__reset" @click="resetAnswers">
        Сбросить ответы и пройти заново
      </button>
    </div>

    <div
        v-for="(question, index) in questions"
        :key="getQuestionKey(question, index)"
    >
      <Quiz
        :question
        :index
        :selected-answer="answers[getQuestionKey(question, index)]"
        @select="saveAnswer(getQuestionKey(question, index), $event)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import type { IQuestion } from '../../types.ts'
import Quiz from './Quiz.vue'

const props = defineProps<{
  questions: IQuestion[]
}>()

const answers = ref<Record<string, string>>({})
const storageKey = ref('')
const hasSavedAnswers = computed(() => Object.keys(answers.value).length > 0)

onMounted(() => {
  storageKey.value = `go-book:quiz:${window.location.pathname}`

  try {
    const savedAnswers = window.localStorage.getItem(storageKey.value)

    if (!savedAnswers) {
      return
    }

    const parsedAnswers: unknown = JSON.parse(savedAnswers)

    if (isAnswerRecord(parsedAnswers)) {
      answers.value = Object.fromEntries(
        Object.entries(parsedAnswers).filter(([key, answer]) => isKnownAnswer(key, answer)),
      )
    }
  } catch {
    answers.value = {}
  }
})

function getQuestionKey(question: IQuestion, index: number): string {
  return `${index}:${question.text}`
}

function saveAnswer(questionKey: string, answer: string): void {
  answers.value = {
    ...answers.value,
    [questionKey]: answer,
  }

  persistAnswers()
}

function resetAnswers(): void {
  answers.value = {}

  if (storageKey.value) {
    window.localStorage.removeItem(storageKey.value)
  }
}

function persistAnswers(): void {
  if (!storageKey.value) {
    return
  }

  try {
    window.localStorage.setItem(storageKey.value, JSON.stringify(answers.value))
  } catch {
    // Пользователь может продолжить квиз, даже если браузер запретил localStorage.
  }
}

function isAnswerRecord(value: unknown): value is Record<string, string> {
  return typeof value === 'object'
    && value !== null
    && Object.values(value).every((answer) => typeof answer === 'string')
}

function isKnownAnswer(questionKey: string, answer: string): boolean {
  const question = props.questions.find(
    (currentQuestion, index) => getQuestionKey(currentQuestion, index) === questionKey,
  )

  return question !== undefined && question.options.some((option) => option.text === answer)
}
</script>

<style scoped>
.quiz-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.quiz-container__saved-notice {
  border-left: 0.15rem solid var(--vp-c-accent-bg);
  padding: 0.5rem 0.75rem;
}

.quiz-container__saved-notice p {
  margin: 0 0 0.75rem;
}

.quiz-container__reset {
  padding: 0.5rem 0.75rem;
  color: var(--vp-c-text);
  font: inherit;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 0.25rem;
  cursor: pointer;
}

.quiz-container__reset:hover {
  background: var(--vp-c-accent-hover);
  border-color: var(--vp-c-accent-hover);
}
</style>
