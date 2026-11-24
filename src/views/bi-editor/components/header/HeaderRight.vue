<template>
  <div class="header-right">
    <el-tooltip :content="t('editorUi.header.exportJsonTip')" placement="bottom">
      <el-button @click="handleExportJson">
        <el-icon><Download /></el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip :content="t('editorUi.header.importJsonTip')" placement="bottom">
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
      <span>{{ t('editorUi.header.preview') }}</span>
    </el-button>
    <el-button :loading="store.isExportingPng" @click="handleExportPng">
      <el-icon><Picture /></el-icon>
      <span>{{ t('editorUi.header.exportPng') }}</span>
    </el-button>
    <el-tooltip :content="t('editorUi.header.exportPdfTip')" placement="bottom">
      <el-button :loading="store.isExportingPng" @click="handleExportPdf">
        <el-icon><Printer /></el-icon>
        <span>{{ t('editorUi.header.exportPdf') }}</span>
      </el-button>
    </el-tooltip>
    <el-tooltip
      v-if="!store.isTemplateMode"
      :content="t('editorUi.header.saveAsTip')"
      placement="bottom"
    >
      <el-button :loading="store.isSaving" @click="handleSaveAs">
        <el-icon><Collection /></el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip :content="t('editorUi.header.saveTip')" placement="bottom">
      <el-button type="primary" :loading="store.isSaving" @click="handleSave">
        <el-icon><FolderChecked /></el-icon>
        <span>{{ t('editorUi.header.save') }}</span>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Upload,
  Download,
  Collection,
  View,
  FolderChecked,
  Picture,
  Printer,
} from '@element-plus/icons-vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import { useHeaderDocumentActions } from '@/views/bi-editor/composables/useHeaderDocumentActions'
import { useHeaderExport } from '@/views/bi-editor/composables/useHeaderExport'

const emit = defineEmits<{ 'open-template-dialog': [] }>()

const store = useBiEditorStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const importJsonInputRef = ref<HTMLInputElement | null>(null)

const { handleSave, handleSaveAs, handlePreview, handleExportJson, onImportJsonFile } =
  useHeaderDocumentActions({
    store,
    route,
    router,
    openTemplateDialog: () => emit('open-template-dialog'),
  })

const { handleExportPng, handleExportPdf } = useHeaderExport(store)

function triggerImportJson() {
  importJsonInputRef.value?.click()
}

// 🔑 全局快捷键：Ctrl+S / Ctrl+Shift+S（由 useCanvas 派发 CustomEvent）
function onSaveEvent() {
  void handleSave()
}
function onSaveAsEvent() {
  void handleSaveAs()
}
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
</style>
