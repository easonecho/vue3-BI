<template>
  <div class="dashboard-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-title-area">
        <h1 class="page-title">看板管理</h1>
        <p class="page-subtitle">共 {{ total }} 个看板</p>
      </div>
      <div class="header-stats">
        <div class="stat-chip">
          <span class="stat-value">{{ total }}</span>
          <span class="stat-label">总计</span>
        </div>
        <div class="stat-chip">
          <span class="stat-value">{{ publishedCount }}</span>
          <span class="stat-label">已发布</span>
        </div>
        <div class="stat-chip">
          <span class="stat-value">{{ draftCount }}</span>
          <span class="stat-label">草稿</span>
        </div>
      </div>
    </div>

    <!-- 顶部筛选栏 -->
    <div class="filter-card">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索看板名称/描述"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="filters.status"
          placeholder="按状态筛选"
          clearable
          style="width: 140px"
          @change="handleSearch"
        >
          <el-option label="已发布" :value="1" />
          <el-option label="草稿" :value="0" />
        </el-select>
        <el-select
          v-model="filters.isPublic"
          placeholder="按公开性筛选"
          clearable
          style="width: 140px"
          @change="handleSearch"
        >
          <el-option label="公开" :value="true" />
          <el-option label="私有" :value="false" />
        </el-select>
        <!-- P2-3: 分组筛选 -->
        <el-select
          v-model="groupFilter"
          placeholder="按分组筛选"
          clearable
          style="width: 160px"
          @change="handleSearch"
        >
          <el-option label="未分组" :value="'ungrouped'" />
          <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>&nbsp;查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>&nbsp;重置
        </el-button>
        <el-button
          :type="filters.onlyFavorites ? 'warning' : 'default'"
          @click="toggleFavoritesFilter"
        >
          <el-icon><component :is="filters.onlyFavorites ? StarFilled : Star" /></el-icon
          >&nbsp;我的收藏
        </el-button>
        <div class="spacer" />
        <!-- P2-3: 分组管理 + 模板库 -->
        <el-button @click="openGroupDialog">
          <el-icon><FolderOpened /></el-icon>&nbsp;{{ t('dashboard.groupManage') }}
        </el-button>
        <el-button type="success" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>&nbsp;新建看板
        </el-button>
      </div>
    </div>

    <!-- 看板卡片网格 -->
    <el-row v-loading="loading" :gutter="16" class="card-grid">
      <el-col v-for="(item, idx) in list" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
        <DashboardCard
          :item="item"
          :index="idx"
          :favorited="isFavorited(item)"
          @preview="handlePreview"
          @edit="handleEdit"
          @toggle-favorite="handleToggleFavorite"
          @command="handleCommand"
        />
      </el-col>

      <el-col v-if="!loading && list.length === 0" :span="24">
        <div class="empty-state">
          <el-empty description="暂无看板,点击右上角新建">
            <el-button type="primary" @click="openCreateDialog">新建看板</el-button>
          </el-empty>
        </div>
      </el-col>
    </el-row>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="loadList"
      />
    </div>

    <!-- 重命名对话框 -->
    <el-dialog v-model="renameVisible" title="重命名看板" width="400px">
      <el-input v-model="renameValue" placeholder="请输入看板名称" maxlength="50" show-word-limit />
      <template #footer>
        <el-button @click="renameVisible = false">取消</el-button>
        <el-button type="primary" :loading="renaming" @click="confirmRename">确定</el-button>
      </template>
    </el-dialog>

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

    <!-- P2-3: 模板库已迁移至独立菜单 /dashboard-templates -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Star, StarFilled, FolderOpened } from '@element-plus/icons-vue'
import {
  getDashboardList,
  deleteDashboard,
  updateDashboard,
  copyDashboard,
  toggleFavorite,
} from '@/api/dashboard'
import type { DashboardListQuery } from '@/api/dashboard'
import type { Dashboard, DashboardGroup } from '@/api/types'
import { getDashboardGroupList } from '@/api/dashboard-group'
import ReportSubscriptionDialog from './components/ReportSubscriptionDialog.vue'
import DashboardVersionDialog from './components/DashboardVersionDialog.vue'
import DashboardCard from './components/DashboardCard.vue'
import DashboardCreateDialog from './components/DashboardCreateDialog.vue'
import DashboardShareDialog from './components/DashboardShareDialog.vue'
import DashboardGroupDialog from './components/DashboardGroupDialog.vue'
import DashboardMoveGroupDialog from './components/DashboardMoveGroupDialog.vue'
import DashboardSaveTemplateDialog from './components/DashboardSaveTemplateDialog.vue'

