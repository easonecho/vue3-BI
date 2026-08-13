<template>
  <div v-if="hasError" class="error-boundary">
    <el-result icon="error" title="渲染错误" sub-title="组件渲染发生异常，请重试">
      <template #extra>
        <el-button type="primary" @click="handleRetry">重试</el-button>
      </template>
    </el-result>
    <pre v-if="isDev && errorStack" class="error-boundary__stack">{{ errorStack }}</pre>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
/**
 * 错误边界组件
 *
 * 使用 onErrorCaptured 捕获子组件渲染错误，
 * 显示 el-result 错误提示与重试按钮，
 * 开发模式下展示错误堆栈，
 * 路由变化时自动重置。
 */
import { ref, onErrorCaptured, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const hasError = ref(false)
const errorStack = ref<string>('')
const isDev = import.meta.env.DEV

onErrorCaptured((err: Error) => {
  hasError.value = true
  errorStack.value = err.stack || err.message
  // 阻止错误继续向上传播
  return false
})

// 路由变化时重置错误状态
watch(
  () => route.path,
  () => {
    hasError.value = false
    errorStack.value = ''
  },
)

function handleRetry(): void {
  hasError.value = false
  errorStack.value = ''
}
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.error-boundary__stack {
  margin-top: 16px;
  padding: 16px;
  max-width: 80%;
  overflow: auto;
  background: #1e1e1e;
  color: #ff5555;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
