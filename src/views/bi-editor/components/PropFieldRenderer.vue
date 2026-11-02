<template>
  <div
    v-if="visible"
    :class="[
      'form-item',
      { 'form-item--inline': field.type === 'switch' || field.type === 'colorpicker' },
    ]"
  >
    <label>{{ field.label }}</label>

    <!-- 文本输入 -->
    <ElInput
      v-if="field.type === 'input'"
      :model-value="modelValue"
      :placeholder="field.placeholder"
      @update:model-value="(v: string) => emit('update:modelValue', v)"
    />

    <!-- 多行文本 -->
    <ElInput
      v-else-if="field.type === 'textarea'"
      type="textarea"
      :model-value="modelValue"
      :rows="3"
      :placeholder="field.placeholder"
      @update:model-value="(v: string) => emit('update:modelValue', v)"
    />

    <!-- 数字输入 -->
    <ElInputNumber
      v-else-if="field.type === 'number'"
      :model-value="modelValue"
      :min="field.min"
      :max="field.max"
      :step="field.step"
      controls-position="right"
      @update:model-value="(v: number | undefined) => emit('update:modelValue', v)"
    />

    <!-- 滑块 -->
    <el-slider
      v-else-if="field.type === 'slider'"
      :model-value="modelValue"
      :min="field.min ?? 0"
      :max="field.max ?? 100"
      :step="field.step ?? 1"
      @update:model-value="(v: number | number[]) => emit('update:modelValue', v)"
    />

    <!-- 颜色选择 -->
    <ElColorPicker
      v-else-if="field.type === 'colorpicker'"
      :model-value="modelValue || '#ffffff'"
      @update:model-value="(v: string | null) => emit('update:modelValue', v ?? '')"
    />

    <!-- 下拉选择 -->
    <ElSelect
      v-else-if="field.type === 'select'"
      :model-value="modelValue"
      @update:model-value="(v: any) => emit('update:modelValue', v)"
    >
      <ElOption
        v-for="opt in field.options || []"
        :key="String(opt.value)"
        :label="opt.label"
        :value="opt.value"
      />
    </ElSelect>

    <!-- 开关 -->
    <ElSwitch
      v-else-if="field.type === 'switch'"
      :model-value="modelValue"
      @update:model-value="(v: string | number | boolean) => emit('update:modelValue', v)"
    />

    <!-- 🔑 表格：可编辑列表，用户按每一项数据单独配置样式（series 每个数据项的颜色/线宽等） -->
    <PropTableEditor
      v-else-if="field.type === 'table'"
      :field="field"
      :model-value="modelValue"
      @update:model-value="(v: any) => emit('update:modelValue', v)"
    />

    <!-- 🔑 素材选择器：从素材库选择 video/image/decor 素材，单选返回 url string，多选返回 string[] -->
    <PropAssetField
      v-else-if="field.type === 'asset'"
      :field="field"
      :model-value="modelValue"
      @update:model-value="(v: any) => emit('update:modelValue', v)"
    />

    <!-- 未知类型 fallback -->
    <span v-else class="unsupported">不支持的控件类型: {{ field.type }}</span>

    <span v-if="field.tip" class="field-tip">{{ field.tip }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropField } from '@/views/bi-editor/component-defs/types'
import { isFieldVisible } from '@/views/bi-editor/component-defs/types'
import PropTableEditor from './PropTableEditor.vue'
import PropAssetField from './PropAssetField.vue'

const props = defineProps<{
  field: PropField
  modelValue: any
  /** 当前组件的完整 props，用于 visibleWhen 条件判断 */
  allProps?: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

/** 🔑 根据 visibleWhen 条件决定是否渲染 */
const visible = computed(() => isFieldVisible(props.field, props.allProps || {}))
</script>

<style scoped lang="less">
.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-item--inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.form-item label {
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
}

.field-tip {
  font-size: 11px;
  color: var(--bi-text-muted, #6b7280);
}

.unsupported {
  font-size: 12px;
  color: var(--bi-text-muted, #6b7280);
  font-style: italic;
}
</style>
