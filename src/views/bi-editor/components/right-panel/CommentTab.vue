<template>
  <div class="comment-tab">
    <div v-if="!store.currentDashboardId" class="placeholder-text">
      看板尚未保存，保存后即可添加协作评论
    </div>

    <template v-else>
      <div class="comment-toolbar">
        <el-radio-group v-model="filterMode" size="small">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="component" :disabled="!store.selectedComponent">
            当前组件
          </el-radio-button>
        </el-radio-group>
        <el-tooltip content="刷新评论" placement="bottom">
          <el-button text size="small" :loading="loading" @click="loadComments">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
      </div>

      <div class="comment-compose">
        <div class="compose-target">
          <span class="target-label"><el-icon><ChatDotRound /></el-icon> 评论对象</span>
          <el-tag size="small" effect="plain">{{ targetLabel }}</el-tag>
          <el-checkbox v-if="store.selectedComponent" v-model="dashboardWide" size="small">
            针对整个看板
          </el-checkbox>
        </div>
        <el-input
          v-model="draft"
          type="textarea"
          :rows="3"
          maxlength="2000"
          show-word-limit
          placeholder="输入评论，Ctrl+Enter 发表"
          @keydown.ctrl.enter.prevent="submitComment"
        />
        <div class="compose-actions">
          <el-button
            type="primary"
            size="small"
            :loading="submitting"
            :disabled="!draft.trim()"
            @click="submitComment"
          >
            发表评论
          </el-button>
        </div>
      </div>

      <div class="comment-summary">
        <span>共 {{ total }} 条</span>
        <el-checkbox v-model="onlyUnresolved" size="small">仅看未解决</el-checkbox>
      </div>

      <div v-if="loading" class="placeholder-text">加载中...</div>
      <div v-else-if="visibleComments.length === 0" class="placeholder-text">暂无评论</div>

      <div v-else class="comment-list">
        <div
          v-for="c in visibleComments"
          :key="c.id"
          class="comment-item"
          :class="{ resolved: c.resolved }"
        >
          <div class="comment-head">
            <el-avatar :size="24" :src="c.creator?.avatar || undefined">
              {{ authorInitial(c) }}
            </el-avatar>
            <span class="author">{{ authorName(c) }}</span>
            <span class="time">{{ formatCommentTime(c.createdAt) }}</span>
          </div>

          <div v-if="editingId === c.id" class="comment-edit">
            <el-input
              v-model="editDraft"
              type="textarea"
              :rows="3"
              maxlength="2000"
              show-word-limit
            />
            <div class="edit-actions">
              <el-button size="small" @click="cancelEdit">取消</el-button>
              <el-button
                size="small"
                type="primary"
                :loading="savingEdit"
                :disabled="!editDraft.trim()"
                @click="saveEdit(c)"
              >
                保存
              </el-button>
            </div>
          </div>
          <p v-else class="comment-content">{{ c.content }}</p>

          <div class="comment-foot">
            <el-tag
              v-if="c.componentId && componentNames.get(c.componentId)"
              size="small"
              class="target-tag"
              @click="locateComponent(c.componentId)"
            >
              {{ componentNames.get(c.componentId) }}
            </el-tag>
            <el-tag v-if="c.componentId && !componentNames.get(c.componentId)" size="small" type="info">
              组件已删除
            </el-tag>
            <el-tag v-else-if="!c.componentId" size="small" type="success" effect="plain">
              看板整体
            </el-tag>
            <el-tag v-if="c.resolved" size="small" type="success">已解决</el-tag>

            <div class="comment-actions">
              <el-tooltip :content="c.resolved ? '重新打开' : '标记已解决'" placement="top">
                <el-button text size="small" @click="toggleResolved(c)">
                  <el-icon><Check /></el-icon>
                </el-button>
              </el-tooltip>
              <template v-if="isMine(c)">
                <el-tooltip content="编辑评论" placement="top">
                  <el-button text size="small" @click="startEdit(c)">
                    <el-icon><EditPen /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除评论" placement="top">
                  <el-button text size="small" @click="removeComment(c)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-tooltip>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChatDotRound, Check, Delete, EditPen, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBiEditorStore } from '@/stores/bi-editor'
import { useUserStore } from '@/stores/user'
import {
  getDashboardComments,
  createDashboardComment,
  updateDashboardComment,
  deleteDashboardComment,
  type DashboardComment,
} from '@/api/dashboard-comment'

const store = useBiEditorStore()
const userStore = useUserStore()

/** 列表筛选: 全部 / 仅当前选中组件 */
const filterMode = ref<'all' | 'component'>('all')
const onlyUnresolved = ref(false)
/** 新评论是否针对整个看板 (默认跟随选中组件) */
const dashboardWide = ref(false)
const draft = ref('')
const comments = ref<DashboardComment[]>([])
const total = ref(0)
const loading = ref(false)
const submitting = ref(false)

/** 编辑态 */
const editingId = ref<number | null>(null)
const editDraft = ref('')
const savingEdit = ref(false)

let loadSeq = 0

/** 组件 ID → 组件名称 (用于评论定位标签) */
const componentNames = computed(() => {
  const map = new Map<string, string>()
  for (const c of store.components) map.set(c.id, c.name)
  return map
})

/** 新评论目标提示 */
const targetLabel = computed(() => {
  if (dashboardWide.value || !store.selectedComponent) return '整个看板'
  return store.selectedComponent.name
})

/** 评论目标组件 ID (未选中或勾选整体时为 null) */
function resolveTargetComponentId(): string | null {
  if (dashboardWide.value || !store.selectedId) return null
  return store.selectedId
}

