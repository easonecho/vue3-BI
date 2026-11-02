<template>
  <div class="dashboard-list">
    <!-- 页面头部 -->
    <DashboardPageHeader
      :total="total"
      :published-count="publishedCount"
      :draft-count="draftCount"
    />

    <!-- 顶部筛选栏 -->
    <DashboardFilterBar
      v-model:keyword="filters.keyword"
      v-model:status="filters.status"
      v-model:is-public="filters.isPublic"
      v-model:only-favorites="filters.onlyFavorites"
      v-model:group-filter="groupFilter"
      :groups="groups"
      @search="handleSearch"
      @reset="handleReset"
      @toggle-favorites="toggleFavoritesFilter"
      @group-manage="openGroupDialog"
      @create="openCreateDialog"
    />

    <!-- 看板卡片网格 -->
    <DashboardGrid
      :items="list"
      :loading="loading"
      @preview="handlePreview"
      @edit="handleEdit"
      @toggle-favorite="handleToggleFavorite"
      @command="handleCommand"
      @create="openCreateDialog"
    />

    <!-- 分页 -->
    <DashboardPagination v-model:page="page" :page-size="pageSize" :total="total" @change="loadList" />

    <!-- 重命名对话框 -->
    <DashboardRenameDialog
      v-model="renameVisible"
      v-model:name="renameValue"
      :loading="renaming"
      @confirm="confirmRename"
    />

    <!-- 新建看板对话框（含模板选择步骤） -->
    <DashboardCreateDialog v-model="createVisible" :groups="groups" />

    <!-- 分享看板对话框 (4.2 新增) -->
    <DashboardShareDialog v-model="shareVisible" :dashboard="shareTarget" />

    <!-- P2-3: 分组管理对话框 -->
    <DashboardGroupDialog
      v-model="groupDialogVisible"
      :groups="groups"
      :loading="groupsLoading"
      @refresh="loadGroups"
    />

    <!-- P2-3: 移动到分组对话框 -->
    <DashboardMoveGroupDialog
      v-model="moveGroupVisible"
      :dashboard="moveGroupTarget"
      :groups="groups"
      @moved="loadList"
    />

    <!-- P2-3: 存为模板对话框 -->
    <DashboardSaveTemplateDialog v-model="saveTplVisible" :dashboard="saveTplTarget" />

    <!-- 定时报表订阅 -->
    <ReportSubscriptionDialog v-model="reportVisible" :dashboard="reportTarget" />

    <!-- 版本管理 -->
    <DashboardVersionDialog
      v-model="versionVisible"
      :dashboard="versionTarget"
      @restored="loadList"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardPageHeader from './components/DashboardPageHeader.vue'
import DashboardFilterBar from './components/DashboardFilterBar.vue'
import DashboardGrid from './components/DashboardGrid.vue'
import DashboardPagination from './components/DashboardPagination.vue'
import DashboardRenameDialog from './components/DashboardRenameDialog.vue'
import DashboardCreateDialog from './components/DashboardCreateDialog.vue'
import DashboardShareDialog from './components/DashboardShareDialog.vue'
import DashboardGroupDialog from './components/DashboardGroupDialog.vue'
import DashboardMoveGroupDialog from './components/DashboardMoveGroupDialog.vue'
import DashboardSaveTemplateDialog from './components/DashboardSaveTemplateDialog.vue'
import ReportSubscriptionDialog from './components/report/ReportSubscriptionDialog.vue'
import DashboardVersionDialog from './components/DashboardVersionDialog.vue'
import { useDashboardList } from './composables/useDashboardList'
import { useDashboardActions } from './composables/useDashboardActions'

const router = useRouter()

const {
  list,
  loading,
  page,
  pageSize,
  total,
  publishedCount,
  draftCount,
  filters,
  groupFilter,
  groups,
  groupsLoading,
  loadList,
  loadGroups,
  handleSearch,
  handleReset,
  handleToggleFavorite,
  toggleFavoritesFilter,
  handleDeleted,
  init,
} = useDashboardList()

const {
  reportVisible,
  reportTarget,
  versionVisible,
  versionTarget,
  renameVisible,
  renameValue,
  renaming,
  createVisible,
  shareVisible,
  shareTarget,
  groupDialogVisible,
  moveGroupVisible,
  moveGroupTarget,
  saveTplVisible,
  saveTplTarget,
  handleEdit,
  handlePreview,
  openCreateDialog,
  openGroupDialog,
  handleCommand,
  confirmRename,
} = useDashboardActions({
  router,
  reload: loadList,
  onDeleted: handleDeleted,
  loadGroups,
})

onMounted(init)
</script>

<style scoped lang="less">
.dashboard-list {
  padding: 16px;
}
</style>
