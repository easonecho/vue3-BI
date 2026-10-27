<template>
  <el-dialog
    v-model="visible"
    :title="dashboard ? `版本管理 - ${dashboard.name}` : '版本管理'"
    width="900px"
    destroy-on-close
    @closed="handleClosed"
  >
    <div class="version-toolbar">
      <el-button type="primary" size="small" @click="openSaveDialog">
        <el-icon><Plus /></el-icon>&nbsp;保存当前版本
      </el-button>
      <el-button size="small" :loading="loading" @click="loadVersions">刷新</el-button>
      <el-input
        v-model="keyword"
        size="small"
        placeholder="搜索版本名称/备注"
        clearable
        style="width: 200px"
        :prefix-icon="Search"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <span class="version-hint">恢复历史版本前会自动备份当前配置，可随时回退</span>
    </div>

    <el-table v-loading="loading" :data="versions" size="small" border>
      <el-table-column label="版本" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">v{{ row.versionNo }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="看板名称" min-width="160" show-overflow-tooltip />
      <el-table-column label="备注" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ row.remark || '-' }}</template>
      </el-table-column>
      <el-table-column label="创建人" width="120" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.creator?.nickname || row.creator?.username || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">查看</el-button>
          <el-button link type="warning" size="small" @click="handleRestore(row)">恢复</el-button>
          <el-popconfirm
            title="确定删除该版本快照吗?"
            confirm-button-type="danger"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-empty
      v-if="!loading && versions.length === 0"
      description="暂无版本快照，点击「保存当前版本」创建"
      :image-size="60"
    />
    <div v-if="total > pageSize" class="version-pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        small
        @current-change="loadVersions"
      />
    </div>

    <!-- 保存版本 -->
    <el-dialog v-model="saveVisible" title="保存版本快照" width="440px" append-to-body destroy-on-close>
      <el-form label-width="70px">
        <el-form-item label="备注">
          <el-input
            v-model="remark"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="可选，如: 销售看板改版前"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 版本详情 -->
    <el-dialog v-model="detailVisible" title="版本详情" width="720px" append-to-body destroy-on-close>
      <div v-loading="detailLoading">
        <template v-if="detail">
          <el-descriptions :column="2" size="small" border class="detail-meta">
            <el-descriptions-item label="版本号">v{{ detail.versionNo }}</el-descriptions-item>
            <el-descriptions-item label="看板名称">{{ detail.name }}</el-descriptions-item>
            <el-descriptions-item label="组件数">{{ componentCount }}</el-descriptions-item>
            <el-descriptions-item label="图表数">{{ detail.snapshot?.chartCount ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="画布尺寸">{{ canvasSize }}</el-descriptions-item>
            <el-descriptions-item label="快照时间">
              {{ formatTime(detail.snapshot?.capturedAt || detail.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">
              {{ detail.remark || '-' }}
            </el-descriptions-item>
          </el-descriptions>
          <div class="detail-thumb">
            <img
              v-if="detail.snapshot?.thumbnail?.startsWith('data:')"
              :src="detail.snapshot.thumbnail"
              alt="版本缩略图"
            />
            <div v-else class="detail-thumb__empty">
              <el-icon :size="28"><DataAnalysis /></el-icon>
              <span>该版本无缩略图</span>
            </div>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="detail" type="warning" @click="handleRestore(detail)">恢复此版本</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, DataAnalysis } from '@element-plus/icons-vue'
import {
  getDashboardVersions,
  getDashboardVersion,
  createDashboardVersion,
  restoreDashboardVersion,
  deleteDashboardVersion,
  type DashboardVersion,
} from '@/api/dashboard-version'

const props = defineProps<{
  modelValue: boolean
  dashboard: { id: number; name: string } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'restored'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const versions = ref<DashboardVersion[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)
const keyword = ref('')

const saveVisible = ref(false)
const saving = ref(false)
const remark = ref('')

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<DashboardVersion | null>(null)

const componentCount = computed(() => detail.value?.snapshot?.layout?.components?.length ?? 0)

const canvasSize = computed(() => {
  const canvas = detail.value?.snapshot?.layout?.canvas as
    | { width?: number; height?: number }
    | null
    | undefined
  if (!canvas?.width || !canvas?.height) return '-'
  return `${canvas.width} × ${canvas.height}`
})

watch(
  () => props.modelValue,
  (value) => {
    if (value && props.dashboard) {
      page.value = 1
      keyword.value = ''
      loadVersions()
    }
  },
)

function handleClosed() {
  versions.value = []
  total.value = 0
  page.value = 1
  saveVisible.value = false
  detailVisible.value = false
  detail.value = null
}

function formatTime(value?: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', { hour12: false })
}

async function loadVersions() {
  if (!props.dashboard) return
  loading.value = true
  try {
    const res = await getDashboardVersions(props.dashboard.id, {
      page: page.value,
      pageSize,
      keyword: keyword.value.trim() || undefined,
    })
    versions.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载版本列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadVersions()
}

function openSaveDialog() {
  remark.value = ''
  saveVisible.value = true
}

async function confirmSave() {
  if (!props.dashboard) return
  saving.value = true
  try {
    await createDashboardVersion(props.dashboard.id, remark.value.trim() || undefined)
    ElMessage.success('版本已保存')
    saveVisible.value = false
    page.value = 1
    await loadVersions()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存版本失败')
  } finally {
    saving.value = false
  }
}

async function openDetail(row: DashboardVersion) {
  if (!props.dashboard) return
  detail.value = null
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await getDashboardVersion(props.dashboard.id, row.id)
    detail.value = res.data
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载版本详情失败')
  } finally {
    detailLoading.value = false
  }
}

async function handleRestore(row: DashboardVersion) {
  if (!props.dashboard) return
  try {
    await ElMessageBox.confirm(
      `确定恢复到 v${row.versionNo} 吗? 当前配置会先自动备份为新版本，恢复后需刷新编辑器查看。`,
      '恢复版本',
      { type: 'warning', confirmButtonText: '恢复', cancelButtonText: '取消' },
    )
  } catch {
    return // 用户取消
  }
  try {
    const res = await restoreDashboardVersion(props.dashboard.id, row.id)
    ElMessage.success(`已恢复 v${row.versionNo}，当前配置已备份为 v${res.data.backupVersionNo}`)
    detailVisible.value = false
    emit('restored')
    page.value = 1
    await loadVersions()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '恢复版本失败')
  }
}

async function handleDelete(row: DashboardVersion) {
  if (!props.dashboard) return
  try {
    await deleteDashboardVersion(props.dashboard.id, row.id)
    ElMessage.success('版本已删除')
    if (versions.value.length === 1 && page.value > 1) page.value -= 1
    await loadVersions()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '删除版本失败')
  }
}
</script>

<style scoped lang="less">
.version-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.version-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.version-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.detail-meta {
  margin-bottom: 14px;
}

.detail-thumb {
  height: 260px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.detail-thumb__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

@media (max-width: 768px) {
  .version-toolbar {
    :deep(.el-input) {
      width: 100% !important;
    }
    .version-hint {
      display: none;
    }
  }
}
</style>
