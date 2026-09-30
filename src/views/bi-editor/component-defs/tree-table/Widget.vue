<template>
  <div class="widget-tree-table" :style="containerStyle">
    <table class="widget-tree-table__table" :style="tableStyle">
      <thead>
        <tr :style="headerRowStyle">
          <th v-if="showIndex" :style="indexThStyle">#</th>
          <th
            v-for="(col, ci) in columns"
            :key="col.key"
            :style="thStyle(ci === 0)"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in flatRows"
          :key="row.__id"
          :style="rowStyle(row)"
        >
          <td v-if="showIndex" :style="indexTdStyle">{{ row.__index + 1 }}</td>
          <td
            v-for="(col, ci) in columns"
            :key="col.key"
            :style="tdStyle(ci === 0, row.__level)"
          >
            <template v-if="ci === 0">
              <span
                v-if="row.__hasChildren"
                class="widget-tree-table__toggle"
                @click.stop="toggleExpand(row.__id)"
              >
                <span class="widget-tree-table__arrow" :class="{ 'is-expanded': row.__expanded }">
                  ▶
                </span>
              </span>
              <span v-else class="widget-tree-table__toggle-placeholder" />
              <span class="widget-tree-table__cell-text">{{ row[col.key] }}</span>
            </template>
            <template v-else>
              {{ row[col.key] }}
            </template>
          </td>
        </tr>
        <tr v-if="flatRows.length === 0">
          <td :colspan="columns.length + (showIndex ? 1 : 0)" class="widget-tree-table__empty">
            暂无数据
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

interface TreeNode {
  id: number | string
  [key: string]: any
  children?: TreeNode[]
}

interface FlatRow extends TreeNode {
  __id: string
  __level: number
  __index: number
  __hasChildren: boolean
  __expanded: boolean
  __parentId: string | null
}

const props = defineProps<{ comp: ComponentInstance }>()

// ============ 字段读取 ============
const columns = computed<{ key: string; label: string }[]>(() => {
  const raw = props.comp.props?.columns
  return Array.isArray(raw) ? raw : []
})
const rawData = computed<TreeNode[]>(() => {
  const raw = props.comp.props?.data
  return Array.isArray(raw) ? (raw as TreeNode[]) : []
})
const showIndex = computed(() => props.comp.props?.showIndex ?? false)
const bordered = computed(() => props.comp.props?.bordered ?? true)
const striped = computed(() => props.comp.props?.striped ?? true)
const headerColor = computed(() => props.comp.props?.headerColor ?? '#1f2937')
const headerBgColor = computed(() => props.comp.props?.headerBgColor ?? '#f3f4f6')
const rowColor = computed(() => props.comp.props?.rowColor ?? '#1f2937')
const borderColor = computed(() => props.comp.props?.borderColor ?? '#e5e7eb')
const fontSize = computed(() => Number(props.comp.props?.fontSize ?? 13))
const rowHeight = computed(() => Number(props.comp.props?.rowHeight ?? 36))
const expandAll = computed(() => props.comp.props?.expandAll ?? true)
const indentSize = computed(() => Number(props.comp.props?.indentSize ?? 16))

// ============ 展开状态：以 row __id 为 key ============
// 用对象维护展开状态，初始化时根据 expandAll 决定
const expandedMap = ref<Record<string, boolean>>({})

// 生成稳定 __id：路径形式（父级 id → 自身 id）
function buildId(node: TreeNode, parentPath: string): string {
  return parentPath ? `${parentPath}/${node.id}` : String(node.id)
}

// 读取某 id 的展开状态：未设置时取 expandAll 默认值
function readExpanded(id: string): boolean {
  if (Object.prototype.hasOwnProperty.call(expandedMap.value, id)) {
    return !!expandedMap.value[id]
  }
  return expandAll.value
}

// 扁平化树，依据展开状态决定是否递归 children
function flatten(nodes: TreeNode[], parentPath: string, level: number): FlatRow[] {
  const result: FlatRow[] = []
  for (const node of nodes) {
    const id = buildId(node, parentPath)
    const hasChildren = Array.isArray(node.children) && node.children.length > 0
    const expanded = readExpanded(id)
    result.push({
      ...node,
      __id: id,
      __level: level,
      __index: 0, // 后面统一修正
      __hasChildren: hasChildren,
      __expanded: expanded,
      __parentId: parentPath || null,
    })
    if (hasChildren && expanded) {
      const children = (node.children as TreeNode[]) || []
      result.push(...flatten(children, id, level + 1))
    }
  }
  return result
}

