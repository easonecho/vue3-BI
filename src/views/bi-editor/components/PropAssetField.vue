<template>
  <div class="asset-field">
    <div v-if="assetPreview" class="asset-preview">
      <img
        v-if="field.assetType === 'image' || field.assetType === 'decor'"
        :src="assetPreview"
        class="asset-preview-img"
      />
      <video v-else-if="field.assetType === 'video'" :src="assetPreview" muted class="asset-preview-video" />
      <span v-else class="asset-preview-decor">{{ field.assetType || 'decor' }}</span>
      <el-button size="small" link type="danger" @click="emit('update:modelValue', field.multiple ? [] : '')">
        清除
      </el-button>
    </div>
    <el-button size="small" type="primary" plain @click="showAssetPicker = true">
      {{ assetPreview ? '更换' : '从素材库选择' }}
    </el-button>
    <span v-if="!assetPreview && field.multiple" class="asset-hint">未选择素材</span>
    <span v-else-if="!assetPreview" class="asset-hint">未选择{{ field.assetType || '素材' }}</span>
    <AssetPicker
      v-model="showAssetPicker"
      :asset-type="field.assetType"
      :multiple="field.multiple"
      @confirm="onAssetConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropField } from '@/views/bi-editor/component-defs/types'
import AssetPicker from './AssetPicker.vue'

const props = defineProps<{
  field: PropField
  modelValue: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

/** 素材选择弹窗显隐 */
const showAssetPicker = ref(false)

/** 当前选中素材的预览 URL（单选取第一个，多选取第一个用于预览） */
const assetPreview = computed(() => {
  const v = props.modelValue
  if (!v) return ''
  if (Array.isArray(v)) return v[0] || ''
  return String(v)
})

/** 素材选择确认回调 */
function onAssetConfirm(urls: string | string[]) {
  emit('update:modelValue', urls)
}
</script>

<style scoped lang="less">
/* ===== asset 素材选择器样式 ===== */
.asset-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.asset-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border: 1px solid var(--bi-border-color, #374151);
  border-radius: 6px;
  background: var(--bi-table-cell-bg, #1f2937);
}

.asset-preview-img,
.asset-preview-video {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.asset-preview-decor {
  font-size: 11px;
  color: var(--bi-text-muted, #9ca3af);
  padding: 0 8px;
  flex-shrink: 0;
}

.asset-hint {
  font-size: 11px;
  color: var(--bi-text-muted, #6b7280);
}
</style>
