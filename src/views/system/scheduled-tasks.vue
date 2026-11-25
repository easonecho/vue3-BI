<template>
  <div class="task-page">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          :placeholder="t('scheduledTaskPage.searchPlaceholder')"
          clearable
          style="width: 240px"
          @keyup.enter="loadList"
          @clear="loadList"
        />
        <el-select
          v-model="filters.status"
          :placeholder="t('scheduledTaskPage.status')"
          clearable
          style="width: 120px"
          @change="loadList"
        >
          <el-option :label="t('scheduledTaskPage.running')" :value="1" />
          <el-option :label="t('scheduledTaskPage.paused')" :value="0" />
        </el-select>
        <el-button type="primary" @click="loadList"
          ><el-icon><Search /></el-icon>&nbsp;{{ t('scheduledTaskPage.query') }}</el-button
        >
        <div class="spacer" />
        <el-button v-permission="'system:task:add'" type="success" @click="openCreate">
          <el-icon><Plus /></el-icon>&nbsp;{{ t('scheduledTaskPage.create') }}
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" :label="t('scheduledTaskPage.name')" min-width="160" />
        <el-table-column :label="t('scheduledTaskPage.cron')" width="160">
          <template #default="{ row }"
            ><code class="cron-code">{{ row.cron }}</code></template
          >
        </el-table-column>
        <el-table-column
          prop="handler"
          :label="t('scheduledTaskPage.handler')"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column :label="t('scheduledTaskPage.status')" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              :active-text="t('scheduledTaskPage.runText')"
              :inactive-text="t('scheduledTaskPage.paused')"
              inline-prompt
              @change="handleToggle(row)"
            />
          </template>
        </el-table-column>
        <el-table-column :label="t('scheduledTaskPage.lastRun')" width="170">
          <template #default="{ row }">
            <span v-if="row.lastRunAt">{{ formatTime(row.lastRunAt) }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('scheduledTaskPage.lastResult')"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="row.lastResult" class="result-text">{{ row.lastResult }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'system:task:run'"
              link
              type="success"
              size="small"
              @click="handleRun(row)"
            >
              {{ t('scheduledTaskPage.run') }}
            </el-button>
            <el-button
              v-permission="'system:task:edit'"
              link
              type="primary"
              size="small"
              @click="openEdit(row)"
            >
              {{ t('common.edit') }}
            </el-button>
            <el-popconfirm
              :title="t('scheduledTaskPage.deleteConfirm')"
              confirm-button-type="danger"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button v-permission="'system:task:remove'" link type="danger" size="small">{{
                  t('common.delete')
                }}</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="cron-tips">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            {{ t('scheduledTaskPage.cronTips') }}
            <code>0 2 * * *</code> = {{ t('scheduledTaskPage.cronExampleDaily') }};
            <code>*/5 * * * *</code> = {{ t('scheduledTaskPage.cronExampleEvery5') }}。
          </template>
        </el-alert>
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="
        mode === 'create' ? t('scheduledTaskPage.createTitle') : t('scheduledTaskPage.editTitle')
      "
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item :label="t('scheduledTaskPage.name')" prop="name">
          <el-input
            v-model="form.name"
            maxlength="100"
            show-word-limit
            :placeholder="t('scheduledTaskPage.namePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('scheduledTaskPage.cron')" prop="cron">
          <el-input
            v-model="form.cron"
            maxlength="50"
            :placeholder="t('scheduledTaskPage.cronPlaceholder')"
          >
            <template #append>
              <el-tooltip :content="t('scheduledTaskPage.cronTooltip')">
                <el-button
                  ><el-icon><QuestionFilled /></el-icon
                ></el-button>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item :label="t('scheduledTaskPage.handlerPath')" prop="handler">
          <el-input
            v-model="form.handler"
            maxlength="200"
            :placeholder="t('scheduledTaskPage.handlerPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('scheduledTaskPage.paramsLabel')">
          <el-input v-model="paramsText" type="textarea" :rows="3" placeholder='{"days": 30}' />
          <span v-if="paramsError" class="error-text">{{ paramsError }}</span>
        </el-form-item>
        <el-form-item :label="t('scheduledTaskPage.status')">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">{{ t('scheduledTaskPage.running') }}</el-radio>
            <el-radio :value="0">{{ t('scheduledTaskPage.paused') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('scheduledTaskPage.description')">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">{{
          t('common.confirm')
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus, QuestionFilled } from '@element-plus/icons-vue'
import {
  getScheduledTaskList,
  createScheduledTask,
  updateScheduledTask,
  deleteScheduledTask,
  toggleScheduledTaskStatus,
  runScheduledTask,
  type ScheduledTask,
  type ScheduledTaskForm,
} from '@/api/scheduled-task'
import { formatDateTime } from '@/utils/locale-format'

const { t } = useI18n()

const loading = ref(false)
const list = ref<ScheduledTask[]>([])
const filters = reactive<{ keyword: string; status: number | undefined }>({
  keyword: '',
  status: undefined,
})

async function loadList() {
  loading.value = true
  try {
    const res = await getScheduledTaskList({
      keyword: filters.keyword || undefined,
      status: filters.status,
    })
    list.value = res.data
  } catch {
    /* noop */
  } finally {
    loading.value = false
  }
}

function formatTime(t: string) {
  return formatDateTime(t)
}

const dialogVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<ScheduledTaskForm & { id?: number; status: number }>({
  name: '',
  cron: '',
  handler: '',
  params: {},
  status: 1,
  description: '',
})
const paramsText = ref('{}')
const paramsError = ref('')

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('scheduledTaskPage.nameRequired'), trigger: 'blur' }],
  cron: [{ required: true, message: t('scheduledTaskPage.cronRequired'), trigger: 'blur' }],
  handler: [{ required: true, message: t('scheduledTaskPage.handlerRequired'), trigger: 'blur' }],
}))