const router = useRouter()
const { t } = useI18n()

const list = ref<Dashboard[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 统计
const publishedCount = computed(() => list.value.filter((d) => d.status === 1).length)
const draftCount = computed(() => list.value.filter((d) => d.status === 0).length)

// 筛选条件
const filters = reactive({
  keyword: '',
  status: undefined as number | undefined,
  isPublic: undefined as boolean | undefined,
  onlyFavorites: false,
})
const groupFilter = ref<number | 'ungrouped' | undefined>(undefined)

// 定时报表订阅
const reportVisible = ref(false)
const reportTarget = ref<Dashboard | null>(null)

// 版本管理
const versionVisible = ref(false)
const versionTarget = ref<Dashboard | null>(null)

// 重命名对话框
const renameVisible = ref(false)
const renameValue = ref('')
const renameTarget = ref<Dashboard | null>(null)
const renaming = ref(false)

// 新建对话框
const createVisible = ref(false)

// 分享对话框
const shareVisible = ref(false)
const shareTarget = ref<Dashboard | null>(null)

async function loadList() {
  loading.value = true
  try {
    const params: DashboardListQuery = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: filters.keyword || undefined,
      status: filters.status,
      isPublic: filters.isPublic,
      onlyFavorites: filters.onlyFavorites || undefined,
    }
    if (groupFilter.value === 'ungrouped') {
      params.ungrouped = true
    } else if (groupFilter.value !== undefined) {
      params.groupId = groupFilter.value as number
    }
    const res = await getDashboardList(params)
    list.value = res.data.list
    total.value = res.data.total
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadList()
}

function handleReset() {
  filters.keyword = ''
  filters.status = undefined
  filters.isPublic = undefined
  filters.onlyFavorites = false
  groupFilter.value = undefined
  page.value = 1
  loadList()
}

function handleEdit(id: number) {
  router.push(`/bi-editor/${id}`)
}

function handlePreview(id: number) {
  router.push(`/preview/${id}`)
}

// ========== 收藏功能 (4.4) ==========
function isFavorited(item: Dashboard): boolean {
  return !!(item.favorites && item.favorites.length > 0)
}

async function handleToggleFavorite(item: Dashboard) {
  try {
    const res = await toggleFavorite(item.id)
    if (res.data.isFavorited) {
      item.favorites = [{ id: -1 }]
    } else {
      item.favorites = []
    }
    if (filters.onlyFavorites && !res.data.isFavorited) {
      list.value = list.value.filter((d) => d.id !== item.id)
      total.value = Math.max(0, total.value - 1)
    }
  } catch {
    // 错误提示由 request 拦截器统一处理
  }
}

function toggleFavoritesFilter() {
  filters.onlyFavorites = !filters.onlyFavorites
  page.value = 1
  loadList()
}

function openCreateDialog() {
  createVisible.value = true
}

function handleCommand(cmd: string, item: Dashboard) {
  if (cmd === 'rename') {
    renameTarget.value = item
    renameValue.value = item.name
    renameVisible.value = true
  } else if (cmd === 'copy') {
    handleCopy(item)
  } else if (cmd === 'moveGroup') {
    moveGroupTarget.value = item
    moveGroupVisible.value = true
  } else if (cmd === 'saveAsTemplate') {
    saveTplTarget.value = item
    saveTplVisible.value = true
  } else if (cmd === 'share') {
    shareTarget.value = item
    shareVisible.value = true
  } else if (cmd === 'report') {
    reportTarget.value = item
    reportVisible.value = true
  } else if (cmd === 'versions') {
    versionTarget.value = item
    versionVisible.value = true
  } else if (cmd === 'delete') {
    handleDelete(item)
  } else if (cmd === 'toggleStatus') {
    handleToggleStatus(item)
  } else if (cmd === 'togglePublic') {
    handleTogglePublic(item)
  }
}

async function confirmRename() {
  if (!renameTarget.value) return
  const name = renameValue.value.trim()
  if (!name) {
    ElMessage.warning('看板名称不能为空')
    return
  }
  renaming.value = true
  try {
    await updateDashboard(renameTarget.value.id, { name })
    ElMessage.success('重命名成功')
    renameVisible.value = false
    loadList()
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    renaming.value = false
  }
}

async function handleCopy(item: Dashboard) {
  try {
    await ElMessageBox.confirm(`确定复制看板「${item.name}」吗? 副本将作为草稿创建。`, '复制看板', {
      type: 'info',
      confirmButtonText: '复制',
      cancelButtonText: '取消',
    })
    await copyDashboard(item.id)
    ElMessage.success('复制成功')
    loadList()
  } catch {
    // 用户取消或请求失败
  }
}

async function handleToggleStatus(item: Dashboard) {
  const next = item.status === 1 ? 0 : 1
  const label = next === 1 ? '发布' : '转为草稿'
  try {
    await updateDashboard(item.id, { status: next })
    ElMessage.success(`已${label}`)
    loadList()
  } catch {
    // 错误提示由 request 拦截器统一处理
  }
}

async function handleTogglePublic(item: Dashboard) {
  const next = !item.isPublic
  const label = next ? '公开' : '私有'
  try {
    await updateDashboard(item.id, { isPublic: next })
    ElMessage.success(`已设为${label}`)
    loadList()
  } catch {
    // 错误提示由 request 拦截器统一处理
  }
}

async function handleDelete(item: Dashboard) {
  try {
    await ElMessageBox.confirm(`确定删除看板「${item.name}」吗?此操作不可恢复。`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteDashboard(item.id)
    ElMessage.success('删除成功')
    if (list.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    loadList()
  } catch {
    // 用户取消删除,无需处理
  }
}

// ========== P2-3: 分组管理 ==========
const groups = ref<DashboardGroup[]>([])
const groupsLoading = ref(false)
const groupDialogVisible = ref(false)

// 移动到分组
const moveGroupVisible = ref(false)
const moveGroupTarget = ref<Dashboard | null>(null)

// 存为模板
const saveTplVisible = ref(false)
const saveTplTarget = ref<Dashboard | null>(null)

async function loadGroups() {
  groupsLoading.value = true
  try {
    const res = await getDashboardGroupList()
    groups.value = res.data
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    groupsLoading.value = false
  }
}

function openGroupDialog() {
  groupDialogVisible.value = true
  loadGroups()
}

onMounted(() => {
  loadList()
  loadGroups()
})
</script>

<style scoped lang="less">
.dashboard-list {
  padding: 16px;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-title-area {
  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--bi-text-primary);
    margin: 0;
    line-height: 1.3;
  }
  .page-subtitle {
    font-size: 13px;
    color: var(--bi-text-muted);
    margin: 4px 0 0 0;
  }
}

.header-stats {
  display: flex;
  gap: 10px;

  .stat-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 16px;
    border-radius: 8px;
    background: var(--bi-card-bg);
    border: 1px solid var(--bi-card-border);
    min-width: 64px;

    .stat-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--bi-accent);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .stat-label {
      font-size: 10px;
      letter-spacing: 1px;
      color: var(--bi-text-muted);
      margin-top: 2px;
    }
  }
}

/* 筛选栏 */
.filter-card {
  position: relative;
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 8px;
  background: var(--bi-card-bg);
  border: 1px solid var(--bi-card-border);
  box-shadow: var(--bi-shadow-sm);
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  .spacer {
    flex: 1;
  }
}

/* 卡片网格 */
.card-grid {
  min-height: 200px;
}

.empty-state {
  padding: 40px 0;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

:deep(.el-empty__description) {
  color: var(--bi-text-secondary);
}

/* ========== 移动端适配 ========== */
@media (max-width: 768px) {
  .filter-bar {
    gap: 8px;

    :deep(.el-input),
    :deep(.el-select) {
      width: 100% !important;
    }

    .spacer {
      display: none;
    }

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }
}
</style>
