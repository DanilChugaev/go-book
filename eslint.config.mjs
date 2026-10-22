import vue from 'eslint-plugin-vue';
import ts from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import parserVue from 'vue-eslint-parser';
import parserTs from '@typescript-eslint/parser';

// Ручной фронтенд проекта: только сайт VuePress (docs/).
// Генерируемые артефакты (.cache/.temp/dist/generated) отсечены в ignores ниже.
export default [
  {
    files: ['docs/.vuepress/**/*.{js,ts,vue}', 'docs/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: parserVue,
      parserOptions: {
        parser: parserTs,
      },
    },
    plugins: {
      vue,
      '@typescript-eslint': ts,
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // Правила из eslint-plugin-vue для Vue 3
      'vue/no-unused-vars': 'error',
      'vue/require-default-prop': 'off',
      // Правила из @typescript-eslint
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Зеркало .gitignore (minimatch, не gitignore-синтаксис).
    // Негации (!) в ESLint не поддерживаются, но и не нужны:
    // .env / *.log / *.json / *.md и т.п. не попадают в `files` выше.
    ignores: [
      'logs/**',
      '**/*.log',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',
      '**/pnpm-debug.log*',
      '**/lerna-debug.log*',
      '**/node_modules/**',
      '**/dist/**',
      '**/.cache/**',
      '**/.temp/**',
      'docs/.vuepress/generated/**',
      '.book-build/**',
      'docs/.vuepress/public/KPF/**',
      'docs/.vuepress/public/Logs/**',
      'docs/.vuepress/public/Summary_Log.csv',
      '**/.env',
      '**/.env.*',
      '.vscode/**',
      '.idea/**',
      '**/.DS_Store',
      '**/*.suo',
      '**/*.ntvs*',
      '**/*.njsproj',
      '**/*.sln',
      '**/*.sw?',
    ],
  },
];
