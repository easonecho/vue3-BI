<template>
  <div>
    <div v-if="fileData" class="file-meta">
      <div class="file-meta__row">
        <span class="file-meta__label">{{ t('datasetPage.fileTab.currentFile') }}</span>
        <code>{{ fileData.fileName || '-' }}</code>
      </div>
      <div class="file-meta__row">
        <span class="file-meta__label">{{ t('datasetPage.fileTab.dataScale') }}</span>
        <span>{{ t('datasetPage.fileTab.rows', { count: fileData.rowCount ?? 0 }) }}</span>
      </div>
      <div class="file-meta__row">
        <span class="file-meta__label">{{ t('datasetPage.fileTab.updatedAt') }}</span>
        <span>{{ formatFileTime(fileData.updatedAt) }}</span>
      </div>
    </div>
    <div style="margin: 12px 0">
      <el-upload
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.csv"
        :on-change="onReplaceFileChange"
        :on-remove="() => (replaceFile = null)"
        :file-list="replaceFile ? [{ name: replaceFile.name }] : []"
      >
        <el-button size="small" type="primary" plain>
          <el-icon><Upload /></el-icon>&nbsp;{{ t('datasetPage.fileTab.chooseFile') }}
        </el-button>
        <template #tip>
          <div style="color: #9ca3af; font-size: 12px; margin-top: 4px">
            {{ t('datasetPage.fileTab.uploadTip') }}
          </div>
        </template>
      </el-upload>
    </div>
    <el-button
      type="success"
      :loading="replacing"
      :disabled="!replaceFile"
      @click="handleReplaceConfirm"
    >
      {{ t('datasetPage.fileTab.replace') }}
    </el-button>
    <el-divider />
    <el-button :disabled="!datasetId" @click="previewCurrentDataset">
      {{ t('datasetPage.fileTab.preview') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { replaceDatasetData } from '@/api/dataset'
import type { Dataset } from '@/api/types'
import { formatFileTime, validateUploadFile } from '../utils/dataset-edit-utils'

const props = defineProps<{
  datasetId?: number
  fileData?: Dataset['fileData']
}>()

const emit = defineEmits<{
  saved: []
  'update:fileData': [fileData: Dataset['fileData']]
  'preview-dataset': [id: number]
}>()

const replacing = ref(false)
const replaceFile = ref<File | null>(null)

const { t } = useI18n()

function onReplaceFileChange(file: UploadFile) {
  const raw = (file.raw as File) ?? undefined
  const result = validateUploadFile(raw)
  if (!result.ok) {
    if (result.message) ElMessage.error(result.message)
    return
  }
  replaceFile.value = raw ?? null
}

async function handleReplaceConfirm() {
  if (!replaceFile.value || !props.datasetId) return
  replacing.value = true
  try {
    const result = await replaceDatasetData(props.datasetId, replaceFile.value)
    ElMessage.success(
      t('datasetPage.fileTab.replaceSuccess', {
        rows: result.rowCount,
        cols: result.columns?.length ?? 0,
      }),
    )
    replaceFile.value = null
    emit('update:fileData', {
      fileName: result.fileName,
      fileSize: 0,
      rowCount: result.rowCount,
      updatedAt: new Date().toISOString(),
    })
    emit('saved')
  } catch (e: any) {
    ElMessage.error(e?.message || t('datasetPage.fileTab.replaceFailed'))
  } finally {
    replacing.value = false
  }
}

function previewCurrentDataset() {
  if (props.datasetId) emit('preview-dataset', props.datasetId)
}
</script>

<style scoped lang="less">
.file-meta {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px 14px;
  .file-meta__row {
    display: flex;
    align-items: center;
    line-height: 26px;
    font-size: 13px;
  }
  .file-meta__label {
    width: 76px;
    color: #6b7280;
    flex-shrink: 0;
  }
}
</style>
