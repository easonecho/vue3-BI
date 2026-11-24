<template>
  <PropsSinglePanel v-if="store.selectedComponent" />
  <PropsMultiPanel v-else-if="hasMultiSelection" />
  <el-empty v-else :description="t('editorUi.props.empty')" :image-size="100" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBiEditorStore } from '@/stores/bi-editor'
import PropsSinglePanel from './PropsSinglePanel.vue'
import PropsMultiPanel from './PropsMultiPanel.vue'

const store = useBiEditorStore()
const { t } = useI18n()

/** 有 >1 个组件被选中且无主选时，显示批量修改面板 */
const hasMultiSelection = computed(() => !store.selectedComponent && store.selectedIds.length > 0)
</script>
