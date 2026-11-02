<template>
  <Teleport to="body">
    <div
      v-show="menu.visible"
      class="bi-context-menu"
      :style="menu.style"
      @contextmenu.prevent
    >
      <ul v-for="(group, gi) in menu.groups" :key="gi">
        <li
          v-for="(item, ii) in group"
          :key="`${gi}-${ii}`"
          class="ctx-item"
          :class="{ disabled: item.disabled, divider: item.divider, danger: item.danger }"
          @click="onItemClick(item)"
        >
          <span v-if="item.divider" class="ctx-divider" />
          <template v-else>
            <span class="ctx-icon">
              <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
            </span>
            <span class="ctx-label">{{ item.label }}</span>
            <span class="ctx-shortcut">{{ item.shortcut }}</span>
          </template>
        </li>
      </ul>
    </div>
    <!-- 🔑 遮罩层：用于捕获外部点击（防止被 canvas-sheet 拦截并误触发 @click.self） -->
    <div
      v-show="menu.visible"
      class="bi-context-menu-overlay"
      @mousedown="onOverlayDown"
      @click="hide"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, onBeforeUnmount, type Component } from 'vue'
/** 菜单项：divider=true 时为分隔线，其他字段可忽略 */
export interface ContextMenuItem {
  label?: string
  icon?: Component
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  divider?: boolean
  action?: () => void
}

export type ContextMenuGroups = ContextMenuItem[][]

/** 🔑 菜单内部状态（带 getter 的对象字面量 reactive 可识别 getter） */
const menu = reactive({
  visible: false,
  x: 0,
  y: 0,
  groups: [] as ContextMenuGroups,
  get style() {
    return {
      position: 'absolute' as const,
      left: `${this.x}px`,
      top: `${this.y}px`,
      zIndex: 99999,
    }
  },
})

/**
 * 弹出右键菜单。
 *   @param x 鼠标指针在 viewport 下的 clientX（以屏幕视口为基准，Teleport→body 所以直接 clientX 即可）
 *   @param y clientY
 *   @param groups 菜单项分组（二维数组，每组之间自动加分隔线其实目前按分组渲染，组间无视觉分隔也可）
 */
function show(x: number, y: number, groups: ContextMenuGroups) {
  menu.x = x
  menu.y = y
  menu.groups = groups
  menu.visible = true
  // 🔑 下帧再做溢出检测，保证 DOM 已挂载能读 offsetWidth
  requestAnimationFrame(() => clampToViewport())
  window.addEventListener('keydown', onWindowKey)
}
function hide() {
  if (!menu.visible) return
  menu.visible = false
  window.removeEventListener('keydown', onWindowKey)
}

function clampToViewport() {
  const w = 220 // 与 CSS 中 width 保持一致估算
  const h = 400
  const maxX = window.innerWidth - w
  const maxY = window.innerHeight - h
  if (menu.x > maxX) menu.x = Math.max(0, maxX)
  if (menu.y > maxY) menu.y = Math.max(0, maxY)
}

function onItemClick(item: ContextMenuItem) {
  if (item.disabled || item.divider) return
  item.action?.()
  hide()
}
function onOverlayDown(e: MouseEvent) {
  // 仅当点击发生在菜单内部时才不隐藏；overlay 在菜单下层，因此不会触发内部点击，直接隐藏
  e.preventDefault()
}
function onWindowKey(e: KeyboardEvent) {
  if (e.key === 'Escape') hide()
}

onBeforeUnmount(() => {
  hide()
})

defineExpose({ show, hide })
</script>

<style lang="less">
/* 🔑 非 scoped：Teleport 到 body 下，scoped 属性会失效 */
.bi-context-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 99998;
  background: transparent;
}
.bi-context-menu {
  position: absolute;
  min-width: 220px;
  max-width: 280px;
  background: #1f2937;
  color: #f3f4f6;
  border: 1px solid rgba(75, 85, 99, 0.9);
  border-radius: 6px;
  padding: 6px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(0, 0, 0, 0.2);
  user-select: none;
  font-size: 13px;
  backdrop-filter: blur(4px);
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .ctx-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 10px;
    border-radius: 4px;
    cursor: pointer;
    line-height: 1.2;
    &:not(.divider):not(.disabled):hover {
      background: rgba(64, 158, 255, 0.22);
      color: #fff;
    }
    &.disabled {
      color: #6b7280;
      cursor: not-allowed;
    }
    &.danger {
      color: #f87171;
      &:not(.disabled):hover {
        background: rgba(248, 113, 113, 0.18);
      }
    }
    .ctx-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      flex: 0 0 16px;
      color: inherit;
    }
    .ctx-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ctx-shortcut {
      color: #9ca3af;
      font-size: 11px;
      padding-left: 16px;
      letter-spacing: 0.3px;
    }
    .ctx-divider {
      display: block;
      width: 100%;
      height: 1px;
      background: rgba(75, 85, 99, 0.9);
      margin: 4px 0;
    }
  }
}
</style>
