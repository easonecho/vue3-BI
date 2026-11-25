<template>
  <div class="error-page">
    <div class="error-lang">
      <LangSwitcher />
    </div>
    <el-result icon="info" :title="t('error.title404')" :sub-title="t('error.desc404')">
      <template #extra>
        <el-button type="primary" @click="goBack">{{ t('error.backPrev') }}</el-button>
        <el-button @click="goHome">{{ t('error.backHome') }}</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LangSwitcher from '@/components/LangSwitcher.vue'

const router = useRouter()
const { t } = useI18n()

function goBack(): void {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard')
  }
}

function goHome(): void {
  router.push('/dashboard')
}
</script>

<style scoped>
.error-page {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 错误页无导航栏，单独提供语言切换入口 */
.error-lang {
  position: absolute;
  top: 20px;
  right: 24px;
}
</style>
