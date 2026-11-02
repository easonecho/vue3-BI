<template>
  <div class="template-picker">
    <p class="picker-hint">{{ t('dashboard.templateHint') }}</p>
    <el-tabs v-model="templateTab" class="picker-tabs">
      <!-- 用户模板库 -->
      <el-tab-pane :label="t('dashboard.userTemplateTab')" name="user">
        <div v-loading="loading">
          <el-row :gutter="12">
            <el-col v-for="tpl in templates" :key="tpl.id" :xs="24" :sm="12" :md="8">
              <div
                class="tpl-picker-card"
                :class="{ active: selectedId === tpl.id }"
                @click="emit('select', tpl.id)"
              >
                <!-- 缩略图主体 -->
                <div class="tpl-picker-thumb">
                  <img
                    v-if="tpl.thumbnail && tpl.thumbnail.startsWith('data:')"
                    :src="tpl.thumbnail"
                    :alt="tpl.name"
                    class="thumb-img"
                  />
                  <div v-else class="thumb-placeholder">
                    <el-icon :size="36" color="#94a3b8"><DataAnalysis /></el-icon>
                    <span class="thumb-emoji">{{ tpl.thumbnail || '' }}</span>
                  </div>
                  <!-- hover 遮罩 -->
                  <div class="thumb-overlay">
                    <el-icon class="overlay-icon"><ZoomIn /></el-icon>
                    <span class="overlay-text">预览</span>
                  </div>
                  <!-- 选中徽标 -->
                  <div v-if="selectedId === tpl.id" class="selected-badge">
                    <el-icon><CircleCheckFilled /></el-icon>
                  </div>
                </div>
                <!-- 信息区 -->
                <div class="tpl-picker-info">
                  <div class="tpl-picker-name" :title="tpl.name">{{ tpl.name }}</div>
                  <p class="tpl-picker-desc" :title="tpl.description || ''">
                    {{ tpl.description || t('dashboard.noDesc') }}
                  </p>
                  <div class="tpl-picker-tags">
                    <el-tag v-if="tpl.category" size="small" effect="plain" type="primary">{{
                      tpl.category
                    }}</el-tag>
                    <el-tag v-if="tpl.isSystem" size="small" type="warning" effect="dark"
                      >预置</el-tag
                    >
                    <el-tag
                      v-else
                      size="small"
                      :type="tpl.isPublic ? 'success' : 'info'"
                      effect="plain"
                      >{{ tpl.isPublic ? t('dashboard.public') : t('dashboard.private') }}</el-tag
                    >
                  </div>
                </div>
              </div>
            </el-col>
            <el-col v-if="!loading && templates.length === 0" :span="24">
              <el-empty :description="t('dashboard.noUserTemplates')">
                <el-button type="primary" @click="emit('go-template-manage')">{{
                  t('dashboard.goTemplateLib')
                }}</el-button>
              </el-empty>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DataAnalysis, ZoomIn, CircleCheckFilled } from '@element-plus/icons-vue'
import type { DashboardTemplate } from '@/api/types'

defineProps<{
  templates: DashboardTemplate[]
  loading: boolean
  selectedId: number | null
}>()

const emit = defineEmits<{
  (e: 'select', id: number): void
  (e: 'go-template-manage'): void
}>()

const { t } = useI18n()
const templateTab = ref<'user'>('user')
</script>

<style scoped lang="less">
/* 模板选择器 */
.template-picker {
  .picker-hint {
    font-size: 13px;
    color: var(--bi-text-secondary);
    margin: 0 0 16px 0;
  }

  .picker-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 12px;
    }
    :deep(.el-tabs__content) {
      max-height: 420px;
      overflow-y: auto;
    }
  }
}

/* ========== 新建看板 — 模板选择卡片 ========== */
.tpl-picker-card {
  background: var(--bi-card-bg);
  border: 1.5px solid var(--bi-card-border);
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  min-height: 220px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: var(--bi-border-accent);
    box-shadow: 0 8px 24px -8px rgba(64, 158, 255, 0.25);
    transform: translateY(-2px);

    .thumb-overlay {
      opacity: 1;
    }
  }

  &.active {
    border-color: var(--bi-accent);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2), 0 8px 24px -8px rgba(64, 158, 255, 0.3);

    .selected-badge {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* --- 缩略图区 --- */
  .tpl-picker-thumb {
    position: relative;
    aspect-ratio: 16 / 9;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    overflow: hidden;
    flex-shrink: 0;

    .thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .thumb-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;

      .thumb-emoji {
        font-size: 20px;
      }
    }

    /* hover 遮罩 */
    .thumb-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      opacity: 0;
      transition: opacity 0.2s ease;
      color: #fff;

      .overlay-icon {
        font-size: 24px;
      }
      .overlay-text {
        font-size: 12px;
        font-weight: 500;
      }
    }

    /* 选中徽标 */
    .selected-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--bi-accent);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      opacity: 0;
      transform: scale(0.6);
      transition:
        opacity 0.2s ease,
        transform 0.2s ease;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.5);
    }
  }

  /* --- 信息区 --- */
  .tpl-picker-info {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  .tpl-picker-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--bi-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
  }

  .tpl-picker-desc {
    margin: 0;
    font-size: 12px;
    color: var(--bi-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.5;
  }

  .tpl-picker-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: auto;
  }
}
</style>
