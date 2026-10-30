<template>
  <el-dialog v-model="visible" :title="t('dashboard.createTitle')" width="760px" @open="onOpen">
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
                    <div
                      v-if="selectedKind === 'user' && selectedUserTplId === tpl.id"
                      class="selected-badge"
                    >
                      <el-icon><CircleCheckFilled /></el-icon>
                    </div>
                  </div>
                  <!-- 信息区 -->
                  <div class="tpl-picker-info">
                    <div class="tpl-picker-name" :title="tpl.name">{{ tpl.name }}</div>
                    <p class="tpl-picker-desc" :title="tpl.description || ''">
                      {{ tpl.description || t('dashboard.noDesc') }}
                    </p>
                    <div class="tpl-picker-tags">
                      <el-tag v-if="tpl.category" size="small" effect="plain" type="primary">{{
                        tpl.category
                      }}</el-tag>
                      <el-tag v-if="tpl.isSystem" size="small" type="warning" effect="dark"
                        >预置</el-tag
                      >
                      <el-tag
                        v-else
                        size="small"
                        :type="tpl.isPublic ? 'success' : 'info'"
                        effect="plain"
                        >{{ tpl.isPublic ? t('dashboard.public') : t('dashboard.private') }}</el-tag
                      >
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
      <el-button v-if="createStep === 2" @click="createStep = 1">{{ t('common.back') }}</el-button>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button v-if="createStep === 1" type="primary" @click="goToCreateStep2">{{
        t('common.next')
      }}</el-button>
      <el-button v-if="createStep === 2" type="primary" :loading="creating" @click="confirmCreate">{{
        t('dashboard.createAndEdit')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { DataAnalysis, ZoomIn, CircleCheckFilled } from '@element-plus/icons-vue'
import { createDashboard, moveDashboardToGroup } from '@/api/dashboard'
import type { CreateDashboardParams } from '@/api/dashboard'
import { getDashboardTemplateList, applyTemplate } from '@/api/dashboard-template'
import type { DashboardGroup, DashboardTemplate } from '@/api/types'

const props = defineProps<{
  modelValue: boolean
  groups: DashboardGroup[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

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

/** 打开对话框时重置表单并加载用户模板 */
function onOpen() {
  createStep.value = 1
  templateTab.value = 'user'
  selectedKind.value = 'user'
  selectedUserTplId.value = null
  createForm.name = ''
  createForm.description = ''
  createForm.isPublic = false
  createForm.groupId = null
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
      visible.value = false
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
      visible.value = false
      router.push(`/bi-editor/${res.data.id}`)
    }
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    creating.value = false
  }
}
</script>

<style scoped lang="less">
.form-hint {
  margin-left: 8px;
  font-size: 12px;
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
</style>
