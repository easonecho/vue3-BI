<template>
  <div class="widget-divider" :style="containerStyle">
    <el-divider
      :direction="direction"
      :border-style="borderStyleValue"
      :content-position="contentPosition"
      >{{ text }}</el-divider
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const text = computed(() => props.comp.props?.text ?? '')
const direction = computed(() => props.comp.props?.direction ?? 'horizontal')
const borderStyle = computed(() => props.comp.props?.borderStyle ?? 'solid')
const contentPosition = computed(() => props.comp.props?.contentPosition ?? 'center')
const color = computed(() => props.comp.props?.color ?? '#dcdfe6')
const thickness = computed(() => props.comp.props?.thickness ?? 1)

// el-divider 的 border-style 接收完整 CSS border 字符串
const borderStyleValue = computed(
  () => `${thickness.value}px ${borderStyle.value} ${color.value}`,
)

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection:
    direction.value === 'vertical' ? ('row' as const) : ('column' as const),
  width: '100%',
  height: '100%',
}))
</script>

<style scoped lang="less">
.widget-divider {
  box-sizing: border-box;

  :deep(.el-divider) {
    width: 100%;
    height: 100%;
    margin: 0;
  }

  // 垂直方向时让 el-divider 撑满容器高度
  :deep(.el-divider--vertical) {
    width: 100%;
    height: 100%;
    margin: 0;
    vertical-align: inherit;
  }
}
</style>
