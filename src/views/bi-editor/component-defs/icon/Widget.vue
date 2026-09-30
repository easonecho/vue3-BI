<template>
  <div class="widget-icon">
    <el-icon :size="size" :color="color" :style="iconStyle">
      <component :is="iconComp" />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const iconName = computed(() => props.comp.props?.iconName || 'Star')
const size = computed(() => props.comp.props?.size ?? 32)
const color = computed(() => props.comp.props?.color || '#606266')
const rotate = computed(() => props.comp.props?.rotate ?? 0)

const iconStyle = computed(() => ({
  transform: rotate.value ? `rotate(${rotate.value}deg)` : undefined,
}))

// 动态解析图标组件；名字不存在时 fallback 显示 Star
const iconComp = computed(() => {
  const name = iconName.value as keyof typeof ElementPlusIconsVue
  return ElementPlusIconsVue[name] ?? ElementPlusIconsVue.Star
})
</script>

<style scoped lang="less">
.widget-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
</style>
