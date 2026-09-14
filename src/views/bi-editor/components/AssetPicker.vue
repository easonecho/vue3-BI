<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="780px"
    append-to-body
    :close-on-click-modal="false"
    @open="loadMaterials"
  >
    <div class="asset-picker">
      <!-- 工具栏 -->
      <div class="picker-toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索素材名称"
          clearable
          size="small"
          style="width: 200px"
          @keyup.enter="loadMaterials"
          @clear="loadMaterials"
        />
        <el-button size="small" type="primary" plain @click="loadMaterials">搜索</el-button>
        <el-button v-if="hasMore" size="small" link @click="loadMore">加载更多</el-button>
        <span class="picker-count">{{ multiple ? `已选 ${selectedUrls.length} 个` : '' }}</span>
      </div>

      <!-- 素材网格 -->
      <div v-loading="loading" class="picker-grid">
        <div v-if="materials.length === 0 && !loading" class="picker-empty">
          暂无{{ typeLabel }}素材，请先在「素材管理」页上传
        </div>
        <div
          v-for="m in materials"
          :key="m.id"
          :class="['asset-card', { selected: isSelected(m.url) }]"
          @click="toggleSelect(m)"
        >
          <div class="asset-thumb">
            <img
              v-if="(m.type === 'image' || m.type === 'decor') && m.url"
              :src="m.url"
              :alt="m.name"
              loading="lazy"
            />
            <video
              v-else-if="m.type === 'video' && m.url"
              :src="m.url"
              muted
              preload="metadata"
            />
            <div v-else class="asset-placeholder">{{ m.type.toUpperCase() }}</div>
          </div>
          <div class="asset-name" :title="m.name">{{ m.name }}</div>
          <span v-if="isSelected(m.url)" class="asset-check">✓</span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="selectedUrls.length === 0" @click="handleConfirm">
        确定{{ multiple ? `(${selectedUrls.length})` : '' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getMaterialList, type Material, type MaterialType } from '@/api/material'

const props = defineProps<{
  modelValue: boolean
  assetType?: MaterialType
  multiple?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', urls: string | string[]): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const materials = ref<Material[]>([])
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const pageSize = 24
const total = ref(0)
const selectedUrls = ref<string[]>([])

const hasMore = computed(() => materials.value.length < total.value)

const typeLabel = computed(() => {
  switch (props.assetType) {
    case 'video':
      return '视频'
    case 'image':
      return '图片'
    case 'decor':
      return '装饰'
    default:
      return ''
  }
})

const dialogTitle = computed(() => `选择${typeLabel.value}素材`)

async function loadMaterials() {
  loading.value = true
  try {
    page.value = 1
    const res = await getMaterialList({
      page: 1,
      pageSize,
      type: props.assetType,
      keyword: keyword.value || undefined,
    })
    materials.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    ElMessage.error('加载素材列表失败')
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loading.value || !hasMore.value) return
  loading.value = true
  try {
    page.value++
    const res = await getMaterialList({
      page: page.value,
      pageSize,
      type: props.assetType,
      keyword: keyword.value || undefined,
    })
    materials.value.push(...res.data.list)
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function isSelected(url: string): boolean {
  return selectedUrls.value.includes(url)
}

function toggleSelect(m: Material) {
  if (props.multiple) {
    const idx = selectedUrls.value.indexOf(m.url)
    if (idx >= 0) {
      selectedUrls.value.splice(idx, 1)
    } else {
      selectedUrls.value.push(m.url)
    }
  } else {
    // 单选：切换选中
    selectedUrls.value = isSelected(m.url) ? [] : [m.url]
  }
}

function handleConfirm() {
  if (selectedUrls.value.length === 0) return
  const result = props.multiple ? [...selectedUrls.value] : selectedUrls.value[0]
  emit('confirm', result)
  visible.value = false
  selectedUrls.value = []
}

// 弹窗打开时重置选中
watch(visible, (v) => {
  if (v) {
    selectedUrls.value = []
  }
})
</script>

<style scoped lang="less">
.asset-picker {
  min-height: 360px;
}

.picker-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.picker-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  min-height: 300px;
  max-height: 460px;
  overflow-y: auto;
  padding: 2px;
}

.picker-empty {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bi-text-muted, #6b7280);
  font-size: 13px;
  min-height: 200px;
}

.asset-card {
  position: relative;
  border: 2px solid var(--bi-border-color, #374151);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--bi-card-bg, #1f2937);
}

.asset-card:hover {
  border-color: var(--el-color-primary, #409eff);
}

.asset-card.selected {
  border-color: var(--el-color-primary, #409eff);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

.asset-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0f172a;
}

.asset-thumb img,
.asset-thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-placeholder {
  color: #6b7280;
  font-size: 11px;
  font-weight: bold;
}

.asset-name {
  padding: 4px 6px;
  font-size: 11px;
  color: var(--bi-text-primary, #f3f4f6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.asset-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--el-color-primary, #409eff);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
