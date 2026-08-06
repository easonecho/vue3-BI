<template>
  <div class="widget-text" :style="computedStyle">{{ displayText }}</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const displayText = computed(() => props.comp.props?.text || '文本内容')
const computedStyle = computed(() => ({
  fontSize: `${props.comp.props?.fontSize || 14}px`,
  color: props.comp.props?.color || '#333333',
  fontWeight: props.comp.props?.fontWeight || 'normal',
  textAlign: props.comp.props?.textAlign || 'left',
  lineHeight: props.comp.props?.lineHeight || 1.5,
  letterSpacing: `${props.comp.props?.letterSpacing || 0}px`,
  padding: `${props.comp.props?.padding || '4px 8px'}`,
  fontFamily:
    props.comp.props?.fontFamily ||
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  wordBreak: 'break-word' as const,
  whiteSpace: 'pre-wrap' as const,
}))
</script>

<style scoped lang="less">
.widget-text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  user-select: none;
}
</style>
