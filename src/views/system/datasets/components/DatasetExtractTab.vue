<template>
  <div>
    <el-alert type="info" :closable="false" style="margin-bottom: 16px">
      抽取模式将 SQL 结果物化为本地快照: 图表取数直接读快照, 不再实时查询源库。
      快照不会自动刷新, 源数据更新后需点击「立即抽取」。
    </el-alert>
    <template v-if="mode === 'edit'">
      <el-descriptions v-if="extractInfo.enabled" :column="3" border size="small">
        <el-descriptions-item label="状态">
          <el-tag type="success" size="small">已启用</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="快照行数">
          {{ extractInfo.rowCount }}
        </el-descriptions-item>
        <el-descriptions-item label="最近抽取">
          {{ formatFileTime(extractInfo.lastExtractAt || undefined) }}
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
    </template>
    <el-alert v-else type="warning" :closable="false">保存数据集后才能执行抽取</el-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  type DatasetExtractInfo,
  getDatasetExtract,
  extractDataset,
  removeDatasetExtract,
} from '@/api/dataset'
import { formatFileTime } from '../utils/dataset-edit-utils'

const props = defineProps<{
  mode: 'create' | 'edit'
  datasetId?: number
}>()

const extracting = ref(false)
const removingExtract = ref(false)
const extractInfo = ref<DatasetExtractInfo>({
  enabled: false,
  rowCount: 0,
  lastExtractAt: null,
})

function resetExtractInfo() {
  extractInfo.value = { enabled: false, rowCount: 0, lastExtractAt: null }
}

async function loadExtractInfo(id: number) {
  try {
    const res = await getDatasetExtract(id)
    extractInfo.value = res.data
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
    extractInfo.value = res.data
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
</style>
