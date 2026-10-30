<template>
  <div class="code-config-actions">
    <el-button size="small" type="primary" plain :icon="CodeIcon" @click="openCodeDialog">
      编辑配置
    </el-button>
    <el-button size="small" :icon="DownloadIcon" @click="exportCode">导出</el-button>
    <el-upload :auto-upload="false" :show-file-list="false" accept=".json" @change="importCode">
      <el-button size="small" :icon="UploadIcon">导入</el-button>
    </el-upload>
  </div>
  <div class="code-config-hint">通过 JSON 代码编辑组件配置，支持导入导出</div>

  <!-- 🔑 代码编辑弹窗：单个 Monaco JSON 编辑器 -->
  <el-dialog
    v-model="codeDialogVisible"
    title="代码编辑配置"
    :width="codeFullscreen ? '100%' : '760px'"
    :fullscreen="codeFullscreen"
    :top="codeFullscreen ? '0' : '10vh'"
    append-to-body
    :close-on-click-modal="false"
    destroy-on-close
    class="code-dialog"
    @open="loadCodeText"
  >
    <template #header>
      <div class="code-dialog-header">
        <span class="code-dialog-title">代码编辑配置</span>
        <el-tooltip :content="codeFullscreen ? '退出全屏' : '全屏'" placement="top">
          <el-button
            class="code-fullscreen-btn"
            text
            :icon="codeFullscreen ? MinimizeIcon : FullScreenIcon"
            @click="codeFullscreen = !codeFullscreen"
          />
        </el-tooltip>
      </div>
    </template>
    <div class="code-toolbar">
      <span class="code-hint"
        >编辑配置 JSON（id/type 等字段已锁定，仅可编辑以下字段：{{ EDITABLE_FIELDS.join(', ') }}）</span
      >
      <el-button size="small" @click="formatCode">格式化</el-button>
    </div>
    <div v-if="codeError" class="code-error">⚠ {{ codeError }}</div>
    <MonacoEditor
      v-if="codeDialogVisible"
      v-model="codeText"
      language="json"
      :height="codeFullscreen ? 'calc(100vh - 220px)' : 480"
      @error="(e: string | null) => (codeError = e)"
      @save="applyCode"
    />
    <template #footer>
      <el-button @click="codeDialogVisible = false">关闭</el-button>
      <el-button type="primary" :disabled="!!codeError" @click="applyCode">应用</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import type { ComponentInstance } from '@/views/bi-editor/types'
import { useBiEditorStore } from '@/stores/bi-editor'
import MonacoEditor from '@/components/MonacoEditor.vue'
import {
  Document as CodeIcon,
  FullScreen as FullScreenIcon,
  Minus as MinimizeIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@element-plus/icons-vue'

const store = useBiEditorStore()

/** 可编辑字段白名单 */
const EDITABLE_FIELDS = [
  'name',
  'x',
  'y',
  'width',
  'height',
  'props',
  'style',
  'dataSource',
  'dataConfig',
] as const

/**
 * 🔑 读取组件上白名单字段的值（用于配置 JSON 的序列化）。
 *   字段名是运行时字符串，无法用 `comp[k]` 的联合索引，因此在本文件内收窄一次。
 */
function compFieldValue(comp: ComponentInstance, key: string): unknown {
  return (comp as unknown as Record<string, unknown>)[key]
}

/** 🔑 收集当前组件的可编辑字段（序列化用） */
function collectEditable(comp: ComponentInstance): Record<string, unknown> {
  const editable: Record<string, unknown> = {}
  for (const k of EDITABLE_FIELDS) {
    editable[k] = compFieldValue(comp, k)
  }
  return editable
}

/** 🔑 从解析结果中只挑白名单字段，保护 id/type 等不可变字段 */
function pickEditable(parsed: unknown): Record<string, unknown> {
  const updates: Record<string, unknown> = {}
  if (!parsed || typeof parsed !== 'object') return updates
  const src = parsed as Record<string, unknown>
  for (const k of EDITABLE_FIELDS) {
    if (k in src) updates[k] = src[k]
  }
  return updates
}

/** 弹窗显示状态 */
const codeDialogVisible = ref(false)
/** 弹窗是否全屏 */
const codeFullscreen = ref(false)
/** 代码编辑器内容（JSON 字符串） */
const codeText = ref('')
/** JSON 语法错误信息，无错误时为 null */
const codeError = ref<string | null>(null)

/** 打开代码编辑弹窗 */
function openCodeDialog() {
  if (!store.selectedComponent) return
  codeDialogVisible.value = true
}

/** 弹窗 open 事件触发：序列化当前选中组件的可编辑字段为 JSON */
function loadCodeText() {
  const comp = store.selectedComponent
  if (!comp) {
    codeText.value = ''
    codeError.value = null
    return
  }
  codeText.value = JSON.stringify(collectEditable(comp), null, 2)
  codeError.value = null
}

/** 反序列化：解析 JSON 并回写组件配置（只取白名单字段，保护不可变字段） */
function applyCode() {
  if (codeError.value || !store.selectedId) return
  try {
    store.updateComponent(store.selectedId, pickEditable(JSON.parse(codeText.value)))
    ElMessage.success('配置已应用')
  } catch (e) {
    codeError.value = (e as Error).message
  }
}

/** 格式化 JSON */
function formatCode() {
  try {
    codeText.value = JSON.stringify(JSON.parse(codeText.value), null, 2)
    codeError.value = null
  } catch (e) {
    codeError.value = (e as Error).message
  }
}

/** 🔑 导出当前组件配置为 JSON 文件 */
function exportCode() {
  const comp = store.selectedComponent
  if (!comp) {
    ElMessage.warning('请先选中一个组件')
    return
  }
  const json = JSON.stringify(collectEditable(comp), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${comp.name || 'component'}-config.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('配置已导出')
}

/** 🔑 从 JSON 文件导入配置并应用到当前选中组件 */
async function importCode(file: UploadFile) {
  if (!file.raw) return
  const comp = store.selectedComponent
  if (!comp) {
    ElMessage.warning('请先选中一个组件')
    return
  }
  try {
    const text = await file.raw.text()
    store.updateComponent(store.selectedId!, pickEditable(JSON.parse(text)))
    ElMessage.success('配置已导入并应用')
  } catch (e) {
    ElMessage.error(`导入失败：${(e as Error).message}`)
  }
}
</script>

<style scoped lang="less">
/* ====== 🔑 代码配置折叠项样式 ====== */
.code-config-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 4px 0 8px;
}

.code-config-hint {
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
  padding: 0 0 4px;
}

/* ====== 🔑 代码编辑弹窗样式 ====== */
.code-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 16px;
}

.code-dialog-title {
  font-size: 16px;
  font-weight: 600;
}

.code-fullscreen-btn {
  color: #909399;
}

.code-fullscreen-btn:hover {
  color: #409eff;
}

.code-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid #2d2d2d;
  background: #252526;
}

.code-hint {
  font-size: 12px;
  color: #909399;
  flex: 1;
  word-break: break-all;
}

.code-error {
  padding: 6px 8px;
  background: #fef0f0;
  color: #f56c6c;
  font-size: 12px;
  border-bottom: 1px solid #fde2e2;
  word-break: break-all;
}
</style>
