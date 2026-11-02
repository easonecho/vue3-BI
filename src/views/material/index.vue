<template>
  <div class="material-page">
    <el-card class="page-card" shadow="never">
      <!-- 顶部筛选栏 -->
      <MaterialFilterBar
        v-model:keyword="filters.keyword"
        v-model:material-type="filters.type"
        @search="handleSearch"
        @reset="handleReset"
        @upload="uploadVisible = true"
      />

      <!-- 素材网格 -->
      <MaterialGrid
        :list="list"
        :loading="loading"
        @preview="openPreview"
        @download="handleDownload"
        @delete="handleDelete"
      />

      <!-- 分页 -->
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 上传对话框 -->
    <MaterialUploadDialog v-model="uploadVisible" @uploaded="reloadFromFirstPage" />

    <!-- 预览对话框 -->
    <MaterialPreviewDialog
      v-model="previewVisible"
      :material="previewMaterial"
      @download="handleDownload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MaterialFilterBar from './components/MaterialFilterBar.vue'
import MaterialGrid from './components/MaterialGrid.vue'
import MaterialUploadDialog from './components/MaterialUploadDialog.vue'
import MaterialPreviewDialog from './components/MaterialPreviewDialog.vue'
import { useMaterialList } from './composables/useMaterialList'
import { useMaterialPreview } from './composables/useMaterialPreview'

const {
  list,
  loading,
  page,
  pageSize,
  total,
  filters,
  loadList,
  handleSearch,
  handleReset,
  handleDelete,
  reloadFromFirstPage,
} = useMaterialList()

const { previewVisible, previewMaterial, openPreview, handleDownload } = useMaterialPreview()

const uploadVisible = ref(false)
</script>

<style scoped lang="less">
.material-page {
  padding: 16px;
}

.page-card {
  background: var(--bi-card-bg, #1f2937);
  border-radius: 8px;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
