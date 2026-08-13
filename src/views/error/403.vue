<template>
  <div class="error-page">
    <el-result icon="warning" title="暂无权限" sub-title="抱歉，您没有权限访问此页面">
      <template #extra>
        <el-button type="primary" @click="goBack">返回上一页</el-button>
        <el-button @click="goLogin">返回登录</el-button>
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
