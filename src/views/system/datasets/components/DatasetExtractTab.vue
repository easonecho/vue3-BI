<template>
  <div>
    <el-alert type="info" :closable="false" style="margin-bottom: 16px">
      抽取模式将 SQL 结果物化为本地快照: 图表取数直接读快照, 不再实时查询源库。
      可手动「立即抽取」, 也可在生成快照后配置定时刷新。
    </el-alert>
    <template v-if="mode === 'edit'">
      <el-descriptions v-if="extractInfo.enabled" :column="4" border size="small">
        <el-descriptions-item label="状态">
          <el-tag type="success" size="small">已启用</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="快照行数">
          {{ extractInfo.rowCount }}
        </el-descriptions-item>
        <el-descriptions-item label="最近抽取">
          {{ formatFileTime(extractInfo.lastExtractAt || undefined) }}
        </el-descriptions-item>
        <el-descriptions-item label="定时刷新">
          <el-tag v-if="extractInfo.refreshEnabled" type="success" size="small">
            {{ refreshCronLabel }}
          </el-tag>
          <span v-else class="text-muted">未启用</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-empty
        v-if="!extractInfo.enabled"
        description="尚未启用抽取, 当前为实时查询"
        :image-size="60"
      />
      <div class="extract-actions">
        <el-button type="primary" :loading="extracting" @click="handleExtract">
          立即抽取
        </el-button>
        <el-popconfirm
          v-if="extractInfo.enabled"
          title="取消后将恢复实时查询源库, 确定吗?"
          @confirm="handleRemoveExtract"
        >
          <template #reference>
            <el-button :loading="removingExtract">取消抽取</el-button>
          </template>
        </el-popconfirm>
      </div>

      <!-- 定时刷新 (P2-1) -->
      <div v-if="extractInfo.enabled" class="extract-refresh">
        <div class="refresh-row">
          <span class="refresh-label">定时刷新</span>
          <el-switch v-model="refreshEnabled" :disabled="savingRefresh" />
          <el-select
            v-model="refreshCron"
            :disabled="!refreshEnabled || savingRefresh"
            style="width: 200px"
          >
            <el-option
              v-for="opt in REFRESH_CRON_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-button type="primary" :loading="savingRefresh" @click="handleSaveRefresh">
            保存
          </el-button>
        </div>
        <p class="refresh-hint">
          按 cron 自动重新抽取快照; 最近自动刷新:
          {{ formatFileTime(extractInfo.lastAutoRunAt || undefined) }}
        </p>
      </div>
    </template>
    <el-alert v-else type="warning" :closable="false">保存数据集后才能执行抽取</el-alert>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  type DatasetExtractInfo,
  getDatasetExtract,
  extractDataset,
  removeDatasetExtract,
  updateDatasetExtractRefresh,
} from '@/api/dataset'
import { formatFileTime } from '../utils/dataset-edit-utils'
import { CRON_OPTIONS as REFRESH_CRON_OPTIONS } from '../utils/dataset-alert-utils'

const DEFAULT_REFRESH_CRON = '0 * * * *'

const props = defineProps<{
  mode: 'create' | 'edit'
  datasetId?: number
}>()

const extracting = ref(false)
const removingExtract = ref(false)
const savingRefresh = ref(false)
const refreshEnabled = ref(false)
const refreshCron = ref(DEFAULT_REFRESH_CRON)
const extractInfo = ref<DatasetExtractInfo>({
  enabled: false,
  rowCount: 0,
  lastExtractAt: null,
  refreshEnabled: false,
  refreshCron: null,
  lastAutoRunAt: null,
})

/** 定时刷新周期展示文案 */
const refreshCronLabel = computed(() => {
  const current = extractInfo.value.refreshCron
  const option = REFRESH_CRON_OPTIONS.find((opt) => opt.value === current)
  return option?.label ?? current ?? '-'
})

function resetExtractInfo() {
  extractInfo.value = {
    enabled: false,
    rowCount: 0,
    lastExtractAt: null,
    refreshEnabled: false,
    refreshCron: null,
    lastAutoRunAt: null,
  }
  refreshEnabled.value = false
  refreshCron.value = DEFAULT_REFRESH_CRON
}

async function loadExtractInfo(id: number) {
  try {
    const res = await getDatasetExtract(id)
    extractInfo.value = res.data
    refreshEnabled.value = res.data.refreshEnabled ?? false
    refreshCron.value = res.data.refreshCron || DEFAULT_REFRESH_CRON
  } catch {
    resetExtractInfo()
  }
}

watch(
  () => props.datasetId,
  (id) => {
    if (props.mode === 'edit' && id) loadExtractInfo(id)
    else resetExtractInfo()
  },
  { immediate: true },
)

async function handleExtract() {
  if (!props.datasetId) return
  extracting.value = true
  try {
    const res = await extractDataset(props.datasetId)
    await loadExtractInfo(props.datasetId)
    ElMessage.success(
      res.data.truncated
        ? `数据抽取完成 (超过上限, 仅保留 ${res.data.rowCount} 行)`
        : `数据抽取完成 (${res.data.rowCount} 行)`,
    )
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    extracting.value = false
  }
}

async function handleSaveRefresh() {
  if (!props.datasetId) return
  const cron = refreshCron.value.trim()
  if (refreshEnabled.value && !cron) {
    ElMessage.warning('请选择定时刷新周期')
    return
  }
  savingRefresh.value = true
  try {
    const res = await updateDatasetExtractRefresh(props.datasetId, {
      enabled: refreshEnabled.value,
      cron,
    })
    extractInfo.value.refreshEnabled = res.data.refreshEnabled
    extractInfo.value.refreshCron = res.data.refreshCron
    ElMessage.success(refreshEnabled.value ? '已启用定时刷新' : '已关闭定时刷新')
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    savingRefresh.value = false
  }
}

async function handleRemoveExtract() {
  if (!props.datasetId) return
  removingExtract.value = true
  try {
    await removeDatasetExtract(props.datasetId)
    resetExtractInfo()
    ElMessage.success('已取消抽取, 恢复实时查询')
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    removingExtract.value = false
  }
}
</script>

<style scoped lang="less">
.extract-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.extract-refresh {
  margin-top: 20px;
  padding: 14px 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafbfc;
}

.refresh-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.refresh-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.refresh-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.text-muted {
  color: #9ca3af;
}
</style>
