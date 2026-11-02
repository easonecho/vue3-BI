<template>
  <el-dialog v-model="visible" title="版本详情" width="720px" append-to-body destroy-on-close>
    <div v-loading="loading">
      <template v-if="detail">
        <el-descriptions :column="2" size="small" border class="detail-meta">
          <el-descriptions-item label="版本号">v{{ detail.versionNo }}</el-descriptions-item>
          <el-descriptions-item label="看板名称">{{ detail.name }}</el-descriptions-item>
          <el-descriptions-item label="组件数">{{ componentCount }}</el-descriptions-item>
          <el-descriptions-item label="图表数">{{ detail.snapshot?.chartCount ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="画布尺寸">{{ canvasSize }}</el-descriptions-item>
          <el-descriptions-item label="快照时间">
            {{ formatVersionTime(detail.snapshot?.capturedAt || detail.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ detail.remark || '-' }}
          </el-descriptions-item>
        </el-descriptions>
        <div class="detail-thumb">
          <img
            v-if="detail.snapshot?.thumbnail?.startsWith('data:')"
            :src="detail.snapshot.thumbnail"
            alt="版本缩略图"
          />
          <div v-else class="detail-thumb__empty">
            <el-icon :size="28"><DataAnalysis /></el-icon>
            <span>该版本无缩略图</span>
          </div>
        </div>
      </template>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button v-if="detail" type="warning" @click="emit('restore', detail)">恢复此版本</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DataAnalysis } from '@element-plus/icons-vue'
import type { DashboardVersion } from '@/api/dashboard-version'
import {
  countComponents,
  formatCanvasSize,
  formatVersionTime,
} from '../utils/dashboard-version-utils'

const props = defineProps<{
  detail: DashboardVersion | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'restore', row: DashboardVersion): void
}>()

const visible = defineModel<boolean>({ required: true })

const componentCount = computed(() => countComponents(props.detail))
const canvasSize = computed(() => formatCanvasSize(props.detail))
</script>

<style scoped lang="less">
.detail-meta {
  margin-bottom: 14px;
}

.detail-thumb {
  height: 260px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.detail-thumb__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
