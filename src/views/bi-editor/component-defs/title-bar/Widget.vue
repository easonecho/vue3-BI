<template>
  <div class="widget-title-bar" :style="containerStyle">
    <div
      v-if="showDecor"
      class="widget-title-bar__decor widget-title-bar__decor--left"
      :style="decorLeftStyle"
    />
    <div class="widget-title-bar__center">
      <div class="widget-title-bar__title" :style="titleStyle">{{ title }}</div>
      <div v-if="subtitle" class="widget-title-bar__subtitle" :style="subtitleStyle">{{ subtitle }}</div>
    </div>
    <div
      v-if="showDecor"
      class="widget-title-bar__decor widget-title-bar__decor--right"
      :style="decorRightStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const title = computed(() => props.comp.props?.title ?? '数据可视化大屏')
const subtitle = computed(() => props.comp.props?.subtitle ?? 'DATA VISUALIZATION')
const showDecor = computed(() => props.comp.props?.showDecor ?? true)
const decorColor = computed(() => props.comp.props?.decorColor ?? '#22d3ee')
const decorWidth = computed(() => props.comp.props?.decorWidth ?? 80)
const bgFrom = computed(() => props.comp.props?.bgFrom ?? '#0f172a')
const bgTo = computed(() => props.comp.props?.bgTo ?? '#1e293b')
const color = computed(() => props.comp.props?.color ?? '#ffffff')
const subtitleColor = computed(() => props.comp.props?.subtitleColor ?? '#67e8f9')
const fontSize = computed(() => props.comp.props?.fontSize ?? 24)
const subtitleFontSize = computed(() => props.comp.props?.subtitleFontSize ?? 12)
const fontWeight = computed(() => props.comp.props?.fontWeight ?? 'bold')

const containerStyle = computed(() => ({
  background: `linear-gradient(to right, ${bgFrom.value}, ${bgTo.value})`,
}))

const titleStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: color.value,
  fontWeight: fontWeight.value,
}))

const subtitleStyle = computed(() => ({
  fontSize: `${subtitleFontSize.value}px`,
  color: subtitleColor.value,
}))

const decorLeftStyle = computed(() => ({
  width: `${decorWidth.value}px`,
  height: '2px',
  background: `linear-gradient(to right, transparent, ${decorColor.value})`,
}))

const decorRightStyle = computed(() => ({
  width: `${decorWidth.value}px`,
  height: '2px',
  background: `linear-gradient(to left, transparent, ${decorColor.value})`,
}))
</script>

<style scoped lang="less">
.widget-title-bar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  box-sizing: border-box;
  user-select: none;
  overflow: hidden;
  padding: 0 16px;

  &__decor {
    flex-shrink: 0;
  }

  &__center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  &__title {
    line-height: 1.2;
    letter-spacing: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__subtitle {
    margin-top: 4px;
    letter-spacing: 4px;
    line-height: 1.2;
    white-space: nowrap;
  }
}
</style>
