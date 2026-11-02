import type { Ref } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

export interface ClipboardDeps {
  components: Ref<ComponentInstance[]>
  selectedId: Ref<string | null>
  selectedIds: Ref<string[]>
  pushHistory: () => void
}

export interface ClipboardApi {
  copyToClipboard: () => Promise<boolean>
  pasteFromClipboard: () => Promise<void>
}

/** 自定义 MIME：支持跨编辑器实例 / 跨页面粘贴组件 */
const BI_CLIPBOARD_MIME = 'application/x-vue3-bi-component'

/**
 * 🔑 组件剪贴板（Ctrl+C / Ctrl+V）。
 *
 *   - 模块内剪贴板：保存序列化后的组件快照，完全剥离 Proxy/响应式引用
 *   - 系统剪贴板：写入自定义 MIME 类型，读取失败时回退到模块内快照 / text/plain JSON
 *   - 粘贴时生成新 ID、位置偏移、重设 zIndex，并标记 dirty + 入历史
 */
export function createClipboard(deps: ClipboardDeps): ClipboardApi {
  const { components, selectedId, selectedIds, pushHistory } = deps

  let clipboardData: ComponentInstance[] | null = null

  /**
   * 复制选中组件到剪贴板。
   *   - 优先复制所有 selectedIds（多选）
   *   - 回退到 selectedId（单选）
   *   - 纯模块内：存储序列化后快照（完全剥离 Proxy/响应式引用）
   *   - 系统剪贴板：写入自定义 MIME 类型，支持跨实例粘贴
   */
  async function copyToClipboard() {
    const ids =
      selectedIds.value.length > 0
        ? [...selectedIds.value]
        : selectedId.value
          ? [selectedId.value]
          : []
    if (ids.length === 0) return false
    const serialized = JSON.stringify(
      ids
        .map((id) => components.value.find((c) => c.id === id))
        .filter(Boolean)
        .map((c) => ({ ...c })),
    )
    const parsed = JSON.parse(serialized) as ComponentInstance[]
    clipboardData = parsed

    // 🔑 尝试写入系统剪贴板（需要 https 或 localhost；失败静默忽略）
    try {
      if (navigator.clipboard && ClipboardItem) {
        const blob = new Blob([serialized], { type: BI_CLIPBOARD_MIME })
        const textBlob = new Blob([serialized], { type: 'text/plain' })
        await navigator.clipboard.write([
          new ClipboardItem({
            [BI_CLIPBOARD_MIME]: blob,
            'text/plain': textBlob,
          }),
        ])
      }
    } catch {
      /* 用户未授权或 http 环境，模块内剪贴板已可用 */
    }
    return true
  }

  /**
   * 从剪贴板粘贴组件。
   *   - 优先从系统剪贴板读取自定义 MIME
   *   - 回退到模块内剪贴板
   *   - 回退到读取 text/plain 并尝试 JSON 解析
   */
  async function pasteFromClipboard() {
    let sources: ComponentInstance[] | null = null

    // 1. 尝试从系统剪贴板读取
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read()
        for (const item of items) {
          if (item.types.includes(BI_CLIPBOARD_MIME)) {
            const blob = (await item.getType(BI_CLIPBOARD_MIME)) as Blob
            const text = await blob.text()
            sources = JSON.parse(text) as ComponentInstance[]
            break
          }
          if (item.types.includes('text/plain') && !sources) {
            const blob = (await item.getType('text/plain')) as Blob
            const text = await blob.text()
            try {
              const parsed = JSON.parse(text)
              if (Array.isArray(parsed) && parsed.length && parsed[0]?.id && parsed[0]?.type) {
                sources = parsed as ComponentInstance[]
              }
            } catch {
              /* 非 JSON 文本，不是组件数据 */
            }
          }
        }
      }
    } catch {
      /* 用户未授权或 API 不可用 */
    }

    // 2. 回退模块内剪贴板
    if (!sources) sources = clipboardData
    if (!sources || sources.length === 0) return

    // 🔑 粘贴：生成新 ID，位置偏移 20px，重设 zIndex（在现有最大 zIndex 之上依次递增）
    const maxZ =
      components.value.length > 0 ? Math.max(...components.value.map((c) => c.zIndex)) : 0
    sources.forEach((src, idx) => {
      const copy: ComponentInstance = {
        ...src,
        id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: `${src.name} (副本)`,
        x: src.x + 20 + idx * 10,
        y: src.y + 20 + idx * 10,
        zIndex: maxZ + 1 + idx,
        props: { ...src.props },
        style: { ...src.style },
      }
      components.value.push(copy)
      selectedId.value = copy.id
    })
    pushHistory()
  }

  return {
    copyToClipboard,
    pasteFromClipboard,
  }
}
