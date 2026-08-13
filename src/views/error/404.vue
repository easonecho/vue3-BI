<template>
  <div class="error-page">
    <el-result icon="info" title="页面不存在" sub-title="抱歉，您访问的页面不存在">
      <template #extra>
        <el-button type="primary" @click="goBack">返回上一页</el-button>
        <el-button @click="goHome">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack(): void {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/bi-editor')
  }
}

function goHome(): void {
  router.push('/bi-editor')
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
