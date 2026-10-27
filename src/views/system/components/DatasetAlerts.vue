<template>
  <el-dialog
    v-model="visible"
    :title="dataset ? `告警订阅 - ${dataset.name}` : '告警订阅'"
    width="940px"
    destroy-on-close
    @closed="handleClosed"
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane label="告警规则" name="rules">
        <div class="alert-toolbar">
          <el-button type="primary" size="small" @click="openCreate">
            <el-icon><Plus /></el-icon>&nbsp;新增规则
          </el-button>
          <el-button size="small" :loading="loadingRules" @click="loadRules">刷新</el-button>
          <span class="alert-hint">
            按 cron 定时评估数据集指标，超过阈值时生成告警记录（可选 Webhook 回调）
          </span>
        </div>

        <el-table v-loading="loadingRules" :data="rules" size="small" border>
          <el-table-column prop="name" label="规则名称" min-width="150" show-overflow-tooltip />
          <el-table-column label="触发条件" min-width="210">
            <template #default="{ row }">
              <span class="cond-text">{{ conditionLabel(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="执行周期" width="140">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ row.cron }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="最近评估" width="180">
            <template #default="{ row }">
              <div v-if="row.lastRunAt" class="last-run">
                <span>{{ formatTime(row.lastRunAt) }}</span>
                <span class="last-value">结果: {{ row.lastValue ?? '-' }}</span>
              </div>
              <span v-else class="muted">尚未评估</span>
            </template>
          </el-table-column>
          <el-table-column label="启用" width="70" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" size="small" @change="toggleEnabled(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="190" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="runRule(row)">立即执行</el-button>
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-popconfirm title="确定删除该规则吗?" confirm-button-type="danger" @confirm="removeRule(row)">
                <template #reference>
                  <el-button link type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
        <el-empty
          v-if="!loadingRules && rules.length === 0"
          description="暂无告警规则，点击「新增规则」开始配置"
          :image-size="60"
        />
      </el-tab-pane>

      <el-tab-pane name="events">
        <template #label>
          告警记录
          <el-badge v-if="unreadCount > 0" :value="unreadCount" class="event-badge" />
        </template>
        <div class="alert-toolbar">
          <el-button size="small" :loading="loadingEvents" @click="loadEvents">刷新</el-button>
          <el-button size="small" :disabled="unreadCount === 0" @click="readAll">全部标记已读</el-button>
          <span class="alert-hint">告警记录仅保留内容快照，删除规则不会删除历史记录</span>
        </div>

        <el-table v-loading="loadingEvents" :data="events" size="small" border>
          <el-table-column prop="ruleName" label="规则" width="150" show-overflow-tooltip />
          <el-table-column prop="message" label="告警内容" min-width="340" show-overflow-tooltip />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 0 ? 'danger' : 'info'" size="small" effect="plain">
                {{ row.status === 0 ? '未读' : '已读' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="170">
            <template #default="{ row }">
              <span>{{ formatTime(row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template #default="{ row }">
              <el-button v-if="row.status === 0" link type="primary" size="small" @click="readEvent(row)">
                标记已读
              </el-button>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
        </el-table>
        <el-empty
          v-if="!loadingEvents && events.length === 0"
          description="暂无告警记录"
          :image-size="60"
        />
        <div v-if="eventTotal > 0" class="alert-pager">
          <el-pagination
            v-model:current-page="eventPage"
            :page-size="eventPageSize"
            :total="eventTotal"
            layout="total, prev, pager, next"
            small
            @current-change="loadEvents"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增/编辑规则 -->
    <el-dialog
      v-model="formVisible"
      :title="editingId ? '编辑告警规则' : '新增告警规则'"
      width="640px"
      append-to-body
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="96px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" maxlength="100" placeholder="如: 日订单量低于 100 告警" />
        </el-form-item>
        <el-form-item label="统计方式" prop="aggregate">
          <el-select v-model="form.aggregate" style="width: 160px">
            <el-option v-for="opt in aggregateOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-select
            v-if="form.aggregate !== 'count'"
            v-model="form.field"
            filterable
            allow-create
            default-first-option
            placeholder="选择字段"
            style="width: 220px; margin-left: 10px"
          >
            <el-option v-for="f in fieldOptions" :key="f" :label="f" :value="f" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值" prop="threshold">
          <el-select v-model="form.operator" style="width: 100px">
            <el-option v-for="opt in operatorOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-input-number v-model="form.threshold" :precision="2" :step="1" style="width: 180px; margin-left: 10px" />
        </el-form-item>
        <el-form-item label="执行周期" prop="cron">
          <el-select v-model="form.cron" filterable allow-create default-first-option style="width: 100%">
            <el-option v-for="opt in cronOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Webhook">
          <el-input v-model="form.webhookUrl" maxlength="500" placeholder="可选，触发后 POST JSON 到该地址" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  runAlertRule,
  getAlertEvents,
  markAlertEventRead,
  markAllAlertEventsRead,
  type AlertRule,
  type AlertEvent,
  type AlertAggregate,
  type AlertOperator,
} from '@/api/alert'
import { getDatasetDetail, executeDataset } from '@/api/dataset'

const props = defineProps<{
  modelValue: boolean
  dataset: { id: number; name: string } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeTab = ref<'rules' | 'events'>('rules')
const rules = ref<AlertRule[]>([])
const events = ref<AlertEvent[]>([])
const loadingRules = ref(false)
const loadingEvents = ref(false)
const saving = ref(false)
const unreadCount = ref(0)
const eventPage = ref(1)
const eventPageSize = 10
const eventTotal = ref(0)
const fieldOptions = ref<string[]>([])

const aggregateOptions: { label: string; value: AlertAggregate }[] = [
  { label: '行数 (count)', value: 'count' },
  { label: '求和 (sum)', value: 'sum' },
  { label: '平均值 (avg)', value: 'avg' },
  { label: '最大值 (max)', value: 'max' },
  { label: '最小值 (min)', value: 'min' },
]

const operatorOptions: { label: string; value: AlertOperator }[] = [
  { label: '大于 >', value: 'gt' },
  { label: '大于等于 >=', value: 'gte' },
  { label: '小于 <', value: 'lt' },
  { label: '小于等于 <=', value: 'lte' },
  { label: '等于 =', value: 'eq' },
  { label: '不等于 !=', value: 'ne' },
]

const cronOptions = [
  { label: '每 5 分钟', value: '*/5 * * * *' },
  { label: '每小时整点', value: '0 * * * *' },
  { label: '每天 09:00', value: '0 9 * * *' },
  { label: '每周一 09:00', value: '0 9 * * 1' },
]

const aggregateLabel: Record<string, string> = {
  count: '行数',
  sum: '求和',
  avg: '平均值',
  max: '最大值',
  min: '最小值',
}

const operatorLabel: Record<string, string> = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  eq: '=',
  ne: '!=',
}

// ---------- 表单 ----------
const formRef = ref<FormInstance>()
const formVisible = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  name: '',
  field: '',
  aggregate: 'count' as AlertAggregate,
  operator: 'gt' as AlertOperator,
  threshold: 0,
  cron: '0 * * * *',
  webhookUrl: '',
  enabled: true,
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  aggregate: [{ required: true, message: '请选择统计方式', trigger: 'change' }],
  threshold: [{ required: true, message: '请输入阈值', trigger: 'blur' }],
  cron: [{ required: true, message: '请选择或输入 cron 表达式', trigger: 'change' }],
}

watch(
  () => props.modelValue,
  (value) => {
    if (!value) return
    activeTab.value = 'rules'
    loadFields()
    loadRules()
    loadUnreadCount()
  },
)

function handleClosed() {
  rules.value = []
  events.value = []
  unreadCount.value = 0
  formVisible.value = false
  editingId.value = null
}

function conditionLabel(row: AlertRule): string {
  const field = row.field ? `(${row.field})` : ''
  return `${aggregateLabel[row.aggregate] ?? row.aggregate}${field} ${operatorLabel[row.operator] ?? row.operator} ${row.threshold}`
}

function formatTime(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

// ---------- 数据加载 ----------
async function loadFields() {
  if (!props.dataset) return
  const names = new Set<string>()
  try {
    const detail = await getDatasetDetail(props.dataset.id)
    const fields = detail.data.fields
    if (Array.isArray(fields)) {
      for (const item of fields as Record<string, unknown>[]) {
        const name = (item.alias as string) || (item.name as string)
        if (name) names.add(name)
      }
    }
  } catch {
    // 字段获取失败不阻断规则管理
  }
  try {
    const res = await executeDataset(props.dataset.id, { limit: 1 })
    for (const column of res.data.columns ?? []) names.add(column)
  } catch {
    // 数据集暂时不可查询时允许手动输入字段
  }
  fieldOptions.value = Array.from(names)
}

async function loadRules() {
  if (!props.dataset) return
  loadingRules.value = true
  try {
    const res = await getAlertRules(props.dataset.id)
    rules.value = res.data
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载告警规则失败')
  } finally {
    loadingRules.value = false
  }
}

async function loadEvents() {
  if (!props.dataset) return
  loadingEvents.value = true
  try {
    const res = await getAlertEvents({
      datasetId: props.dataset.id,
      page: eventPage.value,
      pageSize: eventPageSize,
    })
    events.value = res.data.list
    eventTotal.value = res.data.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载告警记录失败')
  } finally {
    loadingEvents.value = false
  }
}

async function loadUnreadCount() {
  if (!props.dataset) return
  try {
    const res = await getAlertEvents({
      datasetId: props.dataset.id,
      status: 0,
      page: 1,
      pageSize: 1,
    })
    unreadCount.value = res.data.total
  } catch {
    unreadCount.value = 0
  }
}

watch(activeTab, (tab) => {
  if (tab === 'events') loadEvents()
})

// ---------- 规则操作 ----------
function resetForm() {
  form.name = ''
  form.field = ''
  form.aggregate = 'count'
  form.operator = 'gt'
  form.threshold = 0
  form.cron = '0 * * * *'
  form.webhookUrl = ''
  form.enabled = true
}

function openCreate() {
  editingId.value = null
  resetForm()
  formVisible.value = true
}

function openEdit(row: AlertRule) {
  editingId.value = row.id
  form.name = row.name
  form.field = row.field ?? ''
  form.aggregate = row.aggregate
  form.operator = row.operator
  form.threshold = row.threshold
  form.cron = row.cron
  form.webhookUrl = row.webhookUrl ?? ''
  form.enabled = row.enabled
  formVisible.value = true
}

async function saveForm() {
  if (!formRef.value || !props.dataset) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (form.aggregate !== 'count' && !form.field) {
    ElMessage.warning('非 count 聚合必须选择字段')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      field: form.field || null,
      aggregate: form.aggregate,
      operator: form.operator,
      threshold: form.threshold,
      cron: form.cron,
      webhookUrl: form.webhookUrl.trim() || null,
      enabled: form.enabled,
    }
    if (editingId.value) {
      await updateAlertRule(editingId.value, payload)
      ElMessage.success('规则已更新')
    } else {
      await createAlertRule({ ...payload, datasetId: props.dataset.id })
      ElMessage.success('规则已创建')
    }
    formVisible.value = false
    await loadRules()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(row: AlertRule) {
  try {
    await updateAlertRule(row.id, { enabled: row.enabled })
    ElMessage.success(row.enabled ? '规则已启用' : '规则已停用')
  } catch (e) {
    row.enabled = !row.enabled
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  }
}

async function removeRule(row: AlertRule) {
  try {
    await deleteAlertRule(row.id)
    ElMessage.success('规则已删除')
    await loadRules()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '删除失败')
  }
}

async function runRule(row: AlertRule) {
  try {
    const res = await runAlertRule(row.id)
    const result = res.data
    if (result.triggered) {
      ElMessage.warning(`已触发告警，当前值 ${result.value}`)
      await loadUnreadCount()
    } else {
      ElMessage.success(`未触发，当前值 ${result.value}`)
    }
    await loadRules()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '执行失败')
  }
}

// ---------- 事件操作 ----------
async function readEvent(row: AlertEvent) {
  try {
    await markAlertEventRead(row.id)
    row.status = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  }
}

async function readAll() {
  if (!props.dataset) return
  try {
    await markAllAlertEventsRead(props.dataset.id)
    ElMessage.success('已全部标记为已读')
    unreadCount.value = 0
    await loadEvents()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  }
}
</script>

<style scoped lang="less">
.alert-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.alert-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.cond-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.last-run {
  display: flex;
  flex-direction: column;
  line-height: 16px;
  font-size: 12px;
}

.last-value {
  color: var(--el-text-color-secondary);
}

.muted {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.alert-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.event-badge {
  margin-left: 4px;
  transform: translateY(-8px);
}
</style>
