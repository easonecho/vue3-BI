<template>
  <el-config-provider :locale="epLocale">
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
  </el-config-provider>
</template>

<script setup lang="ts">
// App.vue 作为根组件，使用 ErrorBoundary 包裹 router-view
import { computed } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useLang } from '@/i18n/composables'

const { locale } = useLang()

/** Element Plus 内置文案（分页、日期选择、空状态等）跟随应用语言 */
const epLocale = computed(() => (locale.value === 'en-US' ? en : zhCn))
</script>

<style lang="less">
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
