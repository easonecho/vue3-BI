<template>
  <div class="group-bound-box" :style="boxStyle">
    <!-- 组标识小标签（左上角） -->
    <div class="group-bound-label">分组 ({{ gb.memberIds.length }})</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface GroupBound {
  groupId: string
  x: number
  y: number
  width: number
  height: number
  memberIds: string[]
}

interface DragPreview {
  groupId: string
  dx: number
  dy: number
  draggedId: string
}

interface Props {
  gb: GroupBound
  /** 🔑 分组拖拽预览：当拖拽某组员时，GroupBox 通过 CSS transform 跟随 */
  dragPreview: DragPreview | null
}
const props = defineProps<Props>()

/**
 * 🔑 GroupBox 样式 computed：
 *   - 基础位置由 gb.x/y/width/height 决定（选中组时变化）
 *   - 拖拽预览时叠加 CSS transform，跟随组员整体移动
 *   computed 缓存：只在 gb 或 dragPreview 真正变化时重算，
 *   避免内联函数每次模板渲染都重建 style 对象。
 */
const boxStyle = computed(() => {
  const style: Record<string, string | number | undefined> = {
    position: 'absolute' as const,
    left: `${props.gb.x}px`,
    top: `${props.gb.y}px`,
    width: `${props.gb.width}px`,
    height: `${props.gb.height}px`,
  }
  const p = props.dragPreview
  if (p && p.groupId === props.gb.groupId) {
    style.transform = `translate(${p.dx}px, ${p.dy}px)`
    style.willChange = 'transform'
  }
  return style
})
</script>

<style scoped lang="less">
/* 🔑 分组统一选中边框（GroupBox）：pointer-events: none，不拦截任何鼠标事件
   （组内空白的命中走 canvas-sheet mousedown → hitTestSelectedGroupBlank；
     组内组员的命中走组件自身的拖拽会话）。z-index: 50 位于组件之下但 > snapLines，
   保证视觉上明显覆盖整个组范围。 */
.group-bound-box {
  position: absolute;
  border: 2px solid var(--bi-accent, #409eff);
  background: rgba(64, 158, 255, 0.05);
  border-radius: 4px;
  box-sizing: border-box;
  pointer-events: none;
  z-index: 50;
  box-shadow:
    0 0 0 1px rgba(64, 158, 255, 0.1),
    0 2px 10px rgba(64, 158, 255, 0.1);
}
/* 左上角小标签：区分"个人选中"和"分组选中"的视觉标识 */
.group-bound-label {
  position: absolute;
  top: -18px;
  left: -2px;
  background: var(--bi-accent, #409eff);
  color: #fff;
  font-size: 11px;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 3px 3px 0 0;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}
</style>
