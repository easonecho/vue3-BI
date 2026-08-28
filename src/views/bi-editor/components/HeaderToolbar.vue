<template>
  <div class="header-toolbar">
    <!-- Logo 区域 -->
    <div class="header-left">
      <div class="logo">
        <el-icon :size="24" color="#409EFF"><DataAnalysis /></el-icon>
        <span class="logo-text">{{ store.isTemplateMode ? '模板编辑器' : 'BI 编辑器' }}</span>
      </div>
      <el-divider direction="vertical" />
      <el-input
        v-model="store.dashboardName"
        class="file-name-input"
        size="small"
        :placeholder="'未命名报表'"
      />
      <span v-if="store.isDirty" class="dirty-dot" title="有未保存的修改"></span>
    </div>

    <!-- 操作按钮组（中间） -->
    <div class="header-center">
      <!-- 历史：撤销 / 重做 -->
      <el-button-group>
        <el-tooltip content="撤销 (Ctrl+Z)" placement="bottom">
          <el-button :disabled="!store.canUndo()" @click="store.undo()">
            <el-icon><RefreshLeft /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="重做 (Ctrl+Shift+Z / Ctrl+Y)" placement="bottom">
          <el-button :disabled="!store.canRedo()" @click="store.redo()">
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" />

      <!-- 组件操作：复制 / 删除 / 全选 -->
      <el-button-group>
        <el-tooltip :content="`复制 (Ctrl+D)${hasMulti ? ` ×${selectedIds.length}` : ''}`" placement="bottom">
          <el-button :disabled="!hasSelection" @click="handleDuplicate">
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip :content="`删除 (Delete / Backspace)${hasMulti ? ` ×${selectedIds.length}` : ''}`" placement="bottom">
          <el-button :disabled="!hasSelection" @click="handleDelete">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" />

      <!-- 图层顺序：置顶 / 上移一层 / 下移一层 / 置底
           单选：沿用原有的 canBringToFront 等精细判断；
           多选：放宽为「有选中 + 未全锁定，且至少有 1 个组件可操作」即可 -->
      <el-button-group>
        <el-tooltip content="置顶" placement="bottom">
          <el-button :disabled="!hasSelection || (hasMulti ? false : !store.canBringToFront)" @click="handleBringToFront">
            <el-icon><Top /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="上移一层" placement="bottom">
          <el-button :disabled="!hasSelection || (hasMulti ? false : !store.canMoveUp)" @click="handleMoveUp">
            <el-icon><ArrowUp /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="下移一层" placement="bottom">
          <el-button :disabled="!hasSelection || (hasMulti ? false : !store.canMoveDown)" @click="handleMoveDown">
            <el-icon><ArrowDown /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="置底" placement="bottom">
          <el-button :disabled="!hasSelection || (hasMulti ? false : !store.canSendToBack)" @click="handleSendToBack">
            <el-icon><Bottom /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" />

      <!-- 视图控制：标尺 / 网格 / 网格吸附 / 辅助线 / 清空辅助线 -->
      <el-button-group>
        <el-tooltip content="标尺" placement="bottom">
          <el-button :type="store.canvas.showRuler ? 'primary' : 'default'" @click="toggleRuler">
            <el-icon><Rank /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="网格点" placement="bottom">
          <el-button :type="store.canvas.showGrid ? 'primary' : 'default'" @click="toggleGrid">
            <el-icon><Grid /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="网格吸附" placement="bottom">
          <el-button :type="store.canvas.snapToGrid ? 'primary' : 'default'" @click="toggleSnap">
            <el-icon><Magnet /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="辅助线显示" placement="bottom">
          <el-button :type="store.canvas.showGuides ? 'primary' : 'default'" @click="toggleGuides">
            <el-icon><Guide /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="清空所有辅助线" placement="bottom">
          <el-button :disabled="!store.guides.length" @click="handleClearGuides">
            <el-icon><CircleClose /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-divider direction="vertical" />

      <!-- 缩放控制：ZoomOut / 下拉档位 / ZoomIn / 还原画布 -->
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
          <el-button size="small" @click="handleFitToScreen">
            <el-icon><ScaleToOriginal /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 右侧操作：备份JSON / 预览 / 导出PNG / 保存 -->
    <div class="header-right">
      <el-tooltip content="导出布局 JSON（备份）" placement="bottom">
        <el-button @click="handleExportJson">
          <el-icon><Download /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="导入布局 JSON（恢复）" placement="bottom">
        <el-button @click="triggerImportJson">
          <el-icon><Upload /></el-icon>
        </el-button>
      </el-tooltip>
      <input
        ref="importJsonInputRef"
        type="file"
        accept="application/json,.json"
        style="display: none"
        @change="onImportJsonFile"
      />
      <el-button v-if="!store.isTemplateMode" @click="handlePreview">
        <el-icon><View /></el-icon>
        <span>预览</span>
      </el-button>
      <el-button :loading="store.isExportingPng" @click="handleExportPng">
        <el-icon><Picture /></el-icon>
        <span>导出 PNG</span>
      </el-button>
      <el-tooltip v-if="!store.isTemplateMode" content="另存为 (Ctrl+Shift+S)" placement="bottom">
        <el-button :loading="store.isSaving" @click="handleSaveAs">
          <el-icon><Collection /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="保存 (Ctrl+S)" placement="bottom">
        <el-button type="primary" :loading="store.isSaving" @click="handleSave">
          <el-icon><FolderChecked /></el-icon>
          <span>保存</span>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 🔑 模板编辑模式：保存时收集元数据 -->
    <el-dialog
      v-model="templateMetaVisible"
      title="保存模板"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="templateMeta" label-width="80px">
        <el-form-item label="模板名称">
          <el-input v-model="store.dashboardName" placeholder="请输入模板名称" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="templateMeta.description" type="textarea" :rows="3" placeholder="可选, 模板用途说明" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="templateMeta.category" placeholder="选择分类" clearable style="width: 100%">
            <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否公开">
          <el-switch v-model="templateMeta.isPublic" />
          <span class="form-hint">公开模板其他用户可用</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateMetaVisible = false">取消</el-button>
        <el-button type="primary" :loading="store.isSaving" @click="confirmSaveTemplate">保存模板</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis,
  RefreshLeft,
  RefreshRight,
  Upload,
  Download,
  CopyDocument,
  Delete,
  Collection,
  Top,
  Bottom,
  ArrowUp,
  ArrowDown,
  View,
  Hide,
  Lock,
  Unlock,
  Rank,
  Grid,
  Magnet,
  Guide,
  CircleClose,
  ZoomIn,
  ZoomOut,
  FolderChecked,
  ScaleToOriginal,
  Picture,
} from '@element-plus/icons-vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import { useCanvasZoom } from '@/views/bi-editor/composables/useCanvas'
import { getTemplateCategories, type TemplateCategoryOption } from '@/api/dashboard-template'

