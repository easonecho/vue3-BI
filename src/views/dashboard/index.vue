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
    <el-row :gutter="16" v-loading="loading" class="card-grid">
      <el-col v-for="(item, idx) in list" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
        <div class="dashboard-card" :style="{ animationDelay: `${idx * 0.04}s` }">
          <div class="card-thumb" @click="handlePreview(item.id)">
            <img v-if="item.thumbnail && item.thumbnail.startsWith('data:')" :src="item.thumbnail" :alt="item.name" />
            <div v-else class="thumb-placeholder">
              <el-icon :size="32"><DataAnalysis /></el-icon>
            </div>
            <div class="thumb-overlay">
              <el-button size="small" type="primary" @click.stop="handlePreview(item.id)">
                <el-icon><View /></el-icon>&nbsp;预览
              </el-button>
              <el-button size="small" @click.stop="handleEdit(item.id)">
                <el-icon><Edit /></el-icon>&nbsp;编辑
              </el-button>
            </div>
          </div>
          <div class="card-body">
            <!-- 标题行 -->
            <div class="card-title-row">
              <div class="footer-left">
                <span class="status-indicator" :class="item.status === 1 ? 'is-published' : 'is-draft'" />
                <span class="card-title" :title="item.name">{{ item.name }}</span>
              </div>
              <div class="footer-right">
                <el-tooltip :content="isFavorited(item) ? '取消收藏' : '收藏'" placement="top">
                  <el-icon class="favorite-btn" :class="{ active: isFavorited(item) }" @click.stop="handleToggleFavorite(item)">
                    <component :is="isFavorited(item) ? StarFilled : Star" />
                  </el-icon>
                </el-tooltip>
                <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, item)">
                  <el-icon class="more-btn"><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="rename">
                        <el-icon><Edit /></el-icon>&nbsp;重命名
                      </el-dropdown-item>
                      <el-dropdown-item command="copy">
                        <el-icon><CopyDocument /></el-icon>&nbsp;复制
                      </el-dropdown-item>
                      <el-dropdown-item command="moveGroup">
                        <el-icon><Rank /></el-icon>&nbsp;移动到分组
                      </el-dropdown-item>
                      <el-dropdown-item command="saveAsTemplate">
                        <el-icon><Files /></el-icon>&nbsp;存为模板
                      </el-dropdown-item>
                      <el-dropdown-item command="share">
                        <el-icon><Share /></el-icon>&nbsp;分享
                      </el-dropdown-item>
                      <el-dropdown-item command="toggleStatus" divided>
                        <el-icon><Promotion /></el-icon>&nbsp;{{
                          item.status === 1 ? '转为草稿' : '发布'
                        }}
                      </el-dropdown-item>
                      <el-dropdown-item command="togglePublic">
                        <el-icon><Share /></el-icon>&nbsp;{{
                          item.isPublic ? '设为私有' : '设为公开'
                        }}
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>&nbsp;删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <!-- 描述行 -->
            <p class="card-desc" :title="item.description">{{ item.description || '暂无描述' }}</p>
            <!-- 标签行 -->
            <div class="card-tags">
              <el-tag size="small" :type="item.isPublic ? 'success' : 'info'">{{ item.isPublic ? '公开' : '私有' }}</el-tag>
              <el-tag size="small" :type="item.status === 1 ? 'success' : 'warning'">{{ item.status === 1 ? '已发布' : '草稿' }}</el-tag>
              <el-tag v-if="item._count?.charts" size="small" type="primary" effect="plain">
                <el-icon><PieChart /></el-icon>&nbsp;{{ item._count.charts }}
              </el-tag>
            </div>
          </div>
        </div>
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
    <el-dialog v-model="createVisible" :title="t('dashboard.createTitle')" width="760px">
      <!-- 步骤 1: 选择模板 -->
      <div v-if="createStep === 1" class="template-picker">
        <p class="picker-hint">{{ t('dashboard.templateHint') }}</p>
        <el-tabs v-model="templateTab" class="picker-tabs">
          <!-- Tab 2: 用户模板库 -->
          <el-tab-pane :label="t('dashboard.userTemplateTab')" name="user">
            <div v-loading="userTemplatesLoading">
              <el-row :gutter="12">
                <el-col v-for="tpl in userTemplates" :key="tpl.id" :xs="24" :sm="12" :md="8">
                  <div
                    class="tpl-picker-card"
                    :class="{ active: selectedKind === 'user' && selectedUserTplId === tpl.id }"
                    @click="selectUserTemplate(tpl.id)"
                  >
                    <!-- 缩略图主体 -->
                    <div class="tpl-picker-thumb">
                      <img
                        v-if="tpl.thumbnail && tpl.thumbnail.startsWith('data:')"
                        :src="tpl.thumbnail"
                        :alt="tpl.name"
                        class="thumb-img"
                      />
                      <div v-else class="thumb-placeholder">
                        <el-icon :size="36" color="#94a3b8"><DataAnalysis /></el-icon>
                        <span class="thumb-emoji">{{ tpl.thumbnail || '' }}</span>
                      </div>
                      <!-- hover 遮罩 -->
                      <div class="thumb-overlay">
                        <el-icon class="overlay-icon"><ZoomIn /></el-icon>
                        <span class="overlay-text">预览</span>
                      </div>
                      <!-- 选中徽标 -->
                      <div v-if="selectedKind === 'user' && selectedUserTplId === tpl.id" class="selected-badge">
                        <el-icon><CircleCheckFilled /></el-icon>
                      </div>
                    </div>
                    <!-- 信息区 -->
                    <div class="tpl-picker-info">
                      <div class="tpl-picker-name" :title="tpl.name">{{ tpl.name }}</div>
                      <p class="tpl-picker-desc" :title="tpl.description || ''">{{ tpl.description || t('dashboard.noDesc') }}</p>
                      <div class="tpl-picker-tags">
                        <el-tag v-if="tpl.category" size="small" effect="plain" type="primary">{{
                          tpl.category
                        }}</el-tag>
                        <el-tag v-if="tpl.isSystem" size="small" type="warning" effect="dark">预置</el-tag>
                        <el-tag v-else size="small" :type="tpl.isPublic ? 'success' : 'info'" effect="plain">{{
                          tpl.isPublic ? t('dashboard.public') : t('dashboard.private')
                        }}</el-tag>
                      </div>
                    </div>
                  </div>
                </el-col>
                <el-col v-if="!userTemplatesLoading && userTemplates.length === 0" :span="24">
                  <el-empty :description="t('dashboard.noUserTemplates')">
                    <el-button type="primary" @click="goToTemplateManage">{{
                      t('dashboard.goTemplateLib')
                    }}</el-button>
                  </el-empty>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <!-- 步骤 2: 填写看板信息 -->
      <el-form v-else :model="createForm" label-width="80px">
        <el-form-item :label="t('dashboard.name')">
          <el-input
            v-model="createForm.name"
            :placeholder="t('dashboard.namePlaceholder')"
            maxlength="50"
            show-word-limit
            @keyup.enter="confirmCreate"
          />
        </el-form-item>
        <el-form-item :label="t('dashboard.description')">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            :placeholder="t('dashboard.descPlaceholder')"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('dashboard.group')">
          <el-select
            v-model="createForm.groupId"
            :placeholder="t('dashboard.groupPlaceholder')"
            clearable
            style="width: 100%"
          >
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('dashboard.isPublic')">
          <el-switch v-model="createForm.isPublic" />
          <span class="form-hint">{{ t('dashboard.publicHint') }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button v-if="createStep === 2" @click="createStep = 1">{{
          t('common.back')
        }}</el-button>
        <el-button @click="createVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button v-if="createStep === 1" type="primary" @click="goToCreateStep2">{{
          t('common.next')
        }}</el-button>
        <el-button
          v-if="createStep === 2"
          type="primary"
          :loading="creating"
          @click="confirmCreate"
          >{{ t('dashboard.createAndEdit') }}</el-button
        >
      </template>
    </el-dialog>

    <!-- 分享看板对话框 (4.2 新增) -->
    <el-dialog v-model="shareVisible" title="分享看板" width="480px" @open="loadShareConfig">
      <div v-loading="shareLoading">
        <template v-if="shareConfig?.isShared">
          <el-alert type="success" :closable="false" style="margin-bottom: 16px">
            分享链接已生成,任何人可通过链接访问
          </el-alert>
          <el-input :model-value="shareFullUrl" readonly style="margin-bottom: 12px">
            <template #append>
              <el-button @click="copyShareUrl">
                <el-icon><CopyDocument /></el-icon>&nbsp;复制
              </el-button>
            </template>
          </el-input>
          <div class="share-meta">
            <el-tag v-if="shareConfig.hasPassword" size="small" type="warning">
              <el-icon><Lock /></el-icon>&nbsp;密码保护
            </el-tag>
            <el-tag v-else size="small" type="info">无密码</el-tag>
            <el-tag v-if="shareConfig.expiresAt" size="small" type="warning">
              <el-icon><Clock /></el-icon>&nbsp;{{ formatTime(shareConfig.expiresAt) }} 过期
            </el-tag>
            <el-tag v-else size="small" type="success">永久有效</el-tag>
          </div>
        </template>
        <template v-else-if="shareConfig && !shareConfig.isShared">
          <el-alert type="info" :closable="false" style="margin-bottom: 16px">
            创建分享链接后,任何人可通过链接访问该看板 (无需登录)
          </el-alert>
          <el-form label-width="90px">
            <el-form-item label="密码保护">
              <el-switch v-model="shareForm.enablePassword" />
              <span class="form-hint">开启后访问者需输入密码</span>
            </el-form-item>
            <el-form-item v-if="shareForm.enablePassword" label="访问密码">
              <el-input
                v-model="shareForm.password"
                type="password"
                placeholder="请输入访问密码"
                show-password
                maxlength="50"
              />
            </el-form-item>
            <el-form-item label="有效期">
              <el-select v-model="shareForm.expiresInHours" style="width: 100%">
                <el-option label="永久有效" :value="0" />
                <el-option label="1 天" :value="24" />
                <el-option label="7 天" :value="168" />
                <el-option label="30 天" :value="720" />
                <el-option label="365 天" :value="8760" />
              </el-select>
            </el-form-item>
          </el-form>
        </template>
      </div>
      <template #footer>
        <el-button @click="shareVisible = false">关闭</el-button>
        <template v-if="shareConfig?.isShared">
          <el-popconfirm title="确定取消分享吗? 链接将立即失效" @confirm="handleRevokeShare">
            <template #reference>
              <el-button type="danger" :loading="revoking">取消分享</el-button>
            </template>
          </el-popconfirm>
        </template>
        <template v-else-if="shareConfig && !shareConfig.isShared">
          <el-button type="primary" :loading="creatingShare" @click="handleCreateShare"
            >创建分享链接</el-button
          >
        </template>
      </template>
    </el-dialog>

    <!-- P2-3: 分组管理对话框 -->
    <el-dialog v-model="groupDialogVisible" title="分组管理" width="640px">
      <div style="margin-bottom: 12px">
        <el-button type="primary" size="small" @click="openGroupForm()">
          <el-icon><Plus /></el-icon>&nbsp;新增分组
        </el-button>
      </div>
      <el-table :data="groups" size="small" border v-loading="groupsLoading">
        <el-table-column prop="name" label="分组名称" min-width="140" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="看板数" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row._count?.dashboards ?? 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openGroupForm(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDeleteGroup(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="groupDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- P2-3: 分组表单对话框 -->
    <el-dialog
      v-model="groupFormVisible"
      :title="groupForm.id ? '编辑分组' : '新增分组'"
      width="420px"
      append-to-body
    >
      <el-form :model="groupForm" label-width="80px">
        <el-form-item label="名称">
          <el-input
            v-model="groupForm.name"
            placeholder="请输入分组名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            :rows="2"
            placeholder="可选"
            maxlength="200"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="groupForm.sort" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="groupSaving" @click="handleSaveGroup">保存</el-button>
      </template>
    </el-dialog>

    <!-- P2-3: 移动到分组对话框 -->
    <el-dialog v-model="moveGroupVisible" title="移动到分组" width="420px">
      <el-form label-width="80px">
        <el-form-item label="目标分组">
          <el-select
            v-model="moveGroupTarget"
            placeholder="选择分组 (选空=移出分组)"
            clearable
            style="width: 100%"
          >
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveGroupVisible = false">取消</el-button>
        <el-button type="primary" :loading="movingGroup" @click="confirmMoveGroup">确定</el-button>
      </template>
    </el-dialog>

    <!-- P2-3: 存为模板对话框 -->
    <el-dialog v-model="saveTplVisible" title="保存为模板" width="440px">
      <el-form :model="saveTplForm" label-width="80px">
        <el-form-item label="模板名称">
          <el-input
            v-model="saveTplForm.name"
            placeholder="请输入模板名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="saveTplForm.description"
            type="textarea"
            :rows="2"
            placeholder="可选"
            maxlength="200"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-input
            v-model="saveTplForm.category"
            placeholder="如: 销售/运营/财务 (可选)"
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="是否公开">
          <el-switch v-model="saveTplForm.isPublic" />
          <span class="form-hint">公开模板其他用户可用</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveTplVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingTpl" @click="confirmSaveAsTemplate"
          >保存</el-button
        >
      </template>
    </el-dialog>

    <!-- P2-3: 模板库已迁移至独立菜单 /dashboard-templates -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  MoreFilled,
  Edit,
  View,
  Search,
  Refresh,
  CopyDocument,
  DataAnalysis,
  Delete,
  Promotion,
  Share,
  PieChart,
  User,
  Clock,
  Lock,
  Star,
  StarFilled,
  FolderOpened,
  Files,
  Folder,
  Rank,
  ZoomIn,
  CircleCheckFilled} from '@element-plus/icons-vue'
import {
  getDashboardList,
  deleteDashboard,
  updateDashboard,
  createDashboard,
  copyDashboard,
  toggleFavorite,
  moveDashboardToGroup,
} from '@/api/dashboard'
import type { CreateDashboardParams, DashboardListQuery } from '@/api/dashboard'
import type { Dashboard, DashboardGroup, DashboardTemplate } from '@/api/types'
import { getShareConfig, createShare, revokeShare } from '@/api/share'
import type { ShareConfig } from '@/api/share'
import {
  getDashboardGroupList,
  createDashboardGroup,
  updateDashboardGroup,
  deleteDashboardGroup,
} from '@/api/dashboard-group'
import { getDashboardTemplateList, saveAsTemplate, applyTemplate } from '@/api/dashboard-template'
// preset-templates 已移除：新建看板模板统一从后端模板库获取

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

// 重命名对话框
const renameVisible = ref(false)
const renameValue = ref('')
const renameTarget = ref<Dashboard | null>(null)
const renaming = ref(false)

// 新建对话框
const createVisible = ref(false)
const creating = ref(false)
const createForm = reactive<CreateDashboardParams>({
  name: '',
  description: '',
  isPublic: false,
  groupId: null,
})
/** 模板选择步骤：1=选模板，2=填信息 */
const createStep = ref(1)
/** 新建对话框模板选择：tab + 选中类型 + 选中ID */
const templateTab = ref<'user'>('user')
const selectedKind = ref<'user'>('user')
const selectedUserTplId = ref<number | null>(null)
const userTemplates = ref<DashboardTemplate[]>([])
const userTemplatesLoading = ref(false)

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
  createStep.value = 1
  templateTab.value = 'user'
  selectedKind.value = 'user'
  selectedUserTplId.value = null
  createForm.name = ''
  createForm.description = ''
  createForm.isPublic = false
  createForm.groupId = null
  createVisible.value = true
  // 异步加载用户模板列表
  loadUserTemplatesForCreate()
}

