import { describe, it, expect } from 'vitest'
import { reactive, ref } from 'vue'
import { useViewportCulling } from './useViewportCulling'
import type { useBiEditorStore } from '@/stores/bi-editor'
import type { ComponentInstance } from '@/views/bi-editor/types'

type BiEditorStore = ReturnType<typeof useBiEditorStore>
type Options = Parameters<typeof useViewportCulling>[0]

function makeComponent(
  id: string,
  x: number,
  y: number,
  width = 100,
  height = 100,
): ComponentInstance {
  return {
    id,
    type: 'bar-chart',
    name: id,
    x,
    y,
    width,
    height,
    zIndex: 0,
    visible: true,
    locked: false,
    props: {},
    style: {},
    dataSource: { datasetId: null },
    dataConfig: {},
  }
}

function createOptions(
  components: ComponentInstance[],
  overrides: Partial<Options> = {},
): Options {
  return {
    store: { components } as unknown as BiEditorStore,
    readonly: false,
    localScale: ref(1),
    viewportWidth: ref(1000),
    viewportHeight: ref(600),
    screenToWorld: (x, y) => ({ x, y }),
    ...overrides,
  }
}

describe('useViewportCulling', () => {
  it('readonly 模式返回全部组件（同一引用）', () => {
    const components = [makeComponent('a', 5000, 5000)]
    const { visibleComponents } = useViewportCulling(createOptions(components, { readonly: true }))
    expect(visibleComponents.value).toBe(components)
  })

  it('scale <= 0 时返回全部组件', () => {
    const components = [makeComponent('a', 5000, 5000)]
    const { visibleComponents } = useViewportCulling(
      createOptions(components, { localScale: ref(0) }),
    )
    expect(visibleComponents.value).toBe(components)
  })

  it('只保留视口 + 缓冲区内的组件', () => {
    const components = [
      makeComponent('inside', 100, 100),
      makeComponent('edge', -50, -50), // 右边/下边仍在缓冲区内
      makeComponent('far-left', -350, 0), // 右边 -250 < -200 缓冲区
      makeComponent('far-bottom', 0, 900), // 上边 900 > 800 缓冲区
    ]
    const { visibleComponents } = useViewportCulling(createOptions(components))
    expect(visibleComponents.value.map((c) => c.id)).toEqual(['inside', 'edge'])
  })

  it('缩放后缓冲区按世界坐标换算', () => {
    const components = [
      makeComponent('near', -150, 0), // scale=2 → 缓冲区 100，右边 -50 在缓冲区内
      makeComponent('far', -400, 0), // 右边 -300 超出缓冲区
    ]
    const { visibleComponents } = useViewportCulling(createOptions(components, { localScale: ref(2) }))
    expect(visibleComponents.value.map((c) => c.id)).toEqual(['near'])
  })

  it('使用 screenToWorld 得到的视口范围（支持平移/缩放）', () => {
    const components = [makeComponent('far-origin', 900, 0), makeComponent('translated', -500, -500)]
    const { visibleComponents } = useViewportCulling(
      createOptions(components, {
        // 视口世界范围变为 x∈[-400,600], y∈[-300,300]，缓冲区 200 → x∈[-600,800]
        screenToWorld: (x, y) => ({ x: x - 400, y: y - 300 }),
      }),
    )
    expect(visibleComponents.value.map((c) => c.id)).toEqual(['translated'])
  })

  it('组件位置变化会触发重新计算', () => {
    const components = reactive([makeComponent('a', 5000, 0)])
    const { visibleComponents } = useViewportCulling(
      createOptions(components as ComponentInstance[]),
    )
    expect(visibleComponents.value).toHaveLength(0)
    components[0].x = 100
    expect(visibleComponents.value.map((c) => c.id)).toEqual(['a'])
  })
})
