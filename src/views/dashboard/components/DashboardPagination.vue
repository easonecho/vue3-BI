<template>
  <div v-if="total > pageSize" class="pagination">
    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next, total"
      @current-change="emit('change')"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  pageSize: number
  total: number
}>()

const emit = defineEmits<{ change: [] }>()

const page = defineModel<number>('page', { required: true })
</script>

<style scoped lang="less">
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* ========== 移动端适配：隐藏总数文案，避免分页溢出 ========== */
@media (max-width: 520px) {
  .pagination :deep(.el-pagination__total) {
    display: none;
  }

  .pagination :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }
}
</style>
