import { computed, type Ref } from 'vue'
import type { useBiEditorStore } from '@/stores/bi-editor'

type BiEditorStore = ReturnType<typeof useBiEditorStore>

interface ViewportCullingOptions {
  store: BiEditorStore
  /** 预览/发布模式全量渲染，避免滚动时图表反复 init/dispose */
  readonly: boolean
  localScale: Ref<number>
  viewportWidth: Ref<number>
  viewportHeight: Ref<number>
  /** 视口内部坐标 → 画布世界坐标 */
  screenToWorld: (x: number, y: number) => { x: number; y: number }
}

/** 屏幕外缓冲区（世界坐标 = px / scale），防止快速滚动时组件闪现 */
const VIEWPORT_BUFFER_PX = 200

/**
 * 🔑 视口裁剪（虚拟化渲染）：只渲染可见区域 + 缓冲区的组件。
 *
 * 从 CanvasArea 抽出，行为保持不变：
 *   - 只渲染视口内的组件，画布外组件不创建 DOM/ECharts 实例
 *   - readonly（预览/发布）全量渲染
 *   - 不依赖 selectedIdSet，避免框选期间组件列表重算
 */
export function useViewportCulling(options: ViewportCullingOptions) {
  const { store, readonly, localScale, viewportWidth, viewportHeight, screenToWorld } = options

  const visibleComponents = computed(() => {
    // 预览/发布模式全量渲染（组件数通常少，且不应有 init/dispose 抖动）
    if (readonly) return store.components
    const scale = localScale.value
    if (scale <= 0) return store.components
    // 视口在世界坐标系中的范围（screenToWorld 期望 viewport 内部相对坐标）
    const tl = screenToWorld(0, 0)
    const br = screenToWorld(viewportWidth.value, viewportHeight.value)
    const buffer = VIEWPORT_BUFFER_PX / scale
    const minX = Math.min(tl.x, br.x) - buffer
    const minY = Math.min(tl.y, br.y) - buffer
    const maxX = Math.max(tl.x, br.x) + buffer
    const maxY = Math.max(tl.y, br.y) + buffer
    // 🔑 不订阅 selectedIdSet：框选时组件位置不变，强制保留选中组件是冗余的，
    //   移除后框选期间本 computed 不重算 → v-for 不重渲染 → 零组件 patch。
    return store.components.filter((c) =>
      c.x + c.width >= minX && c.x <= maxX &&
      c.y + c.height >= minY && c.y <= maxY,
    )
  })

  return { visibleComponents }
}
