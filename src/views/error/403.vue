<template>
  <div class="error-page">
    <el-result icon="warning" :title="t('error.title403')" :sub-title="t('error.desc403')">
      <template #extra>
        <el-button type="primary" @click="goBack">{{ t('error.backPrev') }}</el-button>
        <el-button @click="goLogin">{{ t('error.backLogin') }}</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

function goBack(): void {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/bi-editor')
  }
}

function goLogin(): void {
  router.push('/login')
}
</script>

<style scoped>
.error-page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
