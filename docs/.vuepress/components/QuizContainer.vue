<template>
  <div class="quiz-container">
    <div
        v-for="(question, index) in questions"
        :key="question.text"
    >
      <Quiz :question :index />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { IQuestion } from '../../types.ts';
import Quiz from './Quiz.vue';

defineProps<{
    questions: IQuestion[];
}>();
</script>

<style scoped>
.quiz-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}
</style>