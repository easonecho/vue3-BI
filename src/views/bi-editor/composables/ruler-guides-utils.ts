import type Guides from '@scena/guides'
import type { GuideLine } from '@/views/bi-editor/types'

/**
 * 🔑 @scena/guides 0.29.2 运行时确实存在、但 d.ts 未声明的 API 集合：
 *    loadGuides / setGuides / setState({guides}) / on('dragStart'|'dragEnd') / __teardown。
 *    统一在这里描述一次并断言一次，避免散落各处的 `as any`。
 */
export interface GuidesApi {
  loadGuides?: (guides: number[]) => void
  setGuides?: (guides: number[]) => void
  setState?: (state: Record<string, unknown>) => void
  on?: (event: 'dragStart' | 'dragEnd', handler: () => void) => void
  __teardown?: () => void
}

export function asGuidesApi(guides: Guides | null | undefined): GuidesApi | null {
  return guides ? (guides as unknown as GuidesApi) : null
}

/** 收集 root 下所有后代节点（用于记录刻度 DOM 白名单） */
export function collectAllDescendants(root: HTMLElement | null | undefined): Set<Node> {
  const set = new Set<Node>()
  if (!root) return set
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL)
  let node: Node | null = walker.currentNode
  while (node) {
    set.add(node)
    node = walker.nextNode()
  }
  return set
}

/** 删除 root 下不在白名单内的元素节点（保留刻度，移除用户辅助线） */
export function removeNonScaleDom(
  root: HTMLElement | null | undefined,
  whitelist: Set<Node> | null,
) {
  if (!root || !whitelist) return
  const toRemove: Node[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
  let node: Node | null = walker.currentNode
  while (node) {
    if (!whitelist.has(node)) toRemove.push(node)
    node = walker.nextNode()
  }
  toRemove.forEach((n) => n.parentNode?.removeChild(n))
}

/** 按方向拆分辅助线位置 */
export function splitGuidesByAxis(guides: GuideLine[]) {
  const hPositions: number[] = []
  const vPositions: number[] = []
  for (const g of guides) {
    if (g.direction === 'vertical') hPositions.push(g.position)
    else vPositions.push(g.position)
  }
  return {
    hPositions: hPositions.sort((a, b) => a - b),
    vPositions: vPositions.sort((a, b) => a - b),
  }
}

/** 将 @scena 回调的轴位置合并回业务 GuideLine[]，尽量复用已有 id */
export function mergeAxisPositionsIntoGuideLines(
  guides: GuideLine[],
  hPositions: number[],
  vPositions: number[],
): GuideLine[] {
  const existingIdKey = new Map<string, string>()
  for (const g of guides) {
    existingIdKey.set(`${g.direction}|${g.position}`, g.id)
  }
  const result: GuideLine[] = []
  const pushDir = (direction: 'horizontal' | 'vertical', positions: number[]) => {
    for (const p of positions) {
      const key = `${direction}|${p}`
      const id =
        existingIdKey.get(key) ?? `guide_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      existingIdKey.delete(key)
      result.push({ id, direction, position: Math.round(p) })
    }
  }
  pushDir('horizontal', vPositions)
  pushDir('vertical', hPositions)
  return result
}

/** 屏幕坐标 → 标尺滚动位置（世界坐标） */
export function rulerScrollPos(
  screenToWorld: (sx: number, sy: number) => { x: number; y: number },
  axis: 'x' | 'y',
): number {
  const edgeScreenPx = 0
  const w = screenToWorld(axis === 'x' ? edgeScreenPx : 0, axis === 'y' ? edgeScreenPx : 0)
  return axis === 'x' ? w.x : w.y
}

/** 标尺刻度文案（1.2M / 12k / 120） */
export function formatRulerLabel(value: number): string {
  const rounded = Math.round(value)
  const abs = Math.abs(rounded)
  if (abs >= 1_000_000) return `${(rounded / 1_000_000).toFixed(0)}M`
  if (abs >= 10_000) return `${(rounded / 1_000).toFixed(0)}k`
  return `${rounded}`
}

/** 根据缩放选择标尺最小刻度单位（1/2/5 × 10^n） */
export function pickRulerUnit(zoom: number): number {
  const target = 50 / zoom
  const pow = Math.pow(10, Math.floor(Math.log10(target)))
  const n = target / pow
  let mul = 1
  if (n < 2) mul = 1
  else if (n < 5) mul = 2
  else mul = 5
  return Math.max(1, mul * pow)
}