/** 加载用户模板库（新建对话框 Tab 用） */
async function loadUserTemplatesForCreate() {
  userTemplatesLoading.value = true
  try {
    const res = await getDashboardTemplateList()
    userTemplates.value = res.data
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    userTemplatesLoading.value = false
  }
}


function selectUserTemplate(id: number) {
  selectedKind.value = 'user'
  selectedUserTplId.value = id
}

function goToTemplateManage() {
  router.push('/dashboard-templates')
}

/** 步骤 1 → 2：预填看板名称（用模板名作为默认值） */
function goToCreateStep2() {
  if (selectedUserTplId.value !== null) {
    const tpl = userTemplates.value.find((x) => x.id === selectedUserTplId.value)
    if (tpl && !createForm.name) {
      createForm.name = `${tpl.name}_${t('dashboard.title')}`
    }
  }
  createStep.value = 2
}

async function confirmCreate() {
  const name = createForm.name.trim()
  if (!name) {
    ElMessage.warning(t('dashboard.nameRequired'))
    return
  }
  creating.value = true
  try {
    if (selectedUserTplId.value !== null) {
      // 🔑 选了模板：调用 applyTemplate API，由后端复制 layout
      const res = await applyTemplate(selectedUserTplId.value, {
        name,
        description: createForm.description?.trim() || undefined,
        isPublic: createForm.isPublic,
      })
      // 如果用户选了分组，则再更新一次 groupId
      if (createForm.groupId !== null && createForm.groupId !== undefined) {
        try {
          await moveDashboardToGroup(res.data.id, createForm.groupId)
        } catch {
          // 分组归属更新失败不阻塞创建流程
        }
      }
      ElMessage.success(t('dashboard.createSuccess'))
      createVisible.value = false
      router.push(`/bi-editor/${res.data.id}`)
    } else {
      // 🔑 未选模板：创建空白看板
      const res = await createDashboard({
        name,
        description: createForm.description?.trim() || undefined,
        isPublic: createForm.isPublic,
        groupId: createForm.groupId ?? undefined,
      })
      ElMessage.success(t('dashboard.createSuccess'))
      createVisible.value = false
      router.push(`/bi-editor/${res.data.id}`)
    }
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    creating.value = false
  }
}

