<template>
  <div
    v-loading="loading"
    class="screen-page"
    @mousemove="revealToolbar"
    @mouseleave="hideToolbar"
  >
    <!-- 大屏渲染层：复用编辑器 layout，按设计稿尺寸 scale 自适应 -->
    <DashboardScreen v-if="dashboardId && !loading && !loadError" />

    <!-- 未指定看板：选择后进入大屏 -->
    <div v-if="!dashboardId && !loading" class="screen-picker">
      <div class="picker-card">
        <div class="picker-title">数据大屏</div>
        <p class="picker-desc">选择一个看板，以全屏自适应方式展示</p>
        <el-select
          v-model="selectedId"
          class="picker-select"
          filterable
          placeholder="请选择看板"
        >
          <el-option
            v-for="item in dashboardOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
        <el-button type="primary" :disabled="!selectedId" @click="enterScreen">
          进入大屏
        </el-button>
      </div>
    </div>

    <!-- 加载失败 -->
    <div v-if="loadError" class="screen-error">
      <el-empty :description="loadError">
        <el-button @click="back">返回列表</el-button>
      </el-empty>
    </div>

    <!-- 悬浮工具栏：3 秒无操作自动隐藏，移动鼠标唤起 -->
    <transition name="screen-fade">
      <div v-show="toolbarVisible" class="screen-toolbar">
        <span class="toolbar-title">{{ toolbarTitle }}</span>
        <span class="toolbar-clock">{{ nowText }}</span>
        <el-button link class="toolbar-btn" @click="toggleFullscreen">
          <el-icon><FullScreen /></el-icon>
        </el-button>
        <el-button link class="toolbar-btn" @click="back">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, FullScreen } from '@element-plus/icons-vue'
import { getDashboardList } from '@/api/dashboard'
import { useBiEditorStore } from '@/stores/bi-editor'
import { useLinkageStore } from '@/stores/linkage'
import DashboardScreen from '@/views/preview/components/DashboardScreen.vue'

const route = useRoute()
const router = useRouter()
const store = useBiEditorStore()
const linkageStore = useLinkageStore()

const loading = ref(false)
const loadError = ref('')
const nowText = ref('')
const toolbarVisible = ref(true)
const selectedId = ref<number | null>(null)
const dashboardOptions = ref<{ id: number; name: string }[]>([])

/** 仅接受正整数 ID；无效 ID（如旧版 /screen/demo）回退为看板选择 */
const dashboardId = computed(() => {
  const id = Number(route.params.id)
  return Number.isInteger(id) && id > 0 ? id : 0
})

const toolbarTitle = computed(() => {
  if (!dashboardId.value) return '数据大屏'
  return store.dashboardName || '数据大屏'
})

let clockTimer: number | undefined
let hideTimer: number | undefined

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function tickClock() {
  const d = new Date()
  nowText.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function scheduleHide() {
  if (hideTimer) window.clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => {
    toolbarVisible.value = false
  }, 3000)
}

function revealToolbar() {
  toolbarVisible.value = true
  scheduleHide()
}

function hideToolbar() {
  if (hideTimer) window.clearTimeout(hideTimer)
  toolbarVisible.value = false
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    void document.documentElement.requestFullscreen?.()
  } else {
    void document.exitFullscreen?.()
  }
}

function back() {
  if (window.history.length > 1) router.back()
  else router.push('/dashboard')
}

function enterScreen() {
  if (!selectedId.value) return
  router.push(`/screen/${selectedId.value}`)
}

async function loadDashboardOptions() {
  try {
    const res = await getDashboardList({ page: 1, pageSize: 200 })
    dashboardOptions.value = (res.data.list ?? []).map((item) => ({
      id: item.id,
      name: item.name,
    }))
  } catch {
    // 下拉加载失败时不阻断页面，用户可通过地址栏指定看板
  }
}

async function handleRoute() {
  loadError.value = ''
  if (!dashboardId.value) {
    selectedId.value = null
    await loadDashboardOptions()
    return
  }
  loading.value = true
  try {
    await store.loadDashboard(dashboardId.value)
  } catch {
    loadError.value = '看板加载失败，可能已被删除或无访问权限'
  } finally {
    loading.value = false
  }
}

watch(dashboardId, () => {
  void handleRoute()
})

onMounted(async () => {
  // 大屏内允许图表点击联动/钻取，与预览保持一致
  linkageStore.setLinkageEnabled(true)
  tickClock()
  clockTimer = window.setInterval(tickClock, 1000)
  revealToolbar()
  await handleRoute()
})

onUnmounted(() => {
  linkageStore.setLinkageEnabled(false)
  if (clockTimer) window.clearInterval(clockTimer)
  if (hideTimer) window.clearTimeout(hideTimer)
})
</script>

<style scoped lang="less">
.screen-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #05070f;
  /* 大屏主题变量：覆盖全局浅色画布背景/网格/边框 */
  --bi-bg: #05070f;
  --bi-grid-color: rgba(110, 160, 255, 0.05);
  --bi-grid-size: 48px;
  --bi-border-color: rgba(110, 160, 255, 0.18);
  --bi-shadow-md: 0 0 40px rgba(0, 0, 0, 0.55);
}

.screen-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 0%, rgba(0, 140, 255, 0.16), transparent 55%),
    radial-gradient(circle at 50% 100%, rgba(0, 220, 255, 0.08), transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.screen-page > :deep(.dashboard-screen-wrapper) {
  position: relative;
  z-index: 1;
}

.screen-picker,
.screen-error {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-card {
  width: 420px;
  max-width: calc(100vw - 48px);
  padding: 32px;
  border: 1px solid rgba(110, 160, 255, 0.24);
  border-radius: 12px;
  background: rgba(10, 18, 34, 0.82);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
  text-align: center;
}

.picker-title {
  font-size: 24px;
  font-weight: 600;
  color: #e8f3ff;
  letter-spacing: 2px;
}

.picker-desc {
  margin: 12px 0 24px;
  font-size: 13px;
  color: rgba(200, 220, 255, 0.65);
}

.picker-select {
  width: 100%;
  margin-bottom: 20px;
}

.screen-error :deep(.el-empty__description p) {
  color: rgba(220, 235, 255, 0.75);
}

.screen-toolbar {
  position: absolute;
  top: 20px;
  right: 28px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 16px;
  height: 44px;
  padding: 0 18px;
  border: 1px solid rgba(110, 160, 255, 0.24);
  border-radius: 22px;
  background: rgba(8, 14, 26, 0.72);
  backdrop-filter: blur(10px);
}

.toolbar-title {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: #e8f3ff;
}

.toolbar-clock {
  font-size: 13px;
  color: rgba(190, 215, 255, 0.72);
  font-variant-numeric: tabular-nums;
}

.toolbar-btn {
  margin: 0;
  padding: 0;
  color: rgba(220, 238, 255, 0.82);

  &:hover {
    color: #00eaff;
  }
}

.screen-fade-enter-active,
.screen-fade-leave-active {
  transition: opacity 0.2s ease;
}

.screen-fade-enter-from,
.screen-fade-leave-to {
  opacity: 0;
}
</style>
