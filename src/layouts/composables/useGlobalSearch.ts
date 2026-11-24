/**
 * 全局搜索逻辑
 *
 * 空关键字展示最近访问，输入关键字后防抖请求看板搜索，
 * 支持上下键切换与回车打开；数据请求通过依赖注入，便于单测。
 */
import { computed, ref } from 'vue'
import type { RecentDashboard } from '@/utils/recent-dashboards'

export const GLOBAL_SEARCH_LIMIT = 8
export const GLOBAL_SEARCH_DEBOUNCE = 250

export interface GlobalSearchItem {
  id: number
  name: string
  description?: string | null
  /** 是否来自最近访问 */
  recent?: boolean
}

export interface GlobalSearchDeps {
  fetchDashboards: (keyword: string) => Promise<GlobalSearchItem[]>
  readRecent: () => RecentDashboard[]
  debounceMs?: number
  limit?: number
}

export function useGlobalSearch(deps: GlobalSearchDeps) {
  const limit = deps.limit ?? GLOBAL_SEARCH_LIMIT
  const debounceMs = deps.debounceMs ?? GLOBAL_SEARCH_DEBOUNCE

  const keyword = ref('')
  const results = ref<GlobalSearchItem[]>([])
  const loading = ref(false)
  const activeIndex = ref(0)

  let timer: number | undefined
  let requestSeq = 0

  const hasQuery = computed(() => keyword.value.trim().length > 0)

  function cancelTimer() {
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timer = undefined
    }
  }

  function showRecent() {
    requestSeq += 1
    loading.value = false
    results.value = deps
      .readRecent()
      .slice(0, limit)
      .map((item) => ({ id: item.id, name: item.name, recent: true }))
    activeIndex.value = 0
  }

  async function runSearch(query: string) {
    const seq = ++requestSeq
    loading.value = true
    try {
      const list = await deps.fetchDashboards(query)
      if (seq !== requestSeq) return
      results.value = list.slice(0, limit)
      activeIndex.value = 0
    } catch {
      if (seq === requestSeq) results.value = []
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  /** 更新关键字：空值立即回退到最近访问，其余防抖搜索 */
  function setKeyword(value: string) {
    keyword.value = value
    activeIndex.value = 0
    cancelTimer()

    const query = value.trim()
    if (!query) {
      showRecent()
      return
    }

    loading.value = true
    timer = window.setTimeout(() => {
      timer = undefined
      void runSearch(query)
    }, debounceMs)
  }

  /** 打开弹窗时刷新最近访问（仅无关键字时） */
  function refreshRecent() {
    if (!hasQuery.value) showRecent()
  }

  function moveActive(delta: number) {
    const total = results.value.length
    if (total === 0) return
    activeIndex.value = (activeIndex.value + delta + total) % total
  }

  /** 当前选中项 ID，无结果时返回 null */
  function selectActive(): number | null {
    return results.value[activeIndex.value]?.id ?? null
  }

  /** 关闭弹窗时清理状态与未完成的防抖任务 */
  function reset() {
    cancelTimer()
    requestSeq += 1
    keyword.value = ''
    results.value = []
    loading.value = false
    activeIndex.value = 0
  }

  return {
    keyword,
    results,
    loading,
    activeIndex,
    hasQuery,
    setKeyword,
    refreshRecent,
    moveActive,
    selectActive,
    reset,
  }
}