watch(paramsText, (val) => {
  if (!val || val.trim() === '') {
    paramsError.value = ''
    form.params = {}
    return
  }
  try {
    form.params = JSON.parse(val)
    paramsError.value = ''
  } catch {
    paramsError.value = t('scheduledTaskPage.jsonInvalid')
  }
})

function openCreate() {
  mode.value = 'create'
  Object.assign(form, {
    id: undefined,
    name: '',
    cron: '',
    handler: '',
    params: {},
    status: 1,
    description: '',
  })
  paramsText.value = '{}'
  dialogVisible.value = true
}

function openEdit(row: ScheduledTask) {
  mode.value = 'edit'
  Object.assign(form, { ...row })
  paramsText.value = row.params ? JSON.stringify(row.params, null, 2) : '{}'
  dialogVisible.value = true
}

async function submit() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  if (paramsError.value) {
    ElMessage.warning(t('scheduledTaskPage.fixJson'))
    return
  }
  submitting.value = true
  try {
    if (mode.value === 'create') {
      await createScheduledTask({
        name: form.name,
        cron: form.cron,
        handler: form.handler,
        params: form.params,
        status: form.status,
        description: form.description,
      })
      ElMessage.success(t('scheduledTaskPage.created'))
    } else if (form.id) {
      await updateScheduledTask(form.id, {
        name: form.name,
        cron: form.cron,
        handler: form.handler,
        params: form.params,
        status: form.status,
        description: form.description,
      })
      ElMessage.success(t('scheduledTaskPage.saved'))
    }
    dialogVisible.value = false
    loadList()
  } catch {
    /* noop */
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: ScheduledTask) {
  try {
    await deleteScheduledTask(row.id)
    ElMessage.success(t('scheduledTaskPage.deleted'))
    loadList()
  } catch {
    /* noop */
  }
}

async function handleToggle(row: ScheduledTask) {
  try {
    await toggleScheduledTaskStatus(row.id)
    ElMessage.success(t('scheduledTaskPage.statusToggled'))
    loadList()
  } catch {
    /* noop */
  }
}

async function handleRun(row: ScheduledTask) {
  try {
    await ElMessageBox.confirm(
      t('scheduledTaskPage.runConfirm', { name: row.name }),
      t('scheduledTaskPage.runTitle'),
      {
        type: 'warning',
      },
    )
  } catch {
    return
  }
  try {
    const res = await runScheduledTask(row.id)
    ElMessage.success(res.data.result)
    loadList()
  } catch {
    /* noop */
  }
}

onMounted(loadList)
</script>

<style scoped lang="less">
.task-page {
  width: 100%;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  .spacer {
    flex: 1;
    min-width: 4px;
  }
}
.cron-code {
  font-family: 'Consolas', 'Monaco', monospace;
  color: #2563eb;
  font-size: 13px;
}
.muted {
  color: #9ca3af;
}
.result-text {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #4b5563;
}
.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  display: inline-block;
}
.cron-tips {
  margin-top: 16px;
}
</style>
