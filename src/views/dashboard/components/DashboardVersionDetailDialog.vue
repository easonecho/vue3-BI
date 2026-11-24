<template>
  <el-dialog
    v-model="visible"
    :title="t('dashboard.versionDetailTitle')"
    width="720px"
    append-to-body
    destroy-on-close
  >
    <div v-loading="loading">
      <template v-if="detail">
        <el-descriptions :column="2" size="small" border class="detail-meta">
          <el-descriptions-item :label="t('dashboard.versionNoLabel')"
            >v{{ detail.versionNo }}</el-descriptions-item
          >
          <el-descriptions-item :label="t('dashboard.name')">{{
            detail.name
          }}</el-descriptions-item>
          <el-descriptions-item :label="t('dashboard.componentCount')">{{
            componentCount
          }}</el-descriptions-item>
          <el-descriptions-item :label="t('dashboard.chartCount')">{{
            detail.snapshot?.chartCount ?? 0
          }}</el-descriptions-item>
          <el-descriptions-item :label="t('dashboard.canvasSize')">{{
            canvasSize
          }}</el-descriptions-item>
          <el-descriptions-item :label="t('dashboard.snapshotTime')">
            {{ formatVersionTime(detail.snapshot?.capturedAt || detail.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('dashboard.remark')" :span="2">
            {{ detail.remark || '-' }}
          </el-descriptions-item>
        </el-descriptions>
        <div class="detail-thumb">
          <img
            v-if="detail.snapshot?.thumbnail?.startsWith('data:')"
            :src="detail.snapshot.thumbnail"
            :alt="t('dashboard.versionThumbnailAlt')"
          />
          <div v-else class="detail-thumb__empty">
            <el-icon :size="28"><DataAnalysis /></el-icon>
            <span>{{ t('dashboard.noThumbnail') }}</span>
          </div>
        </div>
      </template>
    </div>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.close') }}</el-button>
      <el-button v-if="detail" type="warning" @click="emit('restore', detail)">{{
        t('dashboard.restoreThisVersion')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()

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
