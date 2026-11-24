<template>
  <el-dialog
    v-model="visible"
    :title="t('datasetPage.upload.title')"
    width="520px"
    destroy-on-close
    @open="onOpen"
  >
    <el-form label-width="96px">
      <el-form-item :label="t('datasetPage.upload.nameLabel')">
        <el-input
          v-model="uploadForm.name"
          maxlength="100"
          :placeholder="t('datasetPage.upload.namePlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('datasetPage.upload.descriptionLabel')">
        <el-input
          v-model="uploadForm.description"
          type="textarea"
          :rows="2"
          maxlength="500"
          :placeholder="t('datasetPage.upload.descriptionPlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('datasetPage.upload.fileLabel')" required>
        <el-upload
          drag
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.csv"
          :on-change="onUploadFileChange"
          :on-remove="() => (uploadForm.file = null)"
          :file-list="uploadForm.file ? [{ name: uploadForm.file.name }] : []"
          style="width: 100%"
        >
          <el-icon style="font-size: 32px; color: #9ca3af"><Upload /></el-icon>
          <div style="color: #6b7280; font-size: 13px">{{ t('datasetPage.upload.dropHint') }}</div>
          <template #tip>
            <div style="color: #9ca3af; font-size: 12px">
              {{ t('datasetPage.upload.tip') }}
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button
        type="primary"
        :loading="uploading"
        :disabled="!uploadForm.file"
        @click="handleUploadConfirm"
      >
        {{ t('datasetPage.upload.submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { uploadDataset } from '@/api/dataset'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** 上传成功后通知父级刷新列表 */
  created: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const uploading = ref(false)

const { t } = useI18n()

const uploadForm = reactive<{ name: string; description: string; file: File | null }>({
  name: '',
  description: '',
  file: null,
})

function onOpen() {
  uploadForm.name = ''
  uploadForm.description = ''
  uploadForm.file = null
}

function onUploadFileChange(file: UploadFile) {
  if (!acceptUpload(file)) return
  uploadForm.file = (file.raw as File) ?? null
}

/** 前置校验: 扩展名 + 大小 (后端仍会校验) */
function acceptUpload(file: UploadFile): boolean {
  const raw = file.raw as File | undefined
  if (!raw) return false
  const ext = raw.name.slice(raw.name.lastIndexOf('.')).toLowerCase()
  if (ext !== '.xlsx' && ext !== '.csv') {
    ElMessage.error(t('datasetPage.upload.unsupportedFile', { ext }))
    return false
  }
  if (raw.size > 10 * 1024 * 1024) {
    ElMessage.error(t('datasetPage.upload.fileTooLarge'))
    return false
  }
  return true
}

async function handleUploadConfirm() {
  if (!uploadForm.file) return
  uploading.value = true
  try {
    const result = await uploadDataset(uploadForm.file, {
      name: uploadForm.name || undefined,
      description: uploadForm.description || undefined,
    })
    ElMessage.success(
      t('datasetPage.upload.success', {
        rows: result.rowCount,
        cols: result.columns?.length ?? 0,
      }),
    )
    visible.value = false
    emit('created')
  } catch (e: any) {
    ElMessage.error(e?.message || t('datasetPage.upload.failed'))
  } finally {
    uploading.value = false
  }
}
</script>
