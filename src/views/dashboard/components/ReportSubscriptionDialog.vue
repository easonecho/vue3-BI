<template>
  <el-dialog
    v-model="visible"
    :title="dashboard ? `定时报表 - ${dashboard.name}` : '定时报表'"
    width="1040px"
    destroy-on-close
    @closed="handleClosed"
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane label="订阅配置" name="subs">
        <div class="report-toolbar">
          <el-button type="primary" size="small" @click="openCreate">
            <el-icon><Plus /></el-icon>&nbsp;新增订阅
          </el-button>
          <el-button size="small" :loading="loadingSubs" @click="loadSubscriptions">刷新</el-button>
          <span class="report-hint">
            按 cron 定时生成看板数据快照并落库，可在「投递记录」查看；Webhook 渠道额外推送摘要
          </span>
        </div>

        <el-table v-loading="loadingSubs" :data="subscriptions" size="small" border>
          <el-table-column prop="name" label="订阅名称" min-width="150" show-overflow-tooltip />
          <el-table-column label="执行周期" width="130">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ row.cron }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="渠道" width="110" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.channel === 'webhook' ? 'warning' : 'primary'">
                {{ row.channel === 'webhook' ? 'Webhook' : '站内' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="收件人" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.recipients || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="最近生成" width="200">
            <template #default="{ row }">
              <div v-if="row.lastRunAt" class="last-run">
                <span>{{ formatTime(row.lastRunAt) }}</span>
                <span :class="['last-status', row.lastStatus === 'failed' ? 'is-failed' : '']">
                  {{ row.lastStatus === 'failed' ? '失败' : '成功' }}
                </span>
              </div>
              <span v-else class="muted">尚未生成</span>
            </template>
          </el-table-column>
          <el-table-column label="启用" width="70" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" size="small" @change="toggleEnabled(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="210" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="runNow(row)">立即生成</el-button>
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-popconfirm
                title="确定删除该订阅吗?"
                confirm-button-type="danger"
                @confirm="removeSubscription(row)"
              >
                <template #reference>
                  <el-button link type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
        <el-empty
          v-if="!loadingSubs && subscriptions.length === 0"
          description="暂无订阅，点击「新增订阅」开始配置"
          :image-size="60"
        />
      </el-tab-pane>

      <el-tab-pane name="deliveries">
        <template #label>
          投递记录
          <el-badge v-if="unreadCount > 0" :value="unreadCount" class="delivery-badge" />
        </template>
        <div class="report-toolbar">
          <el-button size="small" :loading="loadingDeliveries" @click="loadDeliveries"
            >刷新</el-button
          >
          <span class="report-hint">每次定时生成的数据快照，点击「查看」预览图表数据</span>
        </div>

        <el-table v-loading="loadingDeliveries" :data="deliveries" size="small" border>
          <el-table-column prop="title" label="报表标题" min-width="260" show-overflow-tooltip />
          <el-table-column label="渠道" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.channel === 'webhook' ? 'warning' : 'primary'">
                {{ row.channel === 'webhook' ? 'Webhook' : '站内' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.status === 'failed' ? 'danger' : 'success'">
                {{ row.status === 'failed' ? '失败' : '成功' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="接收" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.readFlag === 0 ? 'danger' : 'info'" effect="plain">
                {{ row.readFlag === 0 ? '未读' : '已读' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="生成时间" width="170">
            <template #default="{ row }">
              <span>{{ formatTime(row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="110" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="previewDelivery(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty
          v-if="!loadingDeliveries && deliveries.length === 0"
          description="暂无投递记录"
          :image-size="60"
        />
        <div v-if="deliveryTotal > deliveryPageSize" class="report-pager">
          <el-pagination
            v-model:current-page="deliveryPage"
            :page-size="deliveryPageSize"
            :total="deliveryTotal"
            layout="total, prev, pager, next"
            small
            @current-change="loadDeliveries"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增/编辑订阅 -->
    <el-dialog
      v-model="formVisible"
      :title="editingId ? '编辑报表订阅' : '新增报表订阅'"
      width="640px"
      append-to-body
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="96px">
        <el-form-item label="订阅名称" prop="name">
          <el-input v-model="form.name" maxlength="100" placeholder="如: 每日销售看板" />
        </el-form-item>
        <el-form-item label="执行周期" prop="cron">
          <el-select
            v-model="form.cron"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option v-for="opt in cronOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="投递渠道" prop="channel">
          <el-radio-group v-model="form.channel">
            <el-radio label="inbox">站内投递</el-radio>
            <el-radio label="webhook">Webhook 推送</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="收件人">
          <el-input
            v-model="form.recipients"
            maxlength="500"
            placeholder="可选，多个收件人以逗号分隔（记录在投递记录中）"
          />
        </el-form-item>
        <el-form-item v-if="form.channel === 'webhook'" label="回调地址" prop="webhookUrl">
          <el-input v-model="form.webhookUrl" maxlength="500" placeholder="https://example.com/hook" />
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

    <!-- 报表快照预览 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewTitle"
      width="900px"
      append-to-body
      destroy-on-close
    >
      <template v-if="snapshot">
        <el-descriptions :column="3" size="small" border class="snapshot-meta">
          <el-descriptions-item label="看板">{{ snapshot.dashboard.name }}</el-descriptions-item>
          <el-descriptions-item label="图表数">{{ snapshot.dashboard.chartCount }}</el-descriptions-item>
          <el-descriptions-item label="生成时间">{{
            formatTime(snapshot.generatedAt)
          }}</el-descriptions-item>
        </el-descriptions>

        <div v-for="chart in snapshot.charts" :key="chart.id" class="snapshot-chart">
          <div class="snapshot-chart__head">
            <span class="snapshot-chart__name">{{ chart.name }}</span>
            <el-tag size="small" effect="plain">{{ chart.type }}</el-tag>
            <el-tag size="small" type="info" effect="plain">{{ chart.datasetName || '-' }}</el-tag>
            <el-tag v-if="chart.truncated" size="small" type="warning">仅展示前 10 行</el-tag>
          </div>
          <el-alert
            v-if="chart.error"
            :title="`数据查询失败: ${chart.error}`"
            type="error"
            :closable="false"
            show-icon
          />
          <el-table
            v-else
            :data="chart.rows.slice(0, 10)"
            size="small"
            border
            max-height="260"
            empty-text="无数据"
          >
            <el-table-column
              v-for="col in chart.columns"
              :key="col"
              :label="col"
              min-width="120"
              show-overflow-tooltip
            >
              <template #default="{ row }">{{ cellValue(row, col) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </template>
      <el-alert
        v-else
        :title="previewError || '该投递记录没有可预览的报表内容'"
        type="error"
        :closable="false"
        show-icon
      />
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getReportSubscriptions,
  createReportSubscription,
  updateReportSubscription,
  deleteReportSubscription,
  runReportSubscription,
  getReportDeliveries,
  markReportDeliveryRead,
  type ReportSubscription,
  type ReportDelivery,
  type ReportSnapshot,
  type ReportChannel,
} from '@/api/report'

const props = defineProps<{
  modelValue: boolean
  dashboard: { id: number; name: string } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeTab = ref<'subs' | 'deliveries'>('subs')
const subscriptions = ref<ReportSubscription[]>([])
const deliveries = ref<ReportDelivery[]>([])
const loadingSubs = ref(false)
const loadingDeliveries = ref(false)
const saving = ref(false)
const unreadCount = ref(0)
const deliveryPage = ref(1)
const deliveryPageSize = 10
const deliveryTotal = ref(0)

const cronOptions = [
  { label: '每小时整点', value: '0 * * * *' },
  { label: '每天 08:00', value: '0 8 * * *' },
  { label: '每天 09:00', value: '0 9 * * *' },
  { label: '每周一 09:00', value: '0 9 * * 1' },
  { label: '每月 1 日 09:00', value: '0 9 1 * *' },
]

// ---------- 表单 ----------
const formRef = ref<FormInstance>()
const formVisible = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  name: '',
  cron: '0 9 * * *',
  channel: 'inbox' as ReportChannel,
  recipients: '',
  webhookUrl: '',
  enabled: true,
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入订阅名称', trigger: 'blur' }],
  cron: [{ required: true, message: '请选择或输入 cron 表达式', trigger: 'change' }],
  channel: [{ required: true, message: '请选择投递渠道', trigger: 'change' }],
  webhookUrl: [{ required: true, message: '请填写 Webhook 回调地址', trigger: 'blur' }],
}

// ---------- 预览 ----------
const previewVisible = ref(false)
const previewTitle = ref('报表预览')
const previewError = ref('')
const snapshot = ref<ReportSnapshot | null>(null)

watch(
  () => props.modelValue,
  (value) => {
    if (!value) return
    activeTab.value = 'subs'
    loadSubscriptions()
    loadUnreadCount()
  },
)

watch(activeTab, (tab) => {
  if (tab === 'deliveries') loadDeliveries()
})

function handleClosed() {
  subscriptions.value = []
  deliveries.value = []
  unreadCount.value = 0
  deliveryPage.value = 1
  deliveryTotal.value = 0
  formVisible.value = false
  previewVisible.value = false
  editingId.value = null
}

function formatTime(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function cellValue(row: Record<string, unknown>, col: string): string {
  const value = row[col]
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// ---------- 数据加载 ----------
async function loadSubscriptions() {
  if (!props.dashboard) return
  loadingSubs.value = true
  try {
    const res = await getReportSubscriptions(props.dashboard.id)
    subscriptions.value = res.data
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载报表订阅失败')
  } finally {
    loadingSubs.value = false
  }
}

async function loadDeliveries() {
  if (!props.dashboard) return
  loadingDeliveries.value = true
  try {
    const res = await getReportDeliveries({
      dashboardId: props.dashboard.id,
      page: deliveryPage.value,
      pageSize: deliveryPageSize,
    })
    deliveries.value = res.data.list
    deliveryTotal.value = res.data.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载投递记录失败')
  } finally {
    loadingDeliveries.value = false
  }
}

async function loadUnreadCount() {
  if (!props.dashboard) return
  try {
    const res = await getReportDeliveries({
      dashboardId: props.dashboard.id,
      unreadOnly: true,
      page: 1,
      pageSize: 1,
    })
    unreadCount.value = res.data.total
  } catch {
    unreadCount.value = 0
  }
}

// ---------- 订阅操作 ----------
function resetForm() {
  form.name = ''
  form.cron = '0 9 * * *'
  form.channel = 'inbox'
  form.recipients = ''
  form.webhookUrl = ''
  form.enabled = true
}

function openCreate() {
  editingId.value = null
  resetForm()
  formVisible.value = true
}

function openEdit(row: ReportSubscription) {
  editingId.value = row.id
  form.name = row.name
  form.cron = row.cron
  form.channel = row.channel
  form.recipients = row.recipients ?? ''
  form.webhookUrl = row.webhookUrl ?? ''
  form.enabled = row.enabled
  formVisible.value = true
}

async function saveForm() {
  if (!formRef.value || !props.dashboard) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (form.channel === 'webhook' && !form.webhookUrl.trim()) {
    ElMessage.warning('请填写 Webhook 回调地址')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      cron: form.cron.trim(),
      channel: form.channel,
      recipients: form.recipients.trim() || null,
      webhookUrl: form.channel === 'webhook' ? form.webhookUrl.trim() || null : null,
      enabled: form.enabled,
    }
    if (editingId.value) {
      await updateReportSubscription(editingId.value, payload)
      ElMessage.success('订阅已更新')
    } else {
      await createReportSubscription({ ...payload, dashboardId: props.dashboard.id })
      ElMessage.success('订阅已创建')
    }
    formVisible.value = false
    await loadSubscriptions()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(row: ReportSubscription) {
  try {
    await updateReportSubscription(row.id, { enabled: row.enabled })
    ElMessage.success(row.enabled ? '订阅已启用' : '订阅已停用')
  } catch (e) {
    row.enabled = !row.enabled
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  }
}

async function removeSubscription(row: ReportSubscription) {
  try {
    await deleteReportSubscription(row.id)
    ElMessage.success('订阅已删除')
    await loadSubscriptions()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '删除失败')
  }
}

async function runNow(row: ReportSubscription) {
  try {
    const res = await runReportSubscription(row.id)
    if (res.data.status === 'failed') {
      ElMessage.error(res.data.message || '报表生成失败')
    } else {
      ElMessage.success(res.data.message || '报表已生成')
    }
    await loadSubscriptions()
    await loadUnreadCount()
    if (activeTab.value === 'deliveries') await loadDeliveries()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '生成失败')
  }
}

// ---------- 投递记录 ----------
async function previewDelivery(row: ReportDelivery) {
  previewTitle.value = row.title
  previewError.value = ''
  const content = row.content as ReportSnapshot | { error?: string }
  if (content && Array.isArray((content as ReportSnapshot).charts)) {
    snapshot.value = content as ReportSnapshot
  } else {
    snapshot.value = null
    previewError.value = (content as { error?: string })?.error || ''
  }
  previewVisible.value = true

  if (row.readFlag === 0) {
    try {
      await markReportDeliveryRead(row.id)
      row.readFlag = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // 标记已读失败不影响预览
    }
  }
}
</script>

<style scoped lang="less">
.report-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.report-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.last-run {
  display: flex;
  flex-direction: column;
  line-height: 16px;
  font-size: 12px;
}

.last-status {
  color: var(--el-color-success);
}

.last-status.is-failed {
  color: var(--el-color-danger);
}

.muted {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.report-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.delivery-badge {
  margin-left: 4px;
  transform: translateY(-8px);
}

.snapshot-meta {
  margin-bottom: 14px;
}

.snapshot-chart {
  margin-bottom: 18px;
}

.snapshot-chart__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.snapshot-chart__name {
  font-weight: 600;
  font-size: 13px;
}
</style>