function handleCommand(cmd: string, item: Dashboard) {
  if (cmd === 'rename') {
    renameTarget.value = item
    renameValue.value = item.name
    renameVisible.value = true
  } else if (cmd === 'copy') {
    handleCopy(item)
  } else if (cmd === 'moveGroup') {
    openMoveGroupDialog(item)
  } else if (cmd === 'saveAsTemplate') {
    openSaveAsTemplateDialog(item)
  } else if (cmd === 'share') {
    handleShare(item)
  } else if (cmd === 'delete') {
    handleDelete(item)
  } else if (cmd === 'toggleStatus') {
    handleToggleStatus(item)
  } else if (cmd === 'togglePublic') {
    handleTogglePublic(item)
  }
}

// ========== 分享功能 (4.2) ==========
const shareVisible = ref(false)
const shareLoading = ref(false)
const shareConfig = ref<ShareConfig | null>(null)
const shareTarget = ref<Dashboard | null>(null)
const creatingShare = ref(false)
const revoking = ref(false)
const shareForm = reactive({
  enablePassword: false,
  password: '',
  expiresInHours: 0,
})

const shareFullUrl = computed(() => {
  if (!shareConfig.value?.shareUrl) return ''
  const origin = window.location.origin
  return `${origin}${shareConfig.value.shareUrl}`
})

