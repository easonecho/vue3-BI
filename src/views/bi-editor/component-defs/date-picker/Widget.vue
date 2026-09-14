<template>
  <div class="widget-date-picker" :style="containerStyle">
    <span v-if="showLabel" class="widget-date-picker__label" :style="labelStyle">
      {{ labelText }}
    </span>
    <input
      v-model="selectedValue"
      class="widget-date-picker__input"
      :class="`is-${mode}`"
      :type="inputType"
      :placeholder="placeholder"
      :style="inputStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const mode = computed(() => props.comp.props?.mode ?? 'date')
const placeholder = computed(() => props.comp.props?.placeholder ?? '选择日期')
const defaultValue = computed(() => props.comp.props?.defaultValue ?? '')
const showLabel = computed(() => props.comp.props?.showLabel ?? true)
const labelText = computed(() => props.comp.props?.labelText ?? '日期')
const bgColor = computed(() => props.comp.props?.bgColor ?? '#1e293b')
const textColor = computed(() => props.comp.props?.textColor ?? '#e2e8f0')
const borderColor = computed(() => props.comp.props?.borderColor ?? '#475569')
const accentColor = computed(() => props.comp.props?.accentColor ?? '#22d3ee')
const fontSize = computed(() => Number(props.comp.props?.fontSize ?? 13))
const borderRadius = computed(() => Number(props.comp.props?.borderRadius ?? 4))

/**
 * 根据 mode 决定 input 类型：
 *   date -> 'date'
 *   time -> 'time'
 *   datetime -> 'datetime-local'
 */
const inputType = computed<'date' | 'time' | 'datetime-local'>(() => {
  if (mode.value === 'time') return 'time'
  if (mode.value === 'datetime') return 'datetime-local'
  return 'date'
})

const selectedValue = ref<string>(defaultValue.value || '')

watch(defaultValue, (v) => {
  selectedValue.value = v || ''
})

const containerStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  // 通过 CSS 变量传递 accent 色，给 input:focus 使用
  '--date-accent': accentColor.value,
}))

const labelStyle = computed(() => ({
  color: textColor.value,
}))

const inputStyle = computed(() => ({
  background: bgColor.value,
  color: textColor.value,
  border: `1px solid ${borderColor.value}`,
  borderRadius: `${borderRadius.value}px`,
  fontSize: `${fontSize.value}px`,
}))
</script>

<style scoped lang="less">
.widget-date-picker {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;

  &__label {
    flex: 0 0 auto;
    white-space: nowrap;
    font-weight: 500;
  }

  &__input {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    padding: 4px 8px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;

    &:focus,
    &:hover {
      border-color: var(--date-accent, #22d3ee);
    }

    // 深色主题下让日历图标可见
    &::-webkit-calendar-picker-indicator {
      filter: invert(0.8);
      cursor: pointer;
    }

    &.is-time::-webkit-calendar-picker-indicator,
    &.is-datetime::-webkit-calendar-picker-indicator {
      filter: invert(0.8);
    }
  }
}
</style>
