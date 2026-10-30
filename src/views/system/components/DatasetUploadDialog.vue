<template>
  <el-dialog
    v-model="visible"
    title="上传 Excel/CSV 创建数据集"
    width="520px"
    destroy-on-close
    @open="onOpen"
  >
    <el-form label-width="96px">
      <el-form-item label="数据集名称">
        <el-input v-model="uploadForm.name" maxlength="100" placeholder="留空则使用文件名" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="uploadForm.description"
          type="textarea"
          :rows="2"
          maxlength="500"
          placeholder="可选"
        />
      </el-form-item>
      <el-form-item label="数据文件" required>
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
          <div style="color: #6b7280; font-size: 13px">拖拽文件到此处, 或点击选择</div>
          <template #tip>
            <div style="color: #9ca3af; font-size: 12px">
              支持 .xlsx / .csv (首行为表头), 最大 10MB、5 万行、200 列
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="uploading"
        :disabled="!uploadForm.file"
        @click="handleUploadConfirm"
      >
        上传并创建
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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
    ElMessage.error(`不支持的文件格式 "${ext}", 仅支持 .xlsx / .csv`)
    return false
  }
  if (raw.size > 10 * 1024 * 1024) {
    ElMessage.error('文件超过 10MB 限制')
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
    ElMessage.success(`上传成功: ${result.rowCount} 行 / ${result.columns?.length ?? 0} 列`)
    visible.value = false
    emit('created')
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败')
  } finally {
    uploading.value = false
  }
}
</script>
