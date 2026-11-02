<template>
  <el-dialog
    v-model="visible"
    :title="material?.name || '素材预览'"
    width="800px"
    append-to-body
    destroy-on-close
  >
    <div v-if="material" class="preview-container">
      <img
        v-if="material.type === 'image' || material.type === 'decor'"
        :src="material.url"
        :alt="material.name"
        class="preview-media"
      />
      <video
        v-else-if="material.type === 'video'"
        :src="material.url"
        controls
        autoplay
        class="preview-media"
      />
      <div v-else class="preview-decor">
        <el-icon><Box /></el-icon>
        <span>装饰素材</span>
      </div>
      <div class="preview-info">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="名称">{{ material.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            {{ typeLabel(material.type) }}
          </el-descriptions-item>
          <el-descriptions-item label="原始文件名">
            {{ material.originalName }}
          </el-descriptions-item>
          <el-descriptions-item label="大小">
            {{ formatSize(material.size) }}
          </el-descriptions-item>
          <el-descriptions-item label="MIME">
            {{ material.mimeType }}
          </el-descriptions-item>
          <el-descriptions-item label="上传时间">
            {{ formatTime(material.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="material.description" label="描述" :span="2">
            {{ material.description }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="download">
        <el-icon><Download /></el-icon>下载
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Download, Box } from '@element-plus/icons-vue'
import type { Material } from '@/api/material'
import { formatSize, formatTime, typeLabel } from '../utils/material-utils'

const props = defineProps<{ material: Material | null }>()

const emit = defineEmits<{ download: [Material] }>()

const visible = defineModel<boolean>({ required: true })

function download() {
  if (!props.material) return
  emit('download', props.material)
}
</script>

<style scoped lang="less">
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-media {
  max-width: 100%;
  max-height: 480px;
  display: block;
  margin: 0 auto;
  border-radius: 4px;
}

.preview-decor {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 12px;
  color: var(--bi-text-muted, #9ca3af);
  font-size: 14px;

  .el-icon {
    font-size: 48px;
  }
}

.preview-info {
  margin-top: 8px;
}
</style>
