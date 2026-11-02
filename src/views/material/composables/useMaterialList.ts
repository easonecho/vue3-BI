import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  deleteMaterial,
  getMaterialList,
  type Material,
  type MaterialType,
} from '@/api/material'
import { errorMessage } from '../utils/material-utils'

/**
 * 🔑 素材列表 / 筛选 / 分页 / 删除逻辑。
 *
 * 从 material/index.vue 抽出，页面只保留组合与模板结构。
 */
export function useMaterialList() {
  const list = ref<Material[]>([])
  const loading = ref(false)
  const page = ref(1)
  const pageSize = ref(12)
  const total = ref(0)

  const filters = reactive({
    keyword: '',
    type: '' as '' | MaterialType,
  })

  async function loadList() {
    loading.value = true
    try {
      const res = await getMaterialList({
        page: page.value,
        pageSize: pageSize.value,
        type: filters.type || undefined,
        keyword: filters.keyword || undefined,
      })
      list.value = res.data.list
      total.value = res.data.total
    } catch (e) {
      ElMessage.error(errorMessage(e, '加载素材列表失败'))
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    page.value = 1
    loadList()
  }

  function handleReset() {
    filters.keyword = ''
    filters.type = ''
    page.value = 1
    loadList()
  }

  async function handleDelete(m: Material) {
    try {
      await deleteMaterial(m.id)
      ElMessage.success('删除成功')
      // 若当前页删除后空了，回退一页
      if (list.value.length === 1 && page.value > 1) {
        page.value--
      }
      await loadList()
    } catch (e) {
      ElMessage.error(errorMessage(e, '删除失败'))
    }
  }

  /** 上传成功后回到第一页并刷新 */
  function reloadFromFirstPage() {
    page.value = 1
    return loadList()
  }

  return {
    list,
    loading,
    page,
    pageSize,
    total,
    filters,
    loadList,
    handleSearch,
    handleReset,
    handleDelete,
    reloadFromFirstPage,
  }
}