const route = useRoute()
const router = useRouter()
const store = useBiEditorStore()

// 🔑 模板编辑模式：保存元数据
const templateMetaVisible = ref(false)
const templateMeta = reactive({
  description: '',
  category: undefined as string | undefined,
  isPublic: true,
})
const categoryOptions = ref<TemplateCategoryOption[]>([])
const { zoomOptions, zoomIn, zoomOut } = useCanvasZoom()
const importJsonInputRef = ref<HTMLInputElement | null>(null)

// ========== Convenience computed for selected component's visible / locked state ==========
const currentVisible = computed(() => store.selectedComponent?.visible ?? true)
const currentLocked = computed(() => store.selectedComponent?.locked ?? false)

/** 🔑 当前选中 id 列表（多选 > 单选）供 disabled 与批量操作共用 */
const selectedIds = computed(() =>
  store.selectedIds.length > 0
    ? [...store.selectedIds]
    : store.selectedId
      ? [store.selectedId]
      : [],
)
const hasSelection = computed(() => selectedIds.value.length > 0)
const hasMulti = computed(() => selectedIds.value.length >= 2)

// ========== 视图开关 ==========
function toggleRuler() {
  store.updateCanvas({ showRuler: !store.canvas.showRuler })
}
function toggleGrid() {
  store.updateCanvas({ showGrid: !store.canvas.showGrid })
}
function toggleSnap() {
  store.updateCanvas({ snapToGrid: !store.canvas.snapToGrid })
}
function toggleGuides() {
  store.updateCanvas({ showGuides: !store.canvas.showGuides })
}
// ========== 组件操作（单选 + 多选） ==========
function handleDuplicate() {
  for (const id of selectedIds.value) store.duplicateComponent(id)
}
function handleDelete() {
  const deletable = selectedIds.value.filter((id) => {
    const c = store.components.find((x) => x.id === id)
    return !!c && !c.locked
  })
  deletable.forEach((id) => store.removeComponent(id))
  if (deletable.length > 0) store.clearSelection()
}
// ========== 图层顺序（多选时按当前选中集合整体移动，保持集合内相对顺序） ==========
function bringSelectionToFront() {
  // 🔑 按 z-index 从小到大依次置顶，保证最后一个置顶的是 z-index 最大的那个（保持视觉序）
  const sorted = [...selectedIds.value]
    .map((id) => store.components.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c && !c.locked)
    .sort((a, b) => a.zIndex - b.zIndex)
  sorted.forEach((c) => store.bringToFront(c.id))
}
function sendSelectionToBack() {
  const sorted = [...selectedIds.value]
    .map((id) => store.components.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c && !c.locked)
    .sort((a, b) => b.zIndex - a.zIndex) // z 大的先置底
  sorted.forEach((c) => store.sendToBack(c.id))
}
function moveSelectionUp() {
  const sorted = [...selectedIds.value]
    .map((id) => store.components.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c && !c.locked)
    .sort((a, b) => b.zIndex - a.zIndex) // z 大的先 move
  sorted.forEach((c) => store.moveUp(c.id))
}
function moveSelectionDown() {
  const sorted = [...selectedIds.value]
    .map((id) => store.components.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c && !c.locked)
    .sort((a, b) => a.zIndex - b.zIndex)
  sorted.forEach((c) => store.moveDown(c.id))
}
function handleBringToFront() {
  bringSelectionToFront()
}
function handleSendToBack() {
  sendSelectionToBack()
}
function handleMoveUp() {
  moveSelectionUp()
}
function handleMoveDown() {
  moveSelectionDown()
}

