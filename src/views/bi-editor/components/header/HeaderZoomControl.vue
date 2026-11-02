<template>
  <div class="zoom-control">
    <el-tooltip content="缩小" placement="bottom">
      <el-button size="small" @click="zoomOut">
        <el-icon><ZoomOut /></el-icon>
      </el-button>
    </el-tooltip>
    <el-dropdown>
      <el-button size="small" class="zoom-display">
        <span>{{ Math.round(store.canvas.zoom * 100) }}%</span>
        <el-icon class="zoom-caret"><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="opt in zoomOptions"
            :key="opt.value"
            :class="{ 'is-active': store.canvas.zoom === opt.value }"
            @click="store.setZoom(opt.value)"
          >
            {{ opt.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-tooltip content="放大" placement="bottom">
      <el-button size="small" @click="zoomIn">
        <el-icon><ZoomIn /></el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip content="居中显示整张画布 (Ctrl+0 / 双击画布空白)" placement="bottom">
      <el-button size="small" @click="fitToScreen">
        <el-icon><ScaleToOriginal /></el-icon>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ScaleToOriginal, ZoomIn, ZoomOut } from '@element-plus/icons-vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import { useCanvasZoom } from '@/views/bi-editor/composables/useCanvas'

const store = useBiEditorStore()
const { zoomOptions, zoomIn, zoomOut } = useCanvasZoom()

/**
 * 派发全局事件：CanvasArea 监听并执行 fitToScreen；
 * 若监听器未就绪（首帧初始化前），50ms 内没收到 done 则兜底 resetViewport。
 */
function fitToScreen() {
  let taken = false
  const handler = () => { taken = true }
  window.addEventListener('bi-editor:fit-to-screen-done', handler, { once: true })
  window.dispatchEvent(new CustomEvent('bi-editor:fit-to-screen'))
  setTimeout(() => {
    window.removeEventListener('bi-editor:fit-to-screen-done', handler)
    if (!taken) store.resetViewport()
  }, 50)
}
</script>

<style scoped lang="less">
.zoom-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-display {
  min-width: 80px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px 0 10px;
  background: var(--bi-input-bg, #26262b) !important;
  border: 1px solid var(--bi-input-border, #3a3a42) !important;
  border-radius: 6px;
  box-shadow: none;
  color: var(--bi-text-primary, #f3f4f6) !important;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.zoom-display:hover,
.zoom-display:focus-visible {
  border-color: var(--bi-accent, #10b981) !important;
  background: var(--bi-input-bg, #26262b) !important;
}

.zoom-display:active {
  border-color: var(--bi-accent, #10b981) !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--bi-accent, #10b981) 22%, transparent) !important;
  background: var(--bi-input-bg, #26262b) !important;
}

.zoom-display .zoom-caret {
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
  margin-top: 1px;
  transition: transform 0.15s ease, color 0.15s ease;
}

.zoom-display:hover .zoom-caret {
  color: var(--bi-accent, #10b981);
  transform: translateY(1px);
}
</style>
