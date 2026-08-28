<template>
  <div class="tpl-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-title-area">
        <h1 class="page-title">{{ t('templateManage.title') }}</h1>
        <p class="page-subtitle">{{ t('templateManage.subtitle', { count: total }) }}</p>
      </div>
      <div class="header-stats">
        <div class="stat-chip">
          <span class="stat-value">{{ total }}</span>
          <span class="stat-label">{{ t('templateManage.statTotal') }}</span>
        </div>
        <div class="stat-chip">
          <span class="stat-value">{{ presetCount }}</span>
          <span class="stat-label">{{ t('templateManage.statPreset') }}</span>
        </div>
        <div class="stat-chip">
          <span class="stat-value">{{ userCount }}</span>
          <span class="stat-label">{{ t('templateManage.statUser') }}</span>
        </div>
      </div>
    </div>

    <!-- 顶部筛选栏 -->
    <div class="filter-card">
      <!-- 分类 Tab: 全部 / 预置模板 / 用户模板 -->
      <el-tabs v-model="activeTab" class="category-tabs" @tab-change="handleTabChange">
        <el-tab-pane :label="t('templateManage.tabAll')" name="all" />
        <el-tab-pane :label="t('templateManage.tabPreset')" name="preset" />
        <el-tab-pane :label="t('templateManage.tabUser')" name="user" />
      </el-tabs>
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          :placeholder="t('templateManage.searchPlaceholder')"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="filters.category"
          :placeholder="t('templateManage.categoryFilter')"
          clearable
          style="width: 160px"
          @change="handleSearch"
        >
          <el-option v-for="c in categoryOptions" :key="c.value" :label="t(c.i18nKey)" :value="c.value" />
        </el-select>
        <el-select
          v-model="filters.isPublic"
          :placeholder="t('templateManage.publicFilter')"
          clearable
          style="width: 140px"
          @change="handleSearch"
        >
          <el-option :label="t('dashboard.public')" :value="true" />
          <el-option :label="t('dashboard.private')" :value="false" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>&nbsp;{{ t('common.search') }}
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>&nbsp;{{ t('common.reset') }}
        </el-button>
        <div class="spacer" />
        <!-- 预置模板 Tab 下隐藏「新建模板」按钮 (预置模板由系统维护) -->
        <el-button v-if="activeTab !== 'preset'" type="success" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>&nbsp;{{ t('templateManage.create') }}
        </el-button>
      </div>
    </div>

    <!-- 模板卡片网格 -->
    <el-row :gutter="16" v-loading="loading" class="card-grid">
      <el-col
        v-for="(item, idx) in filteredList"
        :key="item.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <div class="tpl-card" :style="{ animationDelay: `${idx * 0.04}s` }">
          <div class="tpl-inner">
            <!-- 缩略图区域 (主体), 点击跳转预览; hover 显示操作遮罩 -->
            <div class="tpl-thumb" @click="router.push(`/preview-template/${item.id}`)">
              <img
                v-if="item.thumbnail && item.thumbnail.startsWith('data:')"
                :src="item.thumbnail"
                :alt="item.name"
                class="thumb-img"
              />
              <span v-else class="thumb-emoji">{{ item.thumbnail || '📊' }}</span>
              <div class="thumb-overlay">
                <el-button
                  size="small"
                  type="primary"
                  @click.stop="router.push(`/preview-template/${item.id}`)"
                >
                  <el-icon><View /></el-icon>&nbsp;{{ t('templateManage.preview') }}
                </el-button>
                <!-- 系统预置模板禁止编辑 -->
                <el-button
                  v-if="!item.isSystem"
                  size="small"
                  @click.stop="openEditDialog(item)"
                >
                  <el-icon><Edit /></el-icon>&nbsp;{{ t('common.edit') }}
                </el-button>
              </div>
            </div>
            <!-- 底部信息区: 标题行 + 描述行 + 标签行 -->
            <div class="tpl-body">
              <!-- 标题行: 模板名称 + 预置/用户标签 + 更多操作下拉 -->
              <div class="tpl-title-row">
                <span class="tpl-name" :title="item.name">{{ item.name }}</span>
                <el-tag v-if="item.isSystem" size="small" type="warning" effect="dark">
                  {{ t('templateManage.systemTag') }}
                </el-tag>
                <el-tag v-else size="small" type="success" effect="plain">
                  {{ t('templateManage.userTag') }}
                </el-tag>
                <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, item)">
                  <el-icon class="more-btn"><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="apply">
                        <el-icon><Plus /></el-icon>&nbsp;{{ t('templateManage.apply') }}
                      </el-dropdown-item>
                      <el-dropdown-item command="preview">
                        <el-icon><View /></el-icon>&nbsp;{{ t('templateManage.preview') }}
                      </el-dropdown-item>
                      <!-- 系统预置模板禁止 edit/copy/togglePublic/delete -->
                      <template v-if="!item.isSystem">
                        <el-dropdown-item command="edit">
                          <el-icon><Edit /></el-icon>&nbsp;{{ t('common.edit') }}
                        </el-dropdown-item>
                        <el-dropdown-item command="copy">
                          <el-icon><CopyDocument /></el-icon>&nbsp;{{ t('templateManage.copy') }}
                        </el-dropdown-item>
                        <el-dropdown-item command="togglePublic" divided>
                          <el-icon><Share /></el-icon>&nbsp;{{ item.isPublic ? t('dashboard.setPrivate') : t('dashboard.setPublic') }}
                        </el-dropdown-item>
                        <el-dropdown-item command="delete" divided>
                          <el-icon><Delete /></el-icon>&nbsp;{{ t('common.delete') }}
                        </el-dropdown-item>
                      </template>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <!-- 描述行: 1 行截断, 无描述时显示占位 -->
              <p class="tpl-desc" :title="item.description || ''">{{ item.description || t('dashboard.noDesc') }}</p>
              <!-- 标签行: 分类标签 + 公开/私有标签 -->
              <div class="tpl-tags">
                <el-tag v-if="item.category" size="small" type="primary" effect="plain">
                  {{ categoryLabel(item.category) }}
                </el-tag>
                <el-tag size="small" :type="item.isPublic ? 'success' : 'info'">
                  {{ item.isPublic ? t('dashboard.public') : t('dashboard.private') }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col v-if="!loading && filteredList.length === 0" :span="24">
        <div class="empty-state">
          <el-empty :description="t('templateManage.empty')">
            <el-button type="primary" @click="openCreateDialog">{{ t('templateManage.create') }}</el-button>
          </el-empty>
        </div>
      </el-col>
    </el-row>

    <!-- 应用模板创建看板对话框 -->
    <el-dialog v-model="applyVisible" :title="t('dashboard.applyTemplateTitle')" width="440px">
      <el-form :model="applyForm" label-width="80px">
        <el-form-item :label="t('dashboard.name')" required>
          <el-input v-model="applyForm.name" :placeholder="t('dashboard.namePlaceholder')" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item :label="t('dashboard.description')">
          <el-input
            v-model="applyForm.description"
            type="textarea"
            :rows="2"
            :placeholder="t('dashboard.descPlaceholder')"
            maxlength="200"
          />
        </el-form-item>
        <el-form-item :label="t('dashboard.isPublic')">
          <el-switch v-model="applyForm.isPublic" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="applying" @click="confirmApplyTemplate">
          {{ t('dashboard.createAndEdit') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, MoreFilled, Edit, View, Search, Refresh, CopyDocument,
  Delete, Share,
} from '@element-plus/icons-vue'
import {
  getDashboardTemplateList, createDashboardTemplate, updateDashboardTemplate,
  deleteDashboardTemplate, applyTemplate, getTemplateCategories,
} from '@/api/dashboard-template'
import type { DashboardTemplate, CreateDashboardTemplateParams, DashboardTemplateListQuery, TemplateCategoryOption } from '@/api/dashboard-template'
// preset-templates 已移除：模板统一走后端 + 编辑器可视化创建

const router = useRouter()
const { t } = useI18n()

const list = ref<DashboardTemplate[]>([])
const categories = ref<TemplateCategoryOption[]>([])
const loading = ref(false)
const total = computed(() => list.value.length)
const presetCount = computed(() => list.value.filter((x) => x.isSystem).length)
const userCount = computed(() => list.value.filter((x) => !x.isSystem).length)

/** 当前分类 Tab: all=全部, preset=预置模板, user=用户模板 */
const activeTab = ref<'all' | 'preset' | 'user'>('all')

const filters = reactive({
  keyword: '',
  category: undefined as string | undefined,
  isPublic: undefined as boolean | undefined,
})

// 分类筛选选项 (服务端枚举统一管理, 不再从模板列表动态提取)
const categoryOptions = computed(() => categories.value)

/** 根据 category value 获取本地化显示文本 */
function categoryLabel(value?: string | null): string {
  if (!value) return ''
  const opt = categories.value.find((c) => c.value === value)
  return opt ? t(opt.i18nKey) : value
}

// 客户端过滤后的列表
const filteredList = computed(() => {
  return list.value.filter((x) => {
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      const hit = x.name.toLowerCase().includes(kw) || (x.description || '').toLowerCase().includes(kw)
      if (!hit) return false
    }
    if (filters.category !== undefined && x.category !== filters.category) return false
    if (filters.isPublic !== undefined && x.isPublic !== filters.isPublic) return false
    return true
  })
})

function formatTime(t?: string): string {
  if (!t) return '-'
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return '-'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function loadList() {
  loading.value = true
  try {
    // 根据 activeTab 构造查询参数
    const query: DashboardTemplateListQuery = {}
    if (activeTab.value === 'preset') query.isSystem = true
    else if (activeTab.value === 'user') query.isSystem = false
    const res = await getDashboardTemplateList(query)
    list.value = res.data
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    loading.value = false
  }
}

/** Tab 切换时重新拉取数据 */
function handleTabChange() {
  // 切换 Tab 时重置分类筛选 (避免新 Tab 下分类为空导致全部隐藏)
  filters.category = undefined
  filters.isPublic = undefined
  loadList()
}

function handleSearch() {
  // 客户端过滤由 filteredList computed 自动响应
}

function handleReset() {
  filters.keyword = ''
  filters.category = undefined
  filters.isPublic = undefined
}

// ========== 创建/编辑模板 ==========
const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const editTarget = ref<DashboardTemplate | null>(null)
const form = reactive({
  name: '',
  description: '',
  category: '',
  thumbnail: '',
  isPublic: true,
  layoutText: '',
})

function resetForm() {
  form.name = ''
  form.description = ''
  form.category = ''
  form.thumbnail = '📊'
  form.isPublic = true
  form.layoutText = ''
  editTarget.value = null
}

function openCreateDialog() {
  // 🔑 走编辑器可视化创建模板（替代表单对话框）
  router.push('/bi-editor-template')
}

function openEditDialog(item: DashboardTemplate) {
  // 🔑 走编辑器可视化编辑模板（替代表单对话框）
  router.push(`/bi-editor-template/${item.id}`)
}

async function handleSave() {
  const name = form.name.trim()
  if (!name) {
    ElMessage.warning(t('dashboard.templateNameRequired'))
    return
  }
  // 解析 layout JSON
  let layout: Record<string, unknown> | undefined
  if (form.layoutText.trim()) {
    try {
      layout = JSON.parse(form.layoutText)
    } catch {
      ElMessage.error(t('templateManage.layoutInvalid'))
      return
    }
  }
  saving.value = true
  try {
    const data: CreateDashboardTemplateParams = {
      name,
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      thumbnail: form.thumbnail.trim() || undefined,
      isPublic: form.isPublic,
      layout,
    }
    if (formMode.value === 'edit' && editTarget.value) {
      await updateDashboardTemplate(editTarget.value.id, data)
      ElMessage.success(t('templateManage.updateSuccess'))
    } else {
      await createDashboardTemplate(data)
      ElMessage.success(t('templateManage.createSuccess'))
    }
    formVisible.value = false
    loadList()
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    saving.value = false
  }
}

async function handleCopy(item: DashboardTemplate) {
  try {
    const name = `${item.name}_copy`
    await createDashboardTemplate({
      name,
      description: item.description || undefined,
      category: item.category || undefined,
      thumbnail: item.thumbnail || undefined,
      isPublic: false,
      layout: item.layout || undefined,
    })
    ElMessage.success(t('templateManage.copySuccess'))
    loadList()
  } catch {
    // 错误提示由 request 拦截器统一处理
  }
}

async function handleTogglePublic(item: DashboardTemplate) {
  try {
    await updateDashboardTemplate(item.id, { isPublic: !item.isPublic })
    ElMessage.success(item.isPublic ? t('dashboard.setPrivateDone') : t('dashboard.setPublicDone'))
    loadList()
  } catch {
    // 错误提示由 request 拦截器统一处理
  }
}

async function handleDelete(item: DashboardTemplate) {
  try {
    await ElMessageBox.confirm(t('dashboard.deleteTemplateConfirm', { name: item.name }), t('dashboard.deleteTitle'), {
      type: 'warning',
      confirmButtonText: t('dashboard.deleteBtn'),
      cancelButtonText: t('common.cancel'),
    })
    await deleteDashboardTemplate(item.id)
    ElMessage.success(t('dashboard.deleteSuccess'))
    loadList()
  } catch {
    // 用户取消或请求失败
  }
}

function handleCommand(cmd: string, item: DashboardTemplate) {
  if (cmd === 'apply') handleApplyTemplate(item)
  else if (cmd === 'preview') router.push(`/preview-template/${item.id}`)
  else if (cmd === 'edit') openEditDialog(item)
  else if (cmd === 'copy') handleCopy(item)
  else if (cmd === 'togglePublic') handleTogglePublic(item)
  else if (cmd === 'delete') handleDelete(item)
}

// ========== 应用模板创建看板 ==========
const applyVisible = ref(false)
const applying = ref(false)
const applyTarget = ref<DashboardTemplate | null>(null)
const applyForm = reactive({ name: '', description: '', isPublic: false })

function handleApplyTemplate(item: DashboardTemplate) {
  applyTarget.value = item
  applyForm.name = `${item.name}_${t('dashboard.title')}`
  applyForm.description = item.description || ''
  applyForm.isPublic = false
  applyVisible.value = true
}

async function confirmApplyTemplate() {
  if (!applyTarget.value) return
  const name = applyForm.name.trim()
  if (!name) {
    ElMessage.warning(t('dashboard.nameRequired'))
    return
  }
  applying.value = true
  try {
    const res = await applyTemplate(applyTarget.value.id, {
      name,
      description: applyForm.description.trim() || undefined,
      isPublic: applyForm.isPublic,
    })
    ElMessage.success(t('dashboard.applySuccess'))
    applyVisible.value = false
    router.push(`/bi-editor/${res.data.id}`)
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    applying.value = false
  }
}

onMounted(() => {
  loadList()
  loadCategories()
})

async function loadCategories() {
  try {
    const res = await getTemplateCategories()
    categories.value = res.data
  } catch {
    // 分类枚举拉取失败时静默, 筛选下拉退化为空
  }
}
</script>

<style scoped lang="less">
.tpl-page {
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

.category-tabs {
  margin-bottom: 12px;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: var(--bi-border-color);
  }
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

/* 模板卡片 */
.tpl-card {
  position: relative;
  margin-bottom: 16px;
  border-radius: 8px;
  background: var(--bi-card-bg);
  border: 1px solid var(--bi-card-border);
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  animation: cardEnter 0.3s ease both;

  &:hover {
    border-color: var(--bi-border-accent);
    box-shadow: var(--bi-shadow-sm);
  }

  .tpl-inner {
    padding: 0;
  }
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 缩略图主体: 高 160px, 点击预览, hover 显示遮罩操作 */
.tpl-thumb {
  position: relative;
  height: 160px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bi-bg-muted, rgba(128, 128, 128, 0.06));

  .thumb-emoji {
    font-size: 48px;
    line-height: 1;
  }

  .thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* 半透明遮罩 + 操作按钮 */
  .thumb-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .thumb-overlay {
    opacity: 1;
  }
}

/* 底部信息区 */
.tpl-body {
  padding: 12px 14px;
}

.tpl-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tpl-desc {
  margin: 6px 0 8px;
  font-size: 12px;
  color: var(--bi-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tpl-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tpl-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--bi-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.more-btn {
  cursor: pointer;
  color: var(--bi-text-secondary);
  font-size: 18px;
  flex-shrink: 0;
  transition: color 0.2s;

  &:hover {
    color: var(--bi-accent);
  }
}

.empty-state {
  padding: 40px 0;
}

.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--bi-text-secondary);
}

.layout-editor {
  :deep(textarea) {
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
    font-size: 12px;
    line-height: 1.5;
  }
}

.layout-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

:deep(.el-empty__description) {
  color: var(--bi-text-secondary);
}
</style>
