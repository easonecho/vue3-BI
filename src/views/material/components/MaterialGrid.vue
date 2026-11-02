<template>
  <div v-loading="loading" class="material-grid">
    <div v-if="list.length === 0 && !loading" class="empty-state">
      <el-empty description="暂无素材，请点击右上角上传" />
    </div>
    <MaterialCard
      v-for="m in list"
      :key="m.id"
      :material="m"
      @preview="emit('preview', $event)"
      @download="emit('download', $event)"
      @delete="emit('delete', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Material } from '@/api/material'
import MaterialCard from './MaterialCard.vue'

defineProps<{
  list: Material[]
  loading: boolean
}>()

const emit = defineEmits<{
  preview: [Material]
  download: [Material]
  delete: [Material]
}>()
</script>

<style scoped lang="less">
.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 16px;
  min-height: 300px;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
</style>