function handleShare(item: Dashboard) {
  shareTarget.value = item
  shareConfig.value = null
  shareForm.enablePassword = false
  shareForm.password = ''
  shareForm.expiresInHours = 0
  shareVisible.value = true
}

async function loadShareConfig() {
  if (!shareTarget.value) return
  shareLoading.value = true
  try {
    const res = await getShareConfig(shareTarget.value.id)
    shareConfig.value = res.data
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    shareLoading.value = false
  }
}

async function handleCreateShare() {
  if (!shareTarget.value) return
  if (shareForm.enablePassword && !shareForm.password.trim()) {
    ElMessage.warning('请输入访问密码')
    return
  }
  creatingShare.value = true
  try {
    const res = await createShare(shareTarget.value.id, {
      password: shareForm.enablePassword ? shareForm.password.trim() : undefined,
      expiresInHours: shareForm.expiresInHours || undefined,
    })
    shareConfig.value = res.data
    ElMessage.success('分享链接已生成')
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    creatingShare.value = false
  }
}

async function handleRevokeShare() {
  if (!shareTarget.value) return
  revoking.value = true
  try {
    await revokeShare(shareTarget.value.id)
    shareConfig.value = null
    ElMessage.success('已取消分享')
    shareVisible.value = false
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    revoking.value = false
  }
}

