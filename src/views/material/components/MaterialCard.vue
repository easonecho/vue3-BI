<template>
  <div class="material-card">
    <div class="card-thumb" @click="emit('preview', material)">
      <img
        v-if="(material.type === 'image' || material.type === 'decor') && material.url"
        :src="material.url"
        :alt="material.name"
        loading="lazy"
      />
      <video
        v-else-if="material.type === 'video' && material.url"
        :src="material.url"
        :poster="material.thumbnail || ''"
        muted
        preload="metadata"
      />
      <div v-else class="thumb-placeholder">
        <el-icon><Box /></el-icon>
        <span>{{ material.type.toUpperCase() }}</span>
      </div>
      <div class="thumb-mask">
        <el-icon class="mask-icon"><ZoomIn /></el-icon>
        <span>预览</span>
      </div>
    </div>
    <div class="card-body">
      <div class="card-name" :title="material.name">{{ material.name }}</div>
      <div class="card-meta">
        <el-tag size="small" :type="typeTagType(material.type)" effect="plain">
          {{ typeLabel(material.type) }}
        </el-tag>
        <span class="meta-size">{{ formatSize(material.size) }}</span>
      </div>
      <div class="card-time">{{ formatTime(material.createdAt) }}</div>
    </div>
    <div class="card-actions">
      <el-button link type="primary" size="small" @click="emit('preview', material)">
        <el-icon><View /></el-icon>预览
      </el-button>
      <el-button link type="primary" size="small" @click="emit('download', material)">
        <el-icon><Download /></el-icon>下载
      </el-button>
      <el-popconfirm
        title="确定删除该素材吗？删除后无法恢复"
        confirm-button-type="danger"
        @confirm="emit('delete', material)"
      >
        <template #reference>
          <el-button link type="danger" size="small">
            <el-icon><Delete /></el-icon>删除
          </el-button>
        </template>
      </el-popconfirm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Box, Delete, Download, View, ZoomIn } from '@element-plus/icons-vue'
import type { Material } from '@/api/material'
import {
  formatSize,
  formatTime,
  typeLabel,
  typeTagType,
} from '../utils/material-utils'

defineProps<{ material: Material }>()

const emit = defineEmits<{
  preview: [Material]
  download: [Material]
  delete: [Material]
}>()
</script>

<style scoped lang="less">
.material-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--bi-border-color, #374151);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bi-table-cell-bg, #1f2937);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary, #409eff);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
}

.card-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #0f172a;
  overflow: hidden;
  cursor: pointer;

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .thumb-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    font-size: 12px;

    .mask-icon {
      font-size: 28px;
    }
  }

  &:hover .thumb-mask {
    opacity: 1;
  }
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #6b7280;
  font-size: 12px;

  .el-icon {
    font-size: 36px;
  }
}

.card-body {
  flex: 1;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-name {
  font-size: 13px;
  color: var(--bi-text-primary, #f3f4f6);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--bi-text-muted, #9ca3af);

  .meta-size {
    color: var(--bi-text-secondary, #9ca3af);
  }
}

.card-time {
  font-size: 11px;
  color: var(--bi-text-muted, #6b7280);
}

.card-actions {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid var(--bi-border-color, #374151);
  padding: 4px 0;
}
</style>
