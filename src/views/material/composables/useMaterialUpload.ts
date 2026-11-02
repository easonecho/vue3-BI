import { reactive, ref } from 'vue'
import { ElMessage, type UploadFile, type UploadInstance } from 'element-plus'
import { uploadMaterial, type MaterialType } from '@/api/material'
import {
  errorMessage,
  fileBaseName,
  inferMaterialType,
} from '../utils/material-utils'

export interface MaterialUploadDeps {
  /** 上传成功后的回调（关闭对话框、通知父级刷新列表） */
  onSuccess: () => void | Promise<void>
}

/**
 * 🔑 素材上传表单与提交逻辑。
 *
 * 由 MaterialUploadDialog 内部使用；打开对话框时调用 resetForm 复用初始状态。
 */
export function useMaterialUpload(deps: MaterialUploadDeps) {
  const uploading = ref(false)
  const uploadRef = ref<UploadInstance>()

  const form = reactive({
    file: null as File | null,
    name: '',
    type: 'image' as MaterialType,
    description: '',
  })

  const rules = {
    file: [{ required: true, message: '请选择文件', trigger: 'change' }],
    type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  }

  const acceptString = 'video/*,image/*,.svg,.json'

  function resetForm() {
    form.file = null
    form.name = ''
    form.type = 'image'
    form.description = ''
  }

  function onFileChange(file: UploadFile) {
    if (!file.raw) return
    form.file = file.raw
    // 根据文件类型自动推断
    form.type = inferMaterialType(file.raw.type)
    // 自动填充名称
    if (!form.name) {
      form.name = fileBaseName(file.raw.name)
    }
  }

  function onFileExceed() {
    ElMessage.warning('一次只能上传一个文件，请先删除已选文件')
  }

  async function submitUpload(): Promise<boolean> {
    if (!form.file) {
      ElMessage.warning('请先选择文件')
      return false
    }
    uploading.value = true
    try {
      await uploadMaterial(form.file, {
        name: form.name || undefined,
        type: form.type,
        description: form.description || undefined,
      })
      ElMessage.success('上传成功')
      uploadRef.value?.clearFiles()
      await deps.onSuccess()
      return true
    } catch (e) {
      ElMessage.error(errorMessage(e, '上传失败，请重试'))
      return false
    } finally {
      uploading.value = false
    }
  }

  return {
    uploading,
    uploadRef,
    form,
    rules,
    acceptString,
    resetForm,
    onFileChange,
    onFileExceed,
    submitUpload,
  }
}