// ========== 辅助线 ==========
function handleClearGuides() {
  if (store.guides.length) store.clearGuides()
}

// ========== 视口 ==========
function handleFitToScreen() {
  // 派发全局事件：CanvasArea 监听并执行 fitToScreen；若监听器未就绪（首帧初始化前），兜底 resetViewport
  let taken = false
  const handler = () => { taken = true }
  window.addEventListener('bi-editor:fit-to-screen-done', handler, { once: true })
  window.dispatchEvent(new CustomEvent('bi-editor:fit-to-screen'))
  // 30ms 内没收到 done 则 fallback 到 resetViewport（视口 = 1:1 默认居中）
  setTimeout(() => {
    window.removeEventListener('bi-editor:fit-to-screen-done', handler)
    if (!taken) store.resetViewport()
  }, 50)
}

// ========== 预览 / 保存 ==========
async function handleSave() {
  // 🔑 模板编辑模式：打开元数据对话框走 saveTemplate
  if (store.isTemplateMode) {
    openTemplateMetaDialog()
    return
  }
  try {
    await store.saveDashboard()
    // 🔑 新建保存后 URL 还停留在 /bi-editor(无 id),用 replace 补上 id
    //   这样刷新页面能正确加载刚创建的看板,而非进入新建态
    if (route.params.id == null && store.currentDashboardId != null) {
      router.replace(`/bi-editor/${store.currentDashboardId}`)
    }
  } catch {
    // 错误提示由 request 拦截器统一处理,这里只需吞掉避免 unhandled rejection
  }
}

// ========== 🔑 模板编辑模式：保存元数据 ==========
function openTemplateMetaDialog() {
  // 预填当前 store 中的模板元数据
  templateMeta.description = store.templateDescription
  templateMeta.category = store.templateCategory
  templateMeta.isPublic = store.templateIsPublic
  templateMetaVisible.value = true
}

async function confirmSaveTemplate() {
  try {
    const res = await store.saveTemplate({
      description: templateMeta.description,
      category: templateMeta.category,
      isPublic: templateMeta.isPublic,
    })
    if (!res) return
    // 🔑 新建模板保存后 URL 停留在 /bi-editor-template(无 id),用 replace 补上 id
    if (route.params.id == null && store.currentTemplateId != null) {
      router.replace(`/bi-editor-template/${store.currentTemplateId}`)
    }
    templateMetaVisible.value = false
  } catch {
    // 错误提示由 request 拦截器统一处理
  }
}

onMounted(() => {
  // 🔑 加载模板分类枚举（模板模式保存对话框使用；列表很小，无条件加载）
  getTemplateCategories()
    .then((r) => {
      categoryOptions.value = r.data
    })
    .catch(() => {
      // 加载失败不阻断：保存对话框分类项为空即可
    })
})

/** 🔑 另存为：通过 reset currentDashboardId 后重新保存（后端会生成新看板） */
async function handleSaveAs() {
  // 🔑 模板模式下另存为已禁用（按钮隐藏），快捷键触发时直接忽略
  if (store.isTemplateMode) return
  try {
    store.setDashboardId(null)
    store.setDashboardName(
      (store.dashboardName || '未命名看板') + ' 的副本',
    )
    await store.saveDashboard()
    if (store.currentDashboardId != null) {
      router.replace(`/bi-editor/${store.currentDashboardId}`)
      ElMessage.success('已另存为新看板 🎉')
    }
  } catch {
    // 同上
  }
}

function handlePreview() {
  // 🔑 未保存的看板没有 id,无法预览,提示先保存
  if (store.currentDashboardId == null) {
    ElMessage.warning('请先保存看板后再预览')
    return
  }
  // 🔑 有未保存改动时提示,但仍允许预览(用户可能想看当前编辑态 vs 已保存态)
  if (store.isDirty) {
    ElMessage.info('当前有未保存的修改,预览展示的是已保存版本')
  }
  router.push(`/preview/${store.currentDashboardId}`)
}