// 扁平化结果：__index 为可见序号
const flatRows = computed<FlatRow[]>(() => {
  const rows = flatten(rawData.value, '', 0)
  rows.forEach((r, i) => {
    r.__index = i
  })
  return rows
})

// 切换展开
function toggleExpand(id: string) {
  const cur = readExpanded(id)
  expandedMap.value = { ...expandedMap.value, [id]: !cur }
}

// 当 expandAll 变化时重置所有展开状态
watch(expandAll, (val) => {
  const newMap: Record<string, boolean> = {}
  function walk(nodes: TreeNode[], parentPath: string) {
    for (const node of nodes) {
      const id = buildId(node, parentPath)
      newMap[id] = val
      if (Array.isArray(node.children) && node.children.length > 0) {
        walk(node.children as TreeNode[], id)
      }
    }
  }
  walk(rawData.value, '')
  expandedMap.value = newMap
})

// 数据变化时清空展开状态缓存（新数据需要重新初始化）
watch(rawData, () => {
  expandedMap.value = {}
}, { deep: false })

// ============ 样式 ============
const containerStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: rowColor.value,
}))

const tableStyle = computed(() => ({
  borderCollapse: 'collapse' as const,
  width: '100%',
  tableLayout: 'fixed' as const,
}))

const headerRowStyle = computed(() => ({
  background: headerBgColor.value,
  color: headerColor.value,
}))

function thStyle(isFirst: boolean) {
  return {
    textAlign: 'left' as const,
    padding: '0 8px',
    height: `${rowHeight.value}px`,
    fontWeight: 600,
    fontSize: `${fontSize.value}px`,
    borderBottom: bordered.value ? `1px solid ${borderColor.value}` : 'none',
    borderRight: bordered.value && !isFirst ? `1px solid ${borderColor.value}` : 'none',
  }
}

const indexThStyle = computed(() => ({
  width: '40px',
  textAlign: 'center' as const,
  padding: '0 4px',
  height: `${rowHeight.value}px`,
  fontWeight: 600,
  borderBottom: bordered.value ? `1px solid ${borderColor.value}` : 'none',
  borderRight: bordered.value ? `1px solid ${borderColor.value}` : 'none',
}))

const indexTdStyle = computed(() => ({
  width: '40px',
  textAlign: 'center' as const,
  padding: '0 4px',
  color: '#9ca3af',
  height: `${rowHeight.value}px`,
  borderBottom: bordered.value ? `1px solid ${borderColor.value}` : 'none',
  borderRight: bordered.value ? `1px solid ${borderColor.value}` : 'none',
}))

function tdStyle(isFirst: boolean, level: number) {
  const base: Record<string, string> = {
    padding: '0 8px',
    height: `${rowHeight.value}px`,
    fontSize: `${fontSize.value}px`,
    color: rowColor.value,
    verticalAlign: 'middle',
    borderBottom: bordered.value ? `1px solid ${borderColor.value}` : 'none',
    borderRight: bordered.value && !isFirst ? `1px solid ${borderColor.value}` : 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }
  if (isFirst) {
    base.paddingLeft = `${8 + level * indentSize.value}px`
  }
  return base
}

function rowStyle(row: FlatRow) {
  // 斑马纹：按可见序号取偶数行着色（避免树展开时颜色跳跃）
  if (striped.value && row.__index % 2 === 1) {
    return {
      background: 'rgba(0,0,0,0.025)',
    }
  }
  return {}
}
</script>

<style scoped lang="less">
.widget-tree-table {
  width: 100%;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  user-select: none;

  &__table {
    width: 100%;
  }

  &__toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-right: 4px;
    cursor: pointer;
    flex-shrink: 0;
    vertical-align: middle;
  }

  &__toggle-placeholder {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-right: 4px;
    flex-shrink: 0;
  }

  &__arrow {
    display: inline-block;
    font-size: 10px;
    color: #6b7280;
    transition: transform 0.15s ease;
    transform: rotate(0deg);

    &.is-expanded {
      transform: rotate(90deg);
    }
  }

  &__cell-text {
    vertical-align: middle;
  }

  &__empty {
    text-align: center;
    color: #9ca3af;
    padding: 24px;
    font-size: 13px;
  }
}
</style>
