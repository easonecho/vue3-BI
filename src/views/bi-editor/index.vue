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
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import HeaderToolbar from './components/HeaderToolbar.vue'
import LeftPanel from './components/LeftPanel.vue'
import CanvasArea from './components/CanvasArea.vue'
import RightPanel from './components/RightPanel.vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import { useKeyboardShortcuts } from './composables/useCanvas'
import type { ComponentMeta } from './types'

const route = useRoute()
const store = useBiEditorStore()

useKeyboardShortcuts()

// 拖拽起点由 dataTransfer 携带组件元信息，这里无需额外处理
function handleDragStart(_event: DragEvent, _meta: ComponentMeta) {}

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
// 🔑 同时落一份本地草稿，用户确认离开后下次进入仍可恢复
function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (store.isDirty) {
    store.saveDraft()
    e.preventDefault()
    e.returnValue = ''
  }
}

/** 🔑 自动草稿保存定时器（30 秒） */
const DRAFT_SAVE_INTERVAL = 30_000
let draftTimer: ReturnType<typeof setInterval> | null = null

/**
 * 🔑 加载完成后检查本地草稿：有则询问是否恢复。
 * 草稿只在「有未保存改动」时写入，因此存在即代表上次是非正常退出/放弃保存。
 */
async function maybeRestoreDraft() {
  const draft = store.loadDraft()
  if (!draft) return
  const savedAt = new Date(draft.savedAt).toLocaleString()
  const restore = await ElMessageBox.confirm(
    `检测到 ${savedAt} 的本地草稿，是否恢复未保存的修改？`,
    '恢复草稿',
    { type: 'info', confirmButtonText: '恢复', cancelButtonText: '丢弃' },
  )
    .then(() => true)
    .catch(() => false)
  if (restore) {
    store.restoreDraft(draft)
    ElMessage.success('已恢复本地草稿')
  } else {
    store.clearDraft()
  }
}

/** 按路由参数决定加载已有看板/模板或新建空白，完成后尝试恢复草稿 */
async function initFromRoute() {
  const id = route.params.id
  const isTemplateMode = route.name === 'BiEditorTemplate'
  try {
    if (isTemplateMode) {
      if (id) await store.loadTemplate(Number(id))
      else store.newTemplate()
    } else if (id) {
      await store.loadDashboard(Number(id))
    } else {
      store.newDashboard()
    }
  } catch (e) {
    console.warn('[bi-editor] load failed', e)
    ElMessage.error(isTemplateMode ? '模板加载失败,请返回模板库重试' : '看板加载失败,请返回列表重试')
    return
  }
  await maybeRestoreDraft()
}

onMounted(() => {
  void initFromRoute()
  window.addEventListener('beforeunload', handleBeforeUnload)
  draftTimer = setInterval(() => store.saveDraft(), DRAFT_SAVE_INTERVAL)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (draftTimer !== null) {
    clearInterval(draftTimer)
    draftTimer = null
  }
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