// ========== 🔑 导入/导出布局 JSON ==========
function handleExportJson() {
  const layout = store.serializeLayout()
  const blob = new Blob([JSON.stringify(layout, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safe = (store.dashboardName || 'vue3-bi 布局').replace(/[\\/:*?"<>|]/g, '_')
  const ts = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}`
  a.href = url
  a.download = `${safe}_${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('布局 JSON 已导出 📦')
}
function triggerImportJson() {
  importJsonInputRef.value?.click()
}
async function onImportJsonFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 重置,保证下一次选同文件也会触发
  if (!file) return
  try {
    await ElMessageBox.confirm(
      `导入后将覆盖当前画布的所有组件、画布尺寸、辅助线。\n当前未保存的改动会被覆盖，是否继续？`,
      '导入布局 JSON',
      {
        confirmButtonText: '确定覆盖导入',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch {
    return
  }
  try {
    const text = await file.text()
    const layout = JSON.parse(text)
    if (!layout || typeof layout !== 'object') throw new Error('JSON 结构非法')
    store.applyLayout(layout as any)
    // 🔑 导入后另存为新看板：currentDashboardId = null，下次 save 会产生新记录
    store.setDashboardId(null)
    store.setDashboardName((store.dashboardName || '未命名') + '（已导入）')
    ElMessage.success(`已从 ${file.name} 导入布局 ✨`)
  } catch (err) {
    console.error('[HeaderToolbar] import JSON failed', err)
    ElMessage.error(`导入失败：${(err as Error).message || 'JSON 解析错误'}`)
  }
}

// ========== 画布导出 PNG ==========
async function handleExportPng() {
  if (store.components.length === 0) {
    ElMessage.warning('画布上还没有组件，无法导出')
    return
  }
  try {
    const ok = await store.exportCanvasAsPng()
    if (ok) {
      ElMessage.success('PNG 已开始下载 🎉')
    } else {
      ElMessage.error('导出 PNG 失败，请刷新后重试')
    }
  } catch (e) {
    console.error('[HeaderToolbar] export PNG failed', e)
    ElMessage.error('导出 PNG 失败')
  }
}

// ========== 🔑 全局快捷键：Ctrl+S / Ctrl+Shift+S（由 useCanvas 派发 CustomEvent） ==========
function onSaveEvent() { handleSave() }
function onSaveAsEvent() { handleSaveAs() }
onMounted(() => {
  window.addEventListener('bi-editor:save', onSaveEvent)
  window.addEventListener('bi-editor:save-as', onSaveAsEvent)
})
onBeforeUnmount(() => {
  window.removeEventListener('bi-editor:save', onSaveEvent)
  window.removeEventListener('bi-editor:save-as', onSaveAsEvent)
})
</script>

<style scoped lang="less">
.header-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--bi-header-bg, #1f2937);
  border-bottom: 1px solid var(--bi-border-color, #374151);
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--bi-text-primary, #f3f4f6);
}

.file-name {
  color: var(--bi-text-secondary, #9ca3af);
  font-size: 14px;
}

/* 🔑 文件名输入框:透明背景,聚焦时才显示边框,视觉上接近纯文本 */
.file-name-input {
  width: 180px;
}

.file-name-input :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none;
}

.file-name-input :deep(.el-input__wrapper:hover),
.file-name-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--bi-border-color, #4b5563) inset;
}

.file-name-input :deep(.el-input__inner) {
  color: var(--bi-text-primary, #f3f4f6);
  font-size: 14px;
}

/* 🔑 脏状态圆点:有未保存改动时显示 */
.dirty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bi-accent, #409eff);
  display: inline-block;
  flex-shrink: 0;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
  min-width: 0;
  overflow-x: auto;
  padding: 2px 4px;
}

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

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.header-right .el-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-button) {
  background: var(--bi-btn-bg, #374151);
  border-color: var(--bi-btn-border, #4b5563);
  color: var(--bi-text-primary, #f3f4f6);
}

:deep(.el-button:hover) {
  background: var(--bi-btn-hover, #4b5563);
  border-color: var(--bi-btn-border, #6b7280);
}

:deep(.el-button.is-disabled) {
  background: var(--bi-btn-disabled, #374151);
  opacity: 0.6;
}

:deep(.el-button--primary) {
  background-color: var(--el-button-bg-color, var(--bi-accent, #409eff));
  border-color: var(--el-button-border-color, var(--bi-accent, #409eff));
}

:deep(.el-divider--vertical) {
  background-color: var(--bi-border-color, #4b5563);
  height: 22px;
}
</style>
