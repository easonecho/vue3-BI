<template>
  <div class="widget-status-badge" :style="containerStyle">
    <span v-if="showDot" class="widget-status-badge__dot" :class="{ 'is-pulse': dotPulse }" :style="dotStyle" />
    <el-icon v-if="iconComp" :size="iconSize" :color="iconColor" class="widget-status-badge__icon">
      <component :is="iconComp" />
    </el-icon>
    <span class="widget-status-badge__text" :style="textStyle">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

// ============ 字段读取 ============
const text = computed(() => props.comp.props?.text ?? '运行中')
const status = computed(() => props.comp.props?.status ?? 'success')
const iconName = computed(() => String(props.comp.props?.iconName ?? ''))
const showDot = computed(() => props.comp.props?.showDot ?? true)
const dotPulse = computed(() => props.comp.props?.dotPulse ?? false)
const fontSize = computed(() => Number(props.comp.props?.fontSize ?? 14))
const successColor = computed(() => props.comp.props?.successColor ?? '#2ec07e')
const warningColor = computed(() => props.comp.props?.warningColor ?? '#fac858')
const dangerColor = computed(() => props.comp.props?.dangerColor ?? '#ee6666')
const infoColor = computed(() => props.comp.props?.infoColor ?? '#909399')
const primaryColor = computed(() => props.comp.props?.primaryColor ?? '#5470c6')
const solid = computed(() => props.comp.props?.solid ?? false)
const rounded = computed(() => props.comp.props?.rounded ?? true)

// ============ 当前状态对应颜色 ============
const statusColor = computed(() => {
  switch (status.value) {
    case 'success':
      return successColor.value
    case 'warning':
      return warningColor.value
    case 'danger':
      return dangerColor.value
    case 'info':
      return infoColor.value
    case 'primary':
      return primaryColor.value
    default:
      return successColor.value
  }
})

// ============ hex 转 rgba ============
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return `rgba(46,192,126,${alpha})`
  const r = parseInt(m[1], 16)
  const g = parseInt(m[2], 16)
  const b = parseInt(m[3], 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ============ 图标动态解析 ============
const iconComp = computed(() => {
  const name = iconName.value as keyof typeof ElementPlusIconsVue
  if (!name) return null
  return ElementPlusIconsVue[name] ?? null
})

const iconSize = computed(() => Math.max(12, Math.round(fontSize.value * 0.9)))
const iconColor = computed(() => (solid.value ? '#fff' : statusColor.value))

// ============ 样式 ============
const containerStyle = computed(() => {
  const color = statusColor.value
  const bg = solid.value ? color : hexToRgba(color, 0.12)
  const borderColor = solid.value ? color : hexToRgba(color, 0.3)
  const textColor = solid.value ? '#fff' : color
  return {
    background: bg,
    color: textColor,
    border: `1px solid ${borderColor}`,
    borderRadius: rounded.value ? '16px' : '4px',
    fontSize: `${fontSize.value}px`,
    padding: `0 10px`,
  }
})

const dotStyle = computed(() => ({
  background: statusColor.value,
  // solid 模式圆点用白色突出
  boxShadow: solid.value
    ? `0 0 0 2px ${hexToRgba('#ffffff', 0.3)}`
    : `0 0 0 2px ${hexToRgba(statusColor.value, 0.15)}`,
}))

const textStyle = computed(() => ({
  color: solid.value ? '#fff' : statusColor.value,
  fontSize: `${fontSize.value}px`,
  lineHeight: 1.2,
}))
</script>

<style scoped lang="less">
.widget-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  min-height: 24px;
  white-space: nowrap;
  user-select: none;
  box-sizing: border-box;

  &__dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;

    &.is-pulse {
      animation: widget-status-badge-pulse 1.4s ease-in-out infinite;
    }
  }

  &__icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
  }

  &__text {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@keyframes widget-status-badge-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.6);
    opacity: 0.4;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
