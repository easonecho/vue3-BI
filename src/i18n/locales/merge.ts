/** 语言包树结构: 叶子节点为文案, 分支为嵌套命名空间 */
export interface LocaleTree {
  [key: string]: string | LocaleTree
}

/**
 * 深合并语言包片段: 同名命名空间递归合并, 同 key 文案以片段为准。
 * 各业务模块的语言包放在 locales/fragments 下, 通过 glob 自动汇总到主语言包。
 */
export function mergeLocales(base: LocaleTree, fragment: LocaleTree): LocaleTree {
  const result: LocaleTree = { ...base }
  Object.entries(fragment).forEach(([key, value]) => {
    const current = result[key]
    if (typeof value === 'string' || typeof current !== 'object') {
      result[key] = value
    } else {
      result[key] = mergeLocales(current, value)
    }
  })
  return result
}