async function copyShareUrl() {
  const url = shareFullUrl.value
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制到剪贴板')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = url
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success('链接已复制')
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
const groupFormVisible = ref(false)
const groupSaving = ref(false)
const groupForm = reactive<{ id: number | null; name: string; description: string; sort: number }>({
  id: null,
  name: '',
  description: '',
  sort: 0,
})

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

function openGroupForm(row?: DashboardGroup) {
  if (row) {
    groupForm.id = row.id
    groupForm.name = row.name
    groupForm.description = row.description || ''
    groupForm.sort = row.sort
  } else {
    groupForm.id = null
    groupForm.name = ''
    groupForm.description = ''
    groupForm.sort = 0
  }
  groupFormVisible.value = true
}

async function handleSaveGroup() {
  const name = groupForm.name.trim()
  if (!name) {
    ElMessage.warning('分组名称不能为空')
    return
  }
  groupSaving.value = true
  try {
    const data = {
      name,
      description: groupForm.description.trim() || undefined,
      sort: groupForm.sort,
    }
    if (groupForm.id) {
      await updateDashboardGroup(groupForm.id, data)
      ElMessage.success('更新成功')
    } else {
      await createDashboardGroup(data)
      ElMessage.success('创建成功')
    }
    groupFormVisible.value = false
    loadGroups()
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    groupSaving.value = false
  }
}

async function handleDeleteGroup(row: DashboardGroup) {
  try {
    await ElMessageBox.confirm(`确定删除分组「${row.name}」吗?`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteDashboardGroup(row.id)
    ElMessage.success('删除成功')
    loadGroups()
  } catch {
    // 用户取消或请求失败
  }
}

// ========== P2-3: 移动到分组 ==========
const moveGroupVisible = ref(false)
const moveGroupTarget = ref<number | null>(null)
const moveGroupDashboard = ref<Dashboard | null>(null)
const movingGroup = ref(false)

function openMoveGroupDialog(item: Dashboard) {
  moveGroupDashboard.value = item
  moveGroupTarget.value = item.groupId ?? null
  moveGroupVisible.value = true
}

async function confirmMoveGroup() {
  if (!moveGroupDashboard.value) return
  movingGroup.value = true
  try {
    await moveDashboardToGroup(moveGroupDashboard.value.id, moveGroupTarget.value)
    ElMessage.success('已移动到分组')
    moveGroupVisible.value = false
    loadList()
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    movingGroup.value = false
  }
}

// ========== P2-3: 存为模板 ==========
const saveTplVisible = ref(false)
const savingTpl = ref(false)
const saveTplTarget = ref<Dashboard | null>(null)
const saveTplForm = reactive({ name: '', description: '', category: '', isPublic: true })

function openSaveAsTemplateDialog(item: Dashboard) {
  saveTplTarget.value = item
  saveTplForm.name = `${item.name}_模板`
  saveTplForm.description = item.description || ''
  saveTplForm.category = ''
  saveTplForm.isPublic = true
  saveTplVisible.value = true
}

async function confirmSaveAsTemplate() {
  if (!saveTplTarget.value) return
  const name = saveTplForm.name.trim()
  if (!name) {
    ElMessage.warning('模板名称不能为空')
    return
  }
  savingTpl.value = true
  try {
    await saveAsTemplate(saveTplTarget.value.id, {
      name,
      description: saveTplForm.description.trim() || undefined,
      category: saveTplForm.category.trim() || undefined,
      isPublic: saveTplForm.isPublic,
    })
    ElMessage.success('已保存为模板')
    saveTplVisible.value = false
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    savingTpl.value = false
  }
}

// ========== P2-3: 模板库已迁移至独立页面 /dashboard-templates ==========
// 此处保留 saveAsTemplate 入口用于「存为模板」功能；CRUD 操作移至 views/dashboard-templates

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

/* 看板卡片 */
.dashboard-card {
  position: relative;
  margin-bottom: 16px;
  border-radius: 8px;
  background: var(--bi-card-bg);
  border: 1px solid var(--bi-card-border);
  overflow: hidden;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  animation: cardEnter 0.3s ease both;

  &:hover {
    border-color: var(--bi-border-accent);
    box-shadow: var(--bi-shadow-sm);
  }

  .card-inner {
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

.card-thumb {
  position: relative;
  height: 160px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bi-text-secondary);
}

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

.card-thumb:hover .thumb-overlay {
  opacity: 1;
}

.card-body {
  padding: 12px 14px;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;

  &.is-published {
    background: var(--bi-success);
  }
  &.is-draft {
    background: var(--bi-warning);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
}

.card-title-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;

  .status-indicator {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;

    &.is-published {
      background: var(--bi-success);
    }
    &.is-draft {
      background: var(--bi-warning);
    }
  }
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--bi-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.card-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.favorite-btn {
  cursor: pointer;
  color: var(--bi-text-muted);
  font-size: 17px;
  transition: color 0.15s ease;

  &:hover {
    color: #fbbf24;
  }

  &.active {
    color: #fbbf24;
  }
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

.card-desc {
  margin: 6px 0 8px;
  font-size: 12px;
  color: var(--bi-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.card-meta {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--bi-border-color);
  border-bottom: 1px solid var(--bi-border-color);

  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--bi-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.card-actions {
  display: flex;
  gap: 8px;

  .el-button {
    flex: 1;
  }
}

.empty-state {
  padding: 40px 0;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--bi-text-secondary);
}

.share-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

:deep(.el-empty__description) {
  color: var(--bi-text-secondary);
}

/* 模板选择器 */
.template-picker {
  .picker-hint {
    font-size: 13px;
    color: var(--bi-text-secondary);
    margin: 0 0 16px 0;
  }

  .picker-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 12px;
    }
    :deep(.el-tabs__content) {
      max-height: 420px;
      overflow-y: auto;
    }
  }
}

/* ========== 新建看板 — 模板选择卡片 ========== */
.tpl-picker-card {
  background: var(--bi-card-bg);
  border: 1.5px solid var(--bi-card-border);
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  min-height: 220px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: var(--bi-border-accent);
    box-shadow: 0 8px 24px -8px rgba(64, 158, 255, 0.25);
    transform: translateY(-2px);

    .thumb-overlay {
      opacity: 1;
    }
  }

  &.active {
    border-color: var(--bi-accent);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2), 0 8px 24px -8px rgba(64, 158, 255, 0.3);

    .selected-badge {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* --- 缩略图区 --- */
  .tpl-picker-thumb {
    position: relative;
    aspect-ratio: 16 / 9;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    overflow: hidden;
    flex-shrink: 0;

    .thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .thumb-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;

      .thumb-emoji {
        font-size: 20px;
      }
    }

    /* hover 遮罩 */
    .thumb-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      opacity: 0;
      transition: opacity 0.2s ease;
      color: #fff;

      .overlay-icon {
        font-size: 24px;
      }
      .overlay-text {
        font-size: 12px;
        font-weight: 500;
      }
    }

    /* 选中徽标 */
    .selected-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--bi-accent);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      opacity: 0;
      transform: scale(0.6);
      transition:
        opacity 0.2s ease,
        transform 0.2s ease;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.5);
    }
  }

  /* --- 信息区 --- */
  .tpl-picker-info {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  .tpl-picker-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--bi-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
  }

  .tpl-picker-desc {
    margin: 0;
    font-size: 12px;
    color: var(--bi-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.5;
  }

  .tpl-picker-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: auto;
  }
}

/* 模板库相关样式已迁移至独立页面 /dashboard-templates */
</style>
