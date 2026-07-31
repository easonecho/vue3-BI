import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    '**/node_modules/**',
    '**/build/**',
    '**/*.min.js',
    '**/*.d.ts',
    '**/vite.config.ts',
    '**/vite.config.js',
    '**/.eslintrc.cjs',
    '**/.eslintrc.js',
    '**/package-lock.json',
    '**/yarn.lock',
    '**/pnpm-lock.yaml',
  ]),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,

  // ========== 自定义规则（覆盖已有规则） ==========
  {
    name: 'app/custom-rules',
    files: ['**/*.{vue,ts,mts,tsx,js,jsx}'],
    rules: {
      // ----- 基础规则（覆盖 eslint:recommended） -----
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'no-useless-constructor': 'error',
      'no-duplicate-imports': 'error',
      'no-return-await': 'error',
      'require-await': 'warn',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
      'eol-last': ['error', 'always'],
      'no-trailing-spaces': 'error',

      // ----- Vue 规则（覆盖 plugin:vue/essential） -----
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/component-name-in-template-casing': [
        'error',
        'kebab-case',
        'PascalCase',
        {
          registeredComponentsOnly: true,
        },
      ],
      'vue/v-on-event-hyphenation': ['error', 'always'],
      'vue/attributes-order': [
        'error',
        {
          order: [
            'DEFINITION',
            'LIST_RENDERING',
            'CONDITIONALS',
            'RENDER_MODIFIERS',
            'GLOBAL',
            ['UNIQUE', 'SLOT'],
            'TWO_WAY_BINDING',
            'OTHER_DIRECTIVES',
            'OTHER_ATTR',
            'EVENTS',
            'CONTENT',
          ],
          alphabetical: false,
        },
      ],

      // ----- TypeScript 规则（覆盖 @typescript-eslint/recommended） -----
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': 'allow-with-description',
          'ts-expect-error': 'allow-with-description',
        },
      ],
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
    },
  },

  // ========== 测试文件特殊规则 ==========
  {
    name: 'app/test-files',
    files: ['**/tests/**/*.{ts,tsx,vue}', '**/*.spec.{ts,tsx,vue}', '**/*.test.{ts,tsx,vue}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'no-debugger': 'off',
    },
  },

  // ========== 全局变量定义（确保 Vue 宏被识别） ==========
  {
    name: 'app/globals',
    files: ['**/*.{vue,ts,mts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        // Vue 3 编译宏
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        defineOptions: 'readonly',
        withDefaults: 'readonly',
        // Node 全局
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
)
