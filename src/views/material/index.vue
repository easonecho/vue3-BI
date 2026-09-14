<template>
  <div class="material-page">
    <el-card class="page-card" shadow="never">
      <!-- 顶部筛选栏 -->
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索素材名称"
          clearable
          style="width: 220px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="filters.type"
          placeholder="按类型筛选"
          clearable
          style="width: 160px"
          @change="handleSearch"
        >
          <el-option label="视频" value="video" />
          <el-option label="图片" value="image" />
          <el-option label="装饰" value="decor" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>&nbsp;查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>&nbsp;重置
        </el-button>
        <div class="spacer" />
        <el-button type="success" @click="openUploadDialog">
          <el-icon><Upload /></el-icon>&nbsp;上传素材
        </el-button>
      </div>

      <!-- 素材网格 -->
      <div v-loading="loading" class="material-grid">
        <div v-if="list.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无素材，请点击右上角上传" />
        </div>
        <div v-for="m in list" :key="m.id" class="material-card">
          <div class="card-thumb" @click="openPreview(m)">
            <img
              v-if="(m.type === 'image' || m.type === 'decor') && m.url"
              :src="m.url"
              :alt="m.name"
              loading="lazy"
            />
            <video
              v-else-if="m.type === 'video' && m.url"
              :src="m.url"
              :poster="m.thumbnail || ''"
              muted
              preload="metadata"
            />
            <div v-else class="thumb-placeholder">
              <el-icon><Box /></el-icon>
              <span>{{ m.type.toUpperCase() }}</span>
            </div>
            <div class="thumb-mask">
              <el-icon class="mask-icon"><ZoomIn /></el-icon>
              <span>预览</span>
            </div>
          </div>
          <div class="card-body">
            <div class="card-name" :title="m.name">{{ m.name }}</div>
            <div class="card-meta">
              <el-tag size="small" :type="typeTagType(m.type)" effect="plain">
                {{ typeLabel(m.type) }}
              </el-tag>
              <span class="meta-size">{{ formatSize(m.size) }}</span>
            </div>
            <div class="card-time">{{ formatTime(m.createdAt) }}</div>
          </div>
          <div class="card-actions">
            <el-button link type="primary" size="small" @click="handlePreview(m)">
              <el-icon><View /></el-icon>预览
            </el-button>
            <el-button link type="primary" size="small" @click="handleDownload(m)">
              <el-icon><Download /></el-icon>下载
            </el-button>
            <el-popconfirm
              title="确定删除该素材吗？删除后无法恢复"
              confirm-button-type="danger"
              @confirm="handleDelete(m)"
            >
              <template #reference>
                <el-button link type="danger" size="small">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传素材"
      width="560px"
      destroy-on-close
      append-to-body
    >
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="80px">
        <el-form-item label="文件" prop="file">
          <el-upload
            ref="uploadRef"
            class="upload-uploader"
            drag
            :auto-upload="false"
            :limit="1"
            :on-change="onFileChange"
            :on-exceed="onFileExceed"
            :accept="acceptString"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖拽到此处，或<em>点击选择</em>
            </div>
            <template #tip>
              <div class="upload-tip">
                支持 video/*、image/*、svg/json 等素材；单个文件最大 200MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="名称">
          <el-input
            v-model="uploadForm.name"
            placeholder="留空则使用原始文件名"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="uploadForm.type">
            <el-radio-button label="video">视频</el-radio-button>
            <el-radio-button label="image">图片</el-radio-button>
            <el-radio-button label="decor">装饰</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="2"
            placeholder="可选"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="uploading"
          :disabled="!uploadForm.file"
          @click="submitUpload"
        >
          上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewMaterial?.name || '素材预览'"
      width="800px"
      append-to-body
      destroy-on-close
    >
      <div v-if="previewMaterial" class="preview-container">
        <img
          v-if="previewMaterial.type === 'image' || previewMaterial.type === 'decor'"
          :src="previewMaterial.url"
          :alt="previewMaterial.name"
          class="preview-media"
        />
        <video
          v-else-if="previewMaterial.type === 'video'"
          :src="previewMaterial.url"
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
            <el-descriptions-item label="名称">{{ previewMaterial.name }}</el-descriptions-item>
            <el-descriptions-item label="类型">
              {{ typeLabel(previewMaterial.type) }}
            </el-descriptions-item>
            <el-descriptions-item label="原始文件名">
              {{ previewMaterial.originalName }}
            </el-descriptions-item>
            <el-descriptions-item label="大小">
              {{ formatSize(previewMaterial.size) }}
            </el-descriptions-item>
            <el-descriptions-item label="MIME">
              {{ previewMaterial.mimeType }}
            </el-descriptions-item>
            <el-descriptions-item label="上传时间">
              {{ formatTime(previewMaterial.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item v-if="previewMaterial.description" label="描述" :span="2">
              {{ previewMaterial.description }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleDownload(previewMaterial!)">
          <el-icon><Download /></el-icon>下载
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, UploadFile, UploadInstance } from 'element-plus'
import {
  Search,
  Refresh,
  Upload,
  UploadFilled,
  View,
  Download,
  Delete,
  Box,
  ZoomIn,
} from '@element-plus/icons-vue'
import {
  getMaterialList,
  uploadMaterial,
  deleteMaterial,
  getMaterialDownloadUrl,
  type Material,
  type MaterialType,
} from '@/api/material'

// ========== 列表数据 ==========
const list = ref<Material[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

const filters = reactive({
  keyword: '',
  type: '' as '' | MaterialType,
})

async function loadList() {
  loading.value = true
  try {
    const res = await getMaterialList({
      page: page.value,
      pageSize: pageSize.value,
      type: filters.type || undefined,
      keyword: filters.keyword || undefined,
    })
    list.value = res.data.list
    total.value = res.data.total
  } catch (e: any) {
    ElMessage.error(e?.message || '加载素材列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadList()
}

function handleReset() {
  filters.keyword = ''
  filters.type = ''
  page.value = 1
  loadList()
}

// ========== 上传 ==========
const uploadDialogVisible = ref(false)
const uploading = ref(false)
const uploadFormRef = ref<FormInstance>()
const uploadRef = ref<UploadInstance>()

const uploadForm = reactive({
  file: null as File | null,
  name: '',
  type: 'image' as MaterialType,
  description: '',
})

const uploadRules = {
  file: [{ required: true, message: '请选择文件', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

const acceptString = 'video/*,image/*,.svg,.json'

function openUploadDialog() {
  uploadForm.file = null
  uploadForm.name = ''
  uploadForm.type = 'image'
  uploadForm.description = ''
  uploadDialogVisible.value = true
}

function onFileChange(file: UploadFile) {
  if (file.raw) {
    uploadForm.file = file.raw
    // 根据文件类型自动推断
    const mime = file.raw.type
    if (mime.startsWith('video/')) {
      uploadForm.type = 'video'
    } else if (mime.startsWith('image/')) {
      uploadForm.type = 'image'
    } else {
      uploadForm.type = 'decor'
    }
    // 自动填充名称
    if (!uploadForm.name) {
      uploadForm.name = file.raw.name.replace(/\.[^.]+$/, '')
    }
  }
}

function onFileExceed() {
  ElMessage.warning('一次只能上传一个文件，请先删除已选文件')
}

async function submitUpload() {
  if (!uploadForm.file) {
    ElMessage.warning('请先选择文件')
    return
  }
  uploading.value = true
  try {
    await uploadMaterial(uploadForm.file, {
      name: uploadForm.name || undefined,
      type: uploadForm.type,
      description: uploadForm.description || undefined,
    })
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    uploadRef.value?.clearFiles()
    // 刷新列表
    page.value = 1
    await loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

// ========== 预览 ==========
const previewVisible = ref(false)
const previewMaterial = ref<Material | null>(null)

function openPreview(m: Material) {
  previewMaterial.value = m
  previewVisible.value = true
}

function handlePreview(m: Material) {
  openPreview(m)
}

// ========== 下载 ==========
function handleDownload(m: Material) {
  if (!m) return
  const url = getMaterialDownloadUrl(m.id)
  const a = document.createElement('a')
  a.href = url
  a.download = m.originalName || m.name
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ========== 删除 ==========
async function handleDelete(m: Material) {
  try {
    await deleteMaterial(m.id)
    ElMessage.success('删除成功')
    // 若当前页删除后空了，回退一页
    if (list.value.length === 1 && page.value > 1) {
      page.value--
    }
    await loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

// ========== 辅助函数 ==========
function typeLabel(t: string): string {
  switch (t) {
    case 'video':
      return '视频'
    case 'image':
      return '图片'
    case 'decor':
      return '装饰'
    default:
      return t
  }
}

function typeTagType(t: string): 'primary' | 'success' | 'warning' {
  switch (t) {
    case 'video':
      return 'primary'
    case 'image':
      return 'success'
    case 'decor':
      return 'warning'
    default:
      return 'success'
  }
}

function formatSize(bytes: number): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatTime(s: string): string {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  loadList()
})
</script>

<style scoped lang="less">
.material-page {
  padding: 16px;
}

.page-card {
  background: var(--bi-card-bg, #1f2937);
  border-radius: 8px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  .spacer {
    flex: 1;
  }
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 16px;
  min-height: 300px;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

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

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 上传对话框 */
.upload-uploader {
  width: 100%;

  :deep(.el-upload-dragger) {
    width: 100%;
  }
}

.upload-tip {
  font-size: 12px;
  color: var(--bi-text-muted, #9ca3af);
  line-height: 1.6;
}

/* 预览对话框 */
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
