<template>
  <div class="quiz">
    <h2 :id tabindex="-1" class="quiz__title">
      <a class="header-anchor" :href="`#${id}`">
        <span>{{ id }}.</span> <span v-html="formatCode(question.text)"></span>
      </a>
    </h2>

    <div class="quiz__options">
      <label
          v-for="option in options"
          :key="option.text"
          :class="[
              'quiz__option',
              {
                'quiz__option--correct': isSelectedCorrect(option),
                'quiz__option--wrong': isSelectedWrong(option)
              }
          ]"
      >
        <input
          :name="`quiz-${index}`"
          type="radio"
          :value="option.text"
          :checked="selectedAnswer === option.text"
          :disabled="hasAnswer"
          @change="selectAnswer(option.text)"
        >

        <div>
          <span v-html="formatCode(option.text)"></span>

          <p class="quiz__result quiz__result--correct">Правильно!</p>
          <p class="quiz__result quiz__result--wrong">Неправильно.</p>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IQuestion, IQuestionOption } from '../../types'

const props = defineProps<{
  question: IQuestion
  index: number
  selectedAnswer?: string
}>()

const emit = defineEmits<{
  select: [answer: string]
}>()

const id = computed(() => String(props.index + 1))
const hasAnswer = computed(() => props.selectedAnswer !== undefined)
const selectedAnswer = computed(() => props.selectedAnswer ?? '')
const options = computed(() => {
  const shuffledOptions = [...props.question.options]
  const random = createSeededRandom(`${props.index}:${props.question.text}`)

  for (let optionIndex = shuffledOptions.length - 1; optionIndex > 0; optionIndex -= 1) {
    const swapIndex = Math.floor(random() * (optionIndex + 1))

    const currentOption = shuffledOptions[optionIndex]
    shuffledOptions[optionIndex] = shuffledOptions[swapIndex]
    shuffledOptions[swapIndex] = currentOption
  }

  return shuffledOptions
})

function formatCode(text: string) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped.replace(/`([^`\n]+)`/g, '<code>$1</code>')
}

function selectAnswer(answer: string) {
  emit('select', answer)
}

function isSelectedCorrect(option: IQuestionOption) {
  return selectedAnswer.value === option.text && option.correct
}

function isSelectedWrong(option: IQuestionOption) {
  return selectedAnswer.value === option.text && !option.correct
}

function createSeededRandom(seed: string) {
  let state = 2166136261

  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index)
    state = Math.imul(state, 16777619)
  }

  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}
</script>

<style scoped>
.quiz__options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.quiz__option {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
}

.quiz__option input[type='radio'] {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.quiz__option::before {
  display: block;
  flex: 0 0 auto;
  box-sizing: border-box;
  width: 1rem;
  height: 1rem;
  margin-top: 0.2rem;
  content: '';
  background: var(--vp-c-bg);
  border: 2px solid #8c959f;
  border-radius: 50%;
}

.quiz__option::after {
  position: absolute;
  top: 0.45rem;
  left: 0.25rem;
  width: 0.5rem;
  height: 0.5rem;
  content: '';
  background: var(--vp-c-accent);
  border-radius: 50%;
  opacity: 0;
}

.quiz__option:has(input[type='radio']:checked)::after {
  opacity: 1;
}

.quiz__option:has(input[type='radio']:focus-visible)::before {
  outline: 2px solid var(--vp-c-accent);
  outline-offset: 2px;
}

.quiz__option--correct::before {
  border-color: #22a06b;
}

.quiz__option--correct::after {
  background: #22a06b;
}

.quiz__option--wrong::before {
  border-color: #d1242f;
}

.quiz__option--wrong::after {
  background: #d1242f;
}

.quiz__option:has(input:disabled) {
  cursor: not-allowed;
}

.quiz__result {
  display: none;
  margin-bottom: 0;
}

.quiz__option--correct .quiz__result--correct {
  display: block;
  color: var(--vp-c-green-text);
}

.quiz__option--wrong .quiz__result--wrong {
  display: block;
  color: var(--badge-c-danger-text);
}
</style>
