import { ref } from 'vue'
import { getMaterialDownloadUrl, type Material } from '@/api/material'

/**
 * 🔑 素材预览与下载逻辑。
 *
 * 从 material/index.vue 抽出，保持预览对话框与下载锚点行为不变。
 */
export function useMaterialPreview() {
  const previewVisible = ref(false)
  const previewMaterial = ref<Material | null>(null)

  function openPreview(m: Material) {
    previewMaterial.value = m
    previewVisible.value = true
  }

  function handleDownload(m?: Material | null) {
    if (!m) return
    const url = getMaterialDownloadUrl(m.id)
    const a = document.createElement('a')
    a.href = url
    a.download = m.originalName || m.name
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return { previewVisible, previewMaterial, openPreview, handleDownload }
}
