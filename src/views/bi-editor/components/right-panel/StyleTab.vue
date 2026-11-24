<template>
  <div v-if="store.selectedComponent" class="style-section">
    <div class="section">
      <div class="section-title">{{ t('editorUi.style.appearance') }}</div>
      <div class="form-item">
        <label>{{ t('editorUi.style.backgroundColor') }}</label>
        <el-color-picker
          :model-value="store.selectedComponent.style?.backgroundColor || '#ffffff'"
          @update:model-value="(v: string) => updateStyle('backgroundColor', v)"
        />
      </div>
      <div class="form-item">
        <label>{{ t('editorUi.style.borderRadius') }}</label>
        <el-input-number
          :model-value="store.selectedComponent.style?.borderRadius || 0"
          :min="0"
          :max="50"
          @update:model-value="(v: number) => updateStyle('borderRadius', v)"
        />
      </div>
    </div>
  </div>

  <el-empty v-else :description="t('editorUi.style.empty')" :image-size="100" />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useBiEditorStore } from '@/stores/bi-editor'

const store = useBiEditorStore()
const { t } = useI18n()

function updateStyle(key: string, value: any) {
  if (store.selectedId) {
    const comp = store.selectedComponent
    if (comp) {
      store.updateComponent(store.selectedId, {
        style: { ...comp.style, [key]: value },
      })
    }
  }
}
</script>

<style scoped lang="less">
@import './shared.less';
</style>
