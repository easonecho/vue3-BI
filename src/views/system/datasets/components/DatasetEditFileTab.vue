<template>
  <div>
    <div v-if="fileData" class="file-meta">
      <div class="file-meta__row">
        <span class="file-meta__label">当前文件</span>
        <code>{{ fileData.fileName || '-' }}</code>
      </div>
      <div class="file-meta__row">
        <span class="file-meta__label">数据规模</span>
        <span>{{ fileData.rowCount ?? 0 }} 行</span>
      </div>
      <div class="file-meta__row">
        <span class="file-meta__label">更新时间</span>
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
          <el-icon><Upload /></el-icon>&nbsp;选择新的数据文件
        </el-button>
        <template #tip>
          <div style="color: #9ca3af; font-size: 12px; margin-top: 4px">
            支持 .xlsx / .csv, 最大 10MB、5 万行; 替换后立即生效并清理缓存
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
      替换数据文件
    </el-button>
    <el-divider />
    <el-button :disabled="!datasetId" @click="previewCurrentDataset">
      预览数据 (前 100 行)
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
    ElMessage.success(`数据已替换: ${result.rowCount} 行 / ${result.columns?.length ?? 0} 列`)
    replaceFile.value = null
    emit('update:fileData', {
      fileName: result.fileName,
      fileSize: 0,
      rowCount: result.rowCount,
      updatedAt: new Date().toISOString(),
    })
    emit('saved')
  } catch (e: any) {
    ElMessage.error(e?.message || '替换失败')
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
