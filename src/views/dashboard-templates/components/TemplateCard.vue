<template>
  <div class="tpl-card" :style="{ animationDelay: `${index * 0.04}s` }">
    <div class="tpl-inner">
      <!-- 缩略图区域 (主体), 点击跳转预览; hover 显示操作遮罩 -->
      <div class="tpl-thumb" @click="emit('preview', item)">
        <img
          v-if="item.thumbnail && item.thumbnail.startsWith('data:')"
          :src="item.thumbnail"
          :alt="item.name"
          class="thumb-img"
        />
        <span v-else class="thumb-emoji">{{ item.thumbnail || '📊' }}</span>
        <div class="thumb-overlay">
          <!-- 从模板新建看板 (P2-4 快速入口) -->
          <el-button size="small" type="success" @click.stop="emit('apply', item)">
            <el-icon><Plus /></el-icon>&nbsp;{{ t('templateManage.apply') }}
          </el-button>
          <el-button size="small" type="primary" @click.stop="emit('preview', item)">
            <el-icon><View /></el-icon>&nbsp;{{ t('templateManage.preview') }}
          </el-button>
          <!-- 系统预置模板禁止编辑 -->
          <el-button v-if="!item.isSystem" size="small" @click.stop="emit('edit', item)">
            <el-icon><Edit /></el-icon>&nbsp;{{ t('common.edit') }}
          </el-button>
        </div>
      </div>
      <!-- 底部信息区: 标题行 + 描述行 + 标签行 -->
      <div class="tpl-body">
        <!-- 标题行: 模板名称 + 预置/用户标签 + 更多操作下拉 -->
        <div class="tpl-title-row">
          <span class="tpl-name" :title="item.name">{{ item.name }}</span>
          <el-tag v-if="item.isSystem" size="small" type="warning" effect="dark">
            {{ t('templateManage.systemTag') }}
          </el-tag>
          <el-tag v-else size="small" type="success" effect="plain">
            {{ t('templateManage.userTag') }}
          </el-tag>
          <el-dropdown trigger="click" @command="onCommand">
            <el-icon class="more-btn"><MoreFilled /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="apply">
                  <el-icon><Plus /></el-icon>&nbsp;{{ t('templateManage.apply') }}
                </el-dropdown-item>
                <el-dropdown-item command="preview">
                  <el-icon><View /></el-icon>&nbsp;{{ t('templateManage.preview') }}
                </el-dropdown-item>
                <!-- 系统预置模板禁止 edit/copy/togglePublic/delete -->
                <template v-if="!item.isSystem">
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>&nbsp;{{ t('common.edit') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="copy">
                    <el-icon><CopyDocument /></el-icon>&nbsp;{{ t('templateManage.copy') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="togglePublic" divided>
                    <el-icon><Share /></el-icon>&nbsp;{{ item.isPublic ? t('dashboard.setPrivate') : t('dashboard.setPublic') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>&nbsp;{{ t('common.delete') }}
                  </el-dropdown-item>
                </template>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <!-- 描述行: 1 行截断, 无描述时显示占位 -->
        <p class="tpl-desc" :title="item.description || ''">{{ item.description || t('dashboard.noDesc') }}</p>
        <!-- 标签行: 分类标签 + 公开/私有标签 -->
        <div class="tpl-tags">
          <el-tag v-if="item.category" size="small" type="primary" effect="plain">
            {{ categoryText }}
          </el-tag>
          <el-tag size="small" :type="item.isPublic ? 'success' : 'info'">
            {{ item.isPublic ? t('dashboard.public') : t('dashboard.private') }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  Plus, MoreFilled, Edit, View, CopyDocument, Delete, Share,
} from '@element-plus/icons-vue'
import type { DashboardTemplate } from '@/api/dashboard-template'

const props = defineProps<{
  item: DashboardTemplate
  index: number
  categoryText: string
}>()

const emit = defineEmits<{
  apply: [DashboardTemplate]
  preview: [DashboardTemplate]
  edit: [DashboardTemplate]
  command: [string, DashboardTemplate]
}>()

const { t } = useI18n()

function onCommand(cmd: string) {
  emit('command', cmd, props.item)
}
</script>

<style scoped lang="less">
.tpl-card {
  position: relative;
  margin-bottom: 16px;
  border-radius: 8px;
  background: var(--bi-card-bg);
  border: 1px solid var(--bi-card-border);
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  animation: cardEnter 0.3s ease both;

  &:hover {
    border-color: var(--bi-border-accent);
    box-shadow: var(--bi-shadow-sm);
  }

  .tpl-inner {
    padding: 0;
  }
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 缩略图主体: 高 160px, 点击预览, hover 显示遮罩操作 */
.tpl-thumb {
  position: relative;
  height: 160px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bi-bg-muted, rgba(128, 128, 128, 0.06));

  .thumb-emoji {
    font-size: 48px;
    line-height: 1;
  }

  .thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* 半透明遮罩 + 操作按钮 */
  .thumb-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .thumb-overlay {
    opacity: 1;
  }
}

/* 底部信息区 */
.tpl-body {
  padding: 12px 14px;
}

.tpl-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tpl-desc {
  margin: 6px 0 8px;
  font-size: 12px;
  color: var(--bi-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tpl-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tpl-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--bi-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.more-btn {
  cursor: pointer;
  color: var(--bi-text-secondary);
  font-size: 18px;
  flex-shrink: 0;
  transition: color 0.2s;

  &:hover {
    color: var(--bi-accent);
  }
}
</style>
