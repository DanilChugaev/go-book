<template>
  <div class="quiz">
    <h3 class="quiz__title">{{ index + 1 }}. {{ question.text }}</h3>

    <div class="quiz__options">
      <label
          v-for="(option, index) in options"
          :key="index"
          :class="[
              'quiz__option',
              {
                'quiz__option--correct': checkCorrectAnswer(option),
                'quiz__option--wrong': checkWrongAnswer(option)
              }
          ]"
      >
        <input type="radio" v-model="selected" :value="option.text"/>
        {{ option.text }}

        <p class="quiz__result quiz__result--correct">Правильно!</p>
        <p class="quiz__result quiz__result--wrong">Неправильно.</p>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {IQuestion, IQuestionOption} from '../../types';

const props = defineProps<{
  question: IQuestion;
  index: number;
}>()

const selected = ref('');

const options = computed(() => {
  let newArr = [...props.question.options];

  for (let i = newArr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));

    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }

  return newArr;
})

function checkCorrectAnswer(option: IQuestionOption) {
  return selected.value === option.text && option.correct
}

function checkWrongAnswer(option: IQuestionOption) {
  return selected.value === option.text && !option.correct
}
</script>

<style scoped>
.quiz__title {
  margin: 0;
  padding: 0;
}

.quiz__options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quiz__option {
  cursor: pointer;
}

.quiz__result {
  display: none;
  margin-bottom: 0;
  margin-left: 26px;
}

.quiz__option--correct .quiz__result--correct {
  display: block;
  color: var(--back-to-top-c-accent-hover);
}

.quiz__option--wrong .quiz__result--wrong {
  display: block;
  color: var(--badge-c-danger-text);
}
</style>