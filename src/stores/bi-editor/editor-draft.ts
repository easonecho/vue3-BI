import type { DashboardLayout } from '@/views/bi-editor/types'

/** 🔑 本地草稿结构：只存 localStorage，用于意外关闭/崩溃后找回未保存内容 */
export interface EditorDraft {
  savedAt: number
  name: string
  layout: DashboardLayout
  version: number | null
}

const DRAFT_PREFIX = 'bi_editor_draft_'

/** 草稿 key 按「看板/模板 + id（新建为 new）」区分，避免不同看板互相覆盖 */
export function draftStorageKey(isTemplateMode: boolean, id: number | null): string {
  const mode = isTemplateMode ? 'tpl' : 'dash'
  return `${DRAFT_PREFIX}${mode}_${id ?? 'new'}`
}

/** 读取草稿，不存在或格式非法返回 null */
export function readDraft(key: string): EditorDraft | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const draft = JSON.parse(raw) as EditorDraft
    if (!draft || typeof draft.savedAt !== 'number' || !draft.layout) return null
    return draft
  } catch {
    return null
  }
}

/** 写入草稿 */
export function writeDraft(key: string, draft: EditorDraft): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(draft))
    return true
  } catch (e) {
    console.warn('[bi-editor] saveDraft failed', e)
    return false
  }
}

/** 删除草稿 */
export function removeDraft(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
