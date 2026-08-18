<template>
  <div class="dashboard-list">
    <!-- 顶部筛选栏 -->
    <el-card class="filter-card" shadow="never">
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
          <el-icon><component :is="filters.onlyFavorites ? StarFilled : Star" /></el-icon>&nbsp;我的收藏
        </el-button>
        <div class="spacer" />
        <!-- P2-3: 分组管理 + 模板库 -->
        <el-button @click="openGroupDialog">
          <el-icon><FolderOpened /></el-icon>&nbsp;分组管理
        </el-button>
        <el-button @click="openTemplateDialog">
          <el-icon><Files /></el-icon>&nbsp;模板库
        </el-button>
        <el-button type="success" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>&nbsp;新建看板
        </el-button>
      </div>
    </el-card>

    <!-- 看板卡片网格 -->
    <el-row :gutter="16" v-loading="loading" class="card-grid">
      <el-col v-for="item in list" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="dashboard-card" shadow="hover">
          <div class="card-header">
            <span class="card-title" :title="item.name">{{ item.name }}</span>
            <div class="card-header-actions">
              <el-tooltip :content="isFavorited(item) ? '取消收藏' : '收藏'" placement="top">
                <el-icon
                  class="favorite-btn"
                  :class="{ active: isFavorited(item) }"
                  @click.stop="handleToggleFavorite(item)"
                >
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
                      <el-icon><Promotion /></el-icon>&nbsp;{{ item.status === 1 ? '转为草稿' : '发布' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="togglePublic">
                      <el-icon><Share /></el-icon>&nbsp;{{ item.isPublic ? '设为私有' : '设为公开' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>&nbsp;删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <p class="card-desc" :title="item.description">{{ item.description || '暂无描述' }}</p>

          <div class="card-meta">
            <el-tag size="small" :type="item.isPublic ? 'success' : 'info'">
              {{ item.isPublic ? '公开' : '私有' }}
            </el-tag>
            <el-tag size="small" :type="item.status === 1 ? 'success' : 'warning'">
              {{ item.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
            <el-tag v-if="item.group" size="small" type="primary" effect="plain">
              <el-icon><Folder /></el-icon>&nbsp;{{ item.group.name }}
            </el-tag>
            <el-tag size="small" type="primary" effect="plain">
              <el-icon><PieChart /></el-icon>&nbsp;{{ item._count?.charts ?? 0 }}
            </el-tag>
          </div>

          <div class="card-info">
            <span class="info-item" :title="`创建者: ${item.creator?.nickname || item.creator?.username || '-'}`">
              <el-icon><User /></el-icon>
              {{ item.creator?.nickname || item.creator?.username || '-' }}
            </span>
            <span class="info-item" :title="`创建时间: ${formatTime(item.createdAt)}`">
              <el-icon><Clock /></el-icon>
              {{ formatTime(item.createdAt) }}
            </span>
          </div>

          <div class="card-actions">
            <el-button size="small" @click="handleEdit(item.id)">
              <el-icon><Edit /></el-icon>&nbsp;编辑
            </el-button>
            <el-button size="small" @click="handlePreview(item.id)">
              <el-icon><View /></el-icon>&nbsp;预览
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col v-if="!loading && list.length === 0" :span="24">
        <el-empty description="暂无看板,点击右上角新建">
          <el-button type="primary" @click="openCreateDialog">新建看板</el-button>
        </el-empty>
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

    <!-- 新建看板对话框 -->
    <el-dialog v-model="createVisible" title="新建看板" width="440px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="看板名称">
          <el-input
            v-model="createForm.name"
            placeholder="请输入看板名称"
            maxlength="50"
            show-word-limit
            @keyup.enter="confirmCreate"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="可选, 看板用途说明"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属分组">
          <el-select v-model="createForm.groupId" placeholder="不选择则归为未分组" clearable style="width: 100%">
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否公开">
          <el-switch v-model="createForm.isPublic" />
          <span class="form-hint">公开看板可通过分享链接访问</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="confirmCreate">创建并编辑</el-button>
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
              <el-input v-model="shareForm.password" type="password" placeholder="请输入访问密码" show-password maxlength="50" />
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
          <el-button type="primary" :loading="creatingShare" @click="handleCreateShare">创建分享链接</el-button>
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
            <el-button link type="danger" size="small" @click="handleDeleteGroup(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="groupDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- P2-3: 分组表单对话框 -->
    <el-dialog v-model="groupFormVisible" :title="groupForm.id ? '编辑分组' : '新增分组'" width="420px" append-to-body>
      <el-form :model="groupForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="groupForm.description" type="textarea" :rows="2" placeholder="可选" maxlength="200" />
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
          <el-select v-model="moveGroupTarget" placeholder="选择分组 (选空=移出分组)" clearable style="width: 100%">
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
          <el-input v-model="saveTplForm.name" placeholder="请输入模板名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="saveTplForm.description" type="textarea" :rows="2" placeholder="可选" maxlength="200" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="saveTplForm.category" placeholder="如: 销售/运营/财务 (可选)" maxlength="50" />
        </el-form-item>
        <el-form-item label="是否公开">
          <el-switch v-model="saveTplForm.isPublic" />
          <span class="form-hint">公开模板其他用户可用</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveTplVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingTpl" @click="confirmSaveAsTemplate">保存</el-button>
      </template>
    </el-dialog>

    <!-- P2-3: 模板库对话框 -->
    <el-dialog v-model="templateDialogVisible" title="模板库" width="860px">
      <div v-loading="templatesLoading">
        <el-row :gutter="12">
          <el-col v-for="tpl in templates" :key="tpl.id" :xs="24" :sm="12" :md="8">
            <el-card class="template-card" shadow="hover">
              <div class="tpl-card-header">
                <span class="tpl-name" :title="tpl.name">{{ tpl.name }}</span>
                <el-tag v-if="tpl.category" size="small" effect="plain">{{ tpl.category }}</el-tag>
              </div>
              <p class="tpl-desc">{{ tpl.description || '暂无描述' }}</p>
              <div class="tpl-meta">
                <el-tag size="small" :type="tpl.isPublic ? 'success' : 'info'">
                  {{ tpl.isPublic ? '公开' : '私有' }}
                </el-tag>
                <span class="tpl-creator">
                  <el-icon><User /></el-icon>
                  {{ tpl.creator?.nickname || tpl.creator?.username || '-' }}
                </span>
              </div>
              <div class="tpl-actions">
                <el-button size="small" type="primary" @click="handleApplyTemplate(tpl)">
                  <el-icon><Plus /></el-icon>&nbsp;应用此模板
                </el-button>
                <el-button size="small" type="danger" plain @click="handleDeleteTemplate(tpl)">删除</el-button>
              </div>
            </el-card>
          </el-col>
          <el-col v-if="!templatesLoading && templates.length === 0" :span="24">
            <el-empty description="暂无模板" />
          </el-col>
        </el-row>
      </div>
      <template #footer>
        <el-button @click="templateDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- P2-3: 应用模板对话框 -->
    <el-dialog v-model="applyTplVisible" title="从模板创建看板" width="440px">
      <el-form :model="applyTplForm" label-width="80px">
        <el-form-item label="看板名称">
          <el-input v-model="applyTplForm.name" placeholder="请输入看板名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="applyTplForm.description" type="textarea" :rows="2" placeholder="可选" maxlength="200" />
        </el-form-item>
        <el-form-item label="是否公开">
          <el-switch v-model="applyTplForm.isPublic" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyTplVisible = false">取消</el-button>
        <el-button type="primary" :loading="applyingTpl" @click="confirmApplyTemplate">创建并编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, MoreFilled, Edit, View, Search, Refresh, CopyDocument,
  Delete, Promotion, Share, PieChart, User, Clock, Lock, Star, StarFilled,
  FolderOpened, Files, Folder, Rank,
} from '@element-plus/icons-vue'
import {
  getDashboardList, deleteDashboard, updateDashboard, createDashboard,
  copyDashboard, toggleFavorite, moveDashboardToGroup,
} from '@/api/dashboard'
import type { CreateDashboardParams, DashboardListQuery } from '@/api/dashboard'
import type { Dashboard, DashboardGroup, DashboardTemplate } from '@/api/types'
import { getShareConfig, createShare, revokeShare } from '@/api/share'
import type { ShareConfig } from '@/api/share'
import {
  getDashboardGroupList, createDashboardGroup, updateDashboardGroup, deleteDashboardGroup,
} from '@/api/dashboard-group'
import {
  getDashboardTemplateList, saveAsTemplate, applyTemplate, deleteDashboardTemplate,
} from '@/api/dashboard-template'

const router = useRouter()

const list = ref<Dashboard[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

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
  createForm.name = ''
  createForm.description = ''
  createForm.isPublic = false
  createForm.groupId = null
  createVisible.value = true
}

async function confirmCreate() {
  const name = createForm.name.trim()
  if (!name) {
    ElMessage.warning('看板名称不能为空')
    return
  }
  creating.value = true
  try {
    const res = await createDashboard({
      name,
      description: createForm.description?.trim() || undefined,
      isPublic: createForm.isPublic,
      groupId: createForm.groupId ?? undefined,
    })
    ElMessage.success('创建成功, 正在跳转编辑器...')
    createVisible.value = false
    router.push(`/bi-editor/${res.data.id}`)
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
    const data = { name, description: groupForm.description.trim() || undefined, sort: groupForm.sort }
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

// ========== P2-3: 模板库 ==========
const templates = ref<DashboardTemplate[]>([])
const templatesLoading = ref(false)
const templateDialogVisible = ref(false)
const applyTplVisible = ref(false)
const applyingTpl = ref(false)
const applyTplTarget = ref<DashboardTemplate | null>(null)
const applyTplForm = reactive({ name: '', description: '', isPublic: false })

async function openTemplateDialog() {
  templateDialogVisible.value = true
  templatesLoading.value = true
  try {
    const res = await getDashboardTemplateList()
    templates.value = res.data
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    templatesLoading.value = false
  }
}

function handleApplyTemplate(tpl: DashboardTemplate) {
  applyTplTarget.value = tpl
  applyTplForm.name = `${tpl.name}_看板`
  applyTplForm.description = tpl.description || ''
  applyTplForm.isPublic = false
  applyTplVisible.value = true
}

async function confirmApplyTemplate() {
  if (!applyTplTarget.value) return
  const name = applyTplForm.name.trim()
  if (!name) {
    ElMessage.warning('看板名称不能为空')
    return
  }
  applyingTpl.value = true
  try {
    const res = await applyTemplate(applyTplTarget.value.id, {
      name,
      description: applyTplForm.description.trim() || undefined,
      isPublic: applyTplForm.isPublic,
    })
    ElMessage.success('已从模板创建看板')
    applyTplVisible.value = false
    templateDialogVisible.value = false
    router.push(`/bi-editor/${res.data.id}`)
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    applyingTpl.value = false
  }
}

async function handleDeleteTemplate(tpl: DashboardTemplate) {
  try {
    await ElMessageBox.confirm(`确定删除模板「${tpl.name}」吗?`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteDashboardTemplate(tpl.id)
    ElMessage.success('删除成功')
    templates.value = templates.value.filter((t) => t.id !== tpl.id)
  } catch {
    // 用户取消或请求失败
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped lang="less">
.dashboard-list {
  padding: 16px;
}

.filter-card {
  margin-bottom: 16px;
  background: var(--bi-card-bg, #1f2937);
  border: 1px solid var(--bi-border-color, #374151);

  :deep(.el-card__body) {
    padding: 16px;
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

.card-grid {
  min-height: 200px;
}

.dashboard-card {
  margin-bottom: 16px;
  background: var(--bi-card-bg, #1f2937);
  border: 1px solid var(--bi-border-color, #374151);
  color: var(--bi-text-primary, #f3f4f6);

  :deep(.el-card__body) {
    padding: 16px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--bi-text-primary, #f3f4f6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.card-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.favorite-btn {
  cursor: pointer;
  color: var(--bi-text-secondary, #9ca3af);
  font-size: 18px;
  transition: color 0.2s, transform 0.2s;

  &:hover {
    color: #fbbf24;
    transform: scale(1.15);
  }

  &.active {
    color: #fbbf24;
  }
}

.more-btn {
  cursor: pointer;
  color: var(--bi-text-secondary, #9ca3af);
  font-size: 18px;
  flex-shrink: 0;

  &:hover {
    color: var(--bi-text-primary, #f3f4f6);
  }
}

.card-desc {
  font-size: 13px;
  color: var(--bi-text-secondary, #9ca3af);
  margin: 0 0 12px 0;
  min-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--bi-border-color, #374151);
  border-bottom: 1px solid var(--bi-border-color, #374151);

  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--bi-text-secondary, #9ca3af);
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

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
}

.share-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

:deep(.el-empty__description) {
  color: var(--bi-text-secondary, #9ca3af);
}

/* P2-3: 模板卡片样式 */
.template-card {
  margin-bottom: 12px;
  background: var(--bi-card-bg, #1f2937);
  border: 1px solid var(--bi-border-color, #374151);

  :deep(.el-card__body) {
    padding: 12px;
  }
}

.tpl-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.tpl-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--bi-text-primary, #f3f4f6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.tpl-desc {
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
  margin: 0 0 8px 0;
  min-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tpl-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tpl-creator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
}

.tpl-actions {
  display: flex;
  gap: 8px;

  .el-button {
    flex: 1;
  }
}
</style>
