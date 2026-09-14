<template>
  <div class="widget-dropdown-filter" :style="containerStyle">
    <span v-if="showLabel" class="widget-dropdown-filter__label" :style="labelStyle">
      {{ labelText }}
    </span>
    <select
      v-model="selectedValue"
      class="widget-dropdown-filter__select"
      :style="selectStyle"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in optionList" :key="opt" :value="opt" :style="optionStyle">
        {{ opt }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const placeholder = computed(() => props.comp.props?.placeholder ?? '请选择')
const optionsText = computed(() => props.comp.props?.options ?? '')
const defaultValue = computed(() => props.comp.props?.defaultValue ?? '')
const showLabel = computed(() => props.comp.props?.showLabel ?? true)
const labelText = computed(() => props.comp.props?.labelText ?? '筛选')
const bgColor = computed(() => props.comp.props?.bgColor ?? '#1e293b')
const textColor = computed(() => props.comp.props?.textColor ?? '#e2e8f0')
const borderColor = computed(() => props.comp.props?.borderColor ?? '#475569')
const accentColor = computed(() => props.comp.props?.accentColor ?? '#22d3ee')
const fontSize = computed(() => Number(props.comp.props?.fontSize ?? 13))
const borderRadius = computed(() => Number(props.comp.props?.borderRadius ?? 4))

/**
 * 解析 options 字符串：按换行或逗号分割成数组。
 */
const optionList = computed<string[]>(() => {
  const text = optionsText.value || ''
  return text
    .split(/[\n,]/)
    .map((s: string) => s.trim())
    .filter(Boolean)
})

const selectedValue = ref<string>(defaultValue.value || '')

// 当 defaultValue 变化时同步本地值（仅展示用）
watch(defaultValue, (v) => {
  selectedValue.value = v || ''
})

const containerStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  // 通过 CSS 变量传递 accent 色，给 select:focus 使用
  '--dropdown-accent': accentColor.value,
}))

const labelStyle = computed(() => ({
  color: textColor.value,
}))

const selectStyle = computed(() => ({
  background: bgColor.value,
  color: textColor.value,
  border: `1px solid ${borderColor.value}`,
  borderRadius: `${borderRadius.value}px`,
  fontSize: `${fontSize.value}px`,
}))

const optionStyle = computed(() => ({
  background: bgColor.value,
  color: textColor.value,
}))
</script>

<style scoped lang="less">
.widget-dropdown-filter {
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

  &__select {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    padding: 4px 8px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;

    &:focus,
    &:hover {
      border-color: var(--dropdown-accent, #22d3ee);
    }

    option {
      background: #1e293b;
      color: #e2e8f0;
    }
  }
}
</style>