const visibleComments = computed(() => {
  let list = comments.value
  if (onlyUnresolved.value) list = list.filter((c) => !c.resolved)
  if (filterMode.value === 'component' && store.selectedId) {
    list = list.filter((c) => c.componentId === store.selectedId)
  }
  return list
})

async function loadComments() {
  const dashboardId = store.currentDashboardId
  if (!dashboardId) {
    comments.value = []
    total.value = 0
    return
  }
  const seq = ++loadSeq
  loading.value = true
  try {
    const res = await getDashboardComments(dashboardId, { page: 1, pageSize: 100 })
    if (seq !== loadSeq) return
    comments.value = res.data.list
    total.value = res.data.total
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

async function submitComment() {
  const dashboardId = store.currentDashboardId
  const content = draft.value.trim()
  if (!dashboardId || !content || submitting.value) return
  submitting.value = true
  try {
    const res = await createDashboardComment(dashboardId, {
      content,
      componentId: resolveTargetComponentId(),
    })
    comments.value = [res.data, ...comments.value]
    total.value += 1
    draft.value = ''
    ElMessage.success('评论已发表')
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  } finally {
    submitting.value = false
  }
}

function startEdit(comment: DashboardComment) {
  editingId.value = comment.id
  editDraft.value = comment.content
}

function cancelEdit() {
  editingId.value = null
  editDraft.value = ''
}

async function saveEdit(comment: DashboardComment) {
  const dashboardId = store.currentDashboardId
  const content = editDraft.value.trim()
  if (!dashboardId || !content || savingEdit.value) return
  savingEdit.value = true
  try {
    const res = await updateDashboardComment(dashboardId, comment.id, { content })
    comment.content = res.data.content
    cancelEdit()
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  } finally {
    savingEdit.value = false
  }
}

async function toggleResolved(comment: DashboardComment) {
  const dashboardId = store.currentDashboardId
  if (!dashboardId) return
  try {
    const res = await updateDashboardComment(dashboardId, comment.id, {
      resolved: !comment.resolved,
    })
    comment.resolved = res.data.resolved
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}

async function removeComment(comment: DashboardComment) {
  const dashboardId = store.currentDashboardId
  if (!dashboardId) return
  try {
    await ElMessageBox.confirm('确定删除该评论？', '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await deleteDashboardComment(dashboardId, comment.id)
    comments.value = comments.value.filter((c) => c.id !== comment.id)
    total.value = Math.max(0, total.value - 1)
    if (editingId.value === comment.id) cancelEdit()
    ElMessage.success('已删除')
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}

/** 点击评论上的组件标签 → 选中画布组件, 实现按组件定位 */
function locateComponent(componentId: string | null) {
  if (!componentId || !store.getComponent(componentId)) return
  dashboardWide.value = false
  store.selectComponent(componentId)
}

function authorName(comment: DashboardComment): string {
  const creator = comment.creator
  return creator?.nickname || creator?.username || '已注销用户'
}

function authorInitial(comment: DashboardComment): string {
  return authorName(comment).slice(0, 1).toUpperCase()
}

function isMine(comment: DashboardComment): boolean {
  return userStore.userInfo?.id === comment.creatorId
}

/** 评论时间: 1 分钟内"刚刚", 当天显示相对时间, 更早显示日期 */
function formatCommentTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const diff = Date.now() - date.getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  const pad = (n: number) => String(n).padStart(2, '0')
  const now = new Date()
  const sameYear = date.getFullYear() === now.getFullYear()
  const md = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const hm = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  return sameYear ? `${md} ${hm}` : `${date.getFullYear()}-${md} ${hm}`
}

/** 选中组件被清除时, 筛选与评论目标回退到全部/整体 */
watch(
  () => store.selectedId,
  (id) => {
    if (!id) {
      if (filterMode.value === 'component') filterMode.value = 'all'
      dashboardWide.value = false
    }
  },
)

/** 切换看板(含新建保存后获得 ID)时重新加载评论 */
watch(
  () => store.currentDashboardId,
  () => {
    cancelEdit()
    draft.value = ''
    dashboardWide.value = false
    filterMode.value = 'all'
    void loadComments()
  },
  { immediate: true },
)
</script>

<style scoped lang="less">
@import './shared.less';

.comment-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  box-sizing: border-box;
}

.comment-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.comment-compose {
  padding: 10px;
  border: 1px solid var(--bi-border-color, #374151);
  border-radius: 6px;
  background: var(--bi-panel-header-bg, #111827);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compose-target {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
}

.target-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.compose-actions {
  display: flex;
  justify-content: flex-end;
}

.comment-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--bi-text-muted, #6b7280);
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-item {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--bi-border-color, #374151);
  background: var(--bi-input-bg, #374151);
  transition: opacity 0.2s ease;
}

.comment-item.resolved {
  opacity: 0.72;
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.author {
  font-size: 12px;
  font-weight: 600;
  color: var(--bi-text-primary, #f3f4f6);
}

.time {
  font-size: 11px;
  color: var(--bi-text-muted, #6b7280);
  margin-left: auto;
}

.comment-content {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--bi-text-primary, #f3f4f6);
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.comment-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.target-tag {
  cursor: pointer;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

:deep(.el-textarea__inner) {
  background: var(--bi-input-bg, #374151);
  color: var(--bi-text-primary, #f3f4f6);
  box-shadow: none;
}

:deep(.el-checkbox__label) {
  color: var(--bi-text-secondary, #9ca3af);
  font-size: 12px;
}

:deep(.placeholder-text) {
  padding: 24px 12px;
}
</style>
