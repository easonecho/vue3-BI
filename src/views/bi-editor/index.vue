<template>
  <div class="bi-editor">
    <HeaderToolbar />
    <div class="editor-body">
      <LeftPanel @drag-start="handleDragStart" @add-component="handleAddComponent" />
      <CanvasArea @select-component="handleSelectComponent" />
      <RightPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import HeaderToolbar from './components/HeaderToolbar.vue'
import LeftPanel from './components/LeftPanel.vue'
import CanvasArea from './components/CanvasArea.vue'
import RightPanel from './components/RightPanel.vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import { useKeyboardShortcuts } from './composables/useCanvas'
import type { ComponentMeta } from './types'

const route = useRoute()
const router = useRouter()
const store = useBiEditorStore()

useKeyboardShortcuts()

function handleDragStart(event: DragEvent, meta: ComponentMeta) {
  // drag start meta is captured by dataTransfer, debug log removed
}

function handleAddComponent(meta: ComponentMeta) {
  const centerX = store.canvas.width / 2 - meta.defaultWidth / 2
  const centerY = store.canvas.height / 2 - meta.defaultHeight / 2
  store.addComponent(meta.type, centerX, centerY)
}

function handleSelectComponent(id: string | null) {
  store.selectComponent(id)
}

// 🔑 组件内路由离开守卫:有未保存改动时弹 ElMessageBox 确认。
//   用 onBeforeRouteLeave 而非全局 beforeEach,因为地址栏直接输入 URL 导航时,
//   全局守卫的 from 是 START_LOCATION(path 为 '/'),无法识别"从编辑器离开"。
//   组件内守卫在组件卸载前触发,不依赖 from 路由对象,覆盖所有导航来源。
//   仅拦截离开 BiEditor 的导航(to.path 不以 /bi-editor 开头),同编辑器内 id 变化不拦。
onBeforeRouteLeave(async (to) => {
  if (to.path.startsWith('/bi-editor')) return true
  if (!store.isDirty) return true
  try {
    await ElMessageBox.confirm('有未保存的修改，确定离开？', '提示', {
      type: 'warning',
      confirmButtonText: '离开',
      cancelButtonText: '取消',
    })
    return true
  } catch {
    return false
  }
})

// 🔑 刷新/关闭页面前提示:有未保存改动时浏览器会弹原生确认框
// beforeunload 必须调用 returnValue 才能触发原生提示
function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (store.isDirty) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  // 🔑 按路由参数决定加载已有看板或新建空白看板
  const id = route.params.id
  if (id) {
    store.loadDashboard(Number(id)).catch((e) => {
      console.warn('[bi-editor] loadDashboard failed', e)
      ElMessage.error('看板加载失败,请返回列表重试')
    })
  } else {
    store.newDashboard()
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped lang="less">
.bi-editor {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bi-bg, #111827);
  overflow: hidden;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
