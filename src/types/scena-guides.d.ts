/**
 * 类型补丁：@scena/guides 0.29.2 的内部 .d.ts 依赖了 monorepo 中的
 * @scena/react-guides/declaration/types 以及 react，但这里我们只使用其
 * 纯 Vanilla JS 运行时，因此提供最小化 stub 让类型检查通过。
 */
declare module 'react' {
  export = any
}
declare module '@scena/event-emitter' {
  export class EventEmitter<T extends Record<string, any>> {
    on<K extends keyof T>(event: K, handler: (e: T[K]) => void): this
    off<K extends keyof T>(event: K, handler?: (e: T[K]) => void): this
    emit<K extends keyof T>(event: K, param?: T[K]): this
  }
}
declare module '@scena/react-guides/declaration/types' {
  export interface GuidesOptions {
    type?: 'horizontal' | 'vertical'
    zoom?: number
    unit?: number
    segment?: number
    negativeRuler?: boolean
    backgroundColor?: string
    lineColor?: string
    textColor?: string
    textFormat?: (value: number) => string
    font?: string
    height?: number
    width?: number
    mainLineSize?: number | string
    longLineSize?: number | string
    shortLineSize?: number | string
    useResizeObserver?: boolean
    guides?: number[]
    removeGuideOnOverflow?: boolean
    showGuides?: boolean
    guideStyle?: Record<string, any>
    dragGuideStyle?: Record<string, any>
    lockGuides?: boolean | Array<'add' | 'change' | 'remove'>
  }
  export interface GuidesEvents {
    changeGuides: { guides: number[] }
  }
  export interface GuidesInterface {
    setState(state: Partial<GuidesOptions>, callback?: () => void): void
    forceUpdate(callback?: () => void): void
    destroy(): void
    resize(): void
    scroll(offset: number): void
    scrollGuides(offset: number): void
    getGuides(): number[]
    setGuides(guides: number[]): void
  }
}

declare module '@scena/guides' {
  import type { EventEmitter } from '@scena/event-emitter'
  import type {
    GuidesOptions,
    GuidesEvents,
    GuidesInterface,
  } from '@scena/react-guides/declaration/types'

  class Guides
    extends (EventEmitter as new <T extends Record<string, any>>() => EventEmitter<T>)<GuidesEvents>
    implements GuidesInterface
  {
    constructor(container: HTMLElement, options?: Partial<GuidesOptions>)
    setState(state: Partial<GuidesOptions>, callback?: () => void): void
    forceUpdate(callback?: () => void): void
    destroy(): void
    resize(): void
    scroll(offset: number): void
    scrollGuides(offset: number): void
    getGuides(): number[]
    setGuides(guides: number[]): void
  }

  export default Guides
}
