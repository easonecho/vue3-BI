import type { Directive, DirectiveBinding } from 'vue'
import { useMenuStore } from '@/stores/menu'

function matchPerm(value: string | string[], anyMode: boolean): boolean {
  const store = useMenuStore()
  if (Array.isArray(value)) {
    return anyMode ? store.hasAnyPerms(value) : value.every((v) => store.hasPerm(v))
  }
  return store.hasPerm(value)
}

/** 🔑 可禁用元素（button/input 等原生控件带 disabled，普通 div 没有） */
type DisableableElement = HTMLElement & { disabled?: boolean }

export const vPermission: Directive<HTMLElement> = {
  mounted(el, binding: DirectiveBinding) {
    const anyMode = !!(binding.modifiers && binding.modifiers.any)
    const disableMode = !!(binding.modifiers && binding.modifiers.disabled)
    const ok = matchPerm(binding.value, anyMode)
    if (!ok) {
      if (disableMode) {
        ;(el as DisableableElement).disabled = true
        el.classList.add('is-disabled')
      } else {
        el.parentNode?.removeChild(el)
      }
    }
  },
}

/** 在 main.ts 中注册: app.directive('permission', vPermission) */
