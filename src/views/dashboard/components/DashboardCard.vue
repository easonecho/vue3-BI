<template>
  <div class="dashboard-card" :style="{ animationDelay: `${index * 0.04}s` }">
    <div class="card-thumb" @click="emit('preview', item.id)">
      <img
        v-if="item.thumbnail && item.thumbnail.startsWith('data:')"
        :src="item.thumbnail"
        :alt="item.name"
      />
      <div v-else class="thumb-placeholder">
        <el-icon :size="32"><DataAnalysis /></el-icon>
      </div>
      <div class="thumb-overlay">
        <el-button size="small" type="primary" @click.stop="emit('preview', item.id)">
          <el-icon><View /></el-icon>&nbsp;预览
        </el-button>
        <el-button size="small" @click.stop="emit('edit', item.id)">
          <el-icon><Edit /></el-icon>&nbsp;编辑
        </el-button>
      </div>
    </div>
    <div class="card-body">
      <!-- 标题行 -->
      <div class="card-title-row">
        <div class="footer-left">
          <span class="status-indicator" :class="item.status === 1 ? 'is-published' : 'is-draft'" />
          <span class="card-title" :title="item.name">{{ item.name }}</span>
        </div>
        <div class="footer-right">
          <el-tooltip :content="favorited ? '取消收藏' : '收藏'" placement="top">
            <el-icon
              class="favorite-btn"
              :class="{ active: favorited }"
              @click.stop="emit('toggle-favorite', item)"
            >
              <component :is="favorited ? StarFilled : Star" />
            </el-icon>
          </el-tooltip>
          <el-dropdown trigger="click" @command="(cmd: string) => emit('command', cmd, item)">
            <el-icon class="more-btn"><MoreFilled /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">
                  <el-icon><Edit /></el-icon>&nbsp;重命名
                </el-dropdown-item>
                <el-dropdown-item command="copy">
                  <el-icon><CopyDocument /></el-icon>&nbsp;复制
                </el-dropdown-item>
                <el-dropdown-item command="moveGroup">
                  <el-icon><Rank /></el-icon>&nbsp;移动到分组
                </el-dropdown-item>
                <el-dropdown-item command="saveAsTemplate">
                  <el-icon><Files /></el-icon>&nbsp;存为模板
                </el-dropdown-item>
                <el-dropdown-item command="share">
                  <el-icon><Share /></el-icon>&nbsp;分享
                </el-dropdown-item>
                <el-dropdown-item command="report">
                  <el-icon><Clock /></el-icon>&nbsp;定时报表
                </el-dropdown-item>
                <el-dropdown-item command="versions">
                  <el-icon><Tickets /></el-icon>&nbsp;版本管理
                </el-dropdown-item>
                <el-dropdown-item command="toggleStatus" divided>
                  <el-icon><Promotion /></el-icon>&nbsp;{{
                    item.status === 1 ? '转为草稿' : '发布'
                  }}
                </el-dropdown-item>
                <el-dropdown-item command="togglePublic">
                  <el-icon><Share /></el-icon>&nbsp;{{ item.isPublic ? '设为私有' : '设为公开' }}
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon><Delete /></el-icon>&nbsp;删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <!-- 描述行 -->
      <p class="card-desc" :title="item.description">{{ item.description || '暂无描述' }}</p>
      <!-- 标签行 -->
      <div class="card-tags">
        <el-tag size="small" :type="item.isPublic ? 'success' : 'info'">{{
          item.isPublic ? '公开' : '私有'
        }}</el-tag>
        <el-tag size="small" :type="item.status === 1 ? 'success' : 'warning'">{{
          item.status === 1 ? '已发布' : '草稿'
        }}</el-tag>
        <el-tag v-if="item._count?.charts" size="small" type="primary" effect="plain">
          <el-icon><PieChart /></el-icon>&nbsp;{{ item._count.charts }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  MoreFilled,
  Edit,
  View,
  CopyDocument,
  DataAnalysis,
  Delete,
  Promotion,
  Share,
  PieChart,
  Clock,
  Star,
  StarFilled,
  Files,
  Rank,
  Tickets,
} from '@element-plus/icons-vue'
import type { Dashboard } from '@/api/types'

defineProps<{
  item: Dashboard
  /** 列表序号，用于卡片入场动画延迟 */
  index: number
  /** 当前用户是否已收藏 */
  favorited: boolean
}>()

const emit = defineEmits<{
  preview: [id: number]
  edit: [id: number]
  'toggle-favorite': [item: Dashboard]
  command: [cmd: string, item: Dashboard]
}>()
</script>

<style scoped lang="less">
/* 看板卡片 */
.dashboard-card {
  position: relative;
  margin-bottom: 16px;
  border-radius: 8px;
  background: var(--bi-card-bg);
  border: 1px solid var(--bi-card-border);
  overflow: hidden;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  animation: cardEnter 0.3s ease both;

  &:hover {
    border-color: var(--bi-border-accent);
    box-shadow: var(--bi-shadow-sm);
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

.card-thumb {
  position: relative;
  height: 160px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bi-text-secondary);
}

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

.card-thumb:hover .thumb-overlay {
  opacity: 1;
}

.card-body {
  padding: 12px 14px;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;

  &.is-published {
    background: var(--bi-success);
  }
  &.is-draft {
    background: var(--bi-warning);
  }
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--bi-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.favorite-btn {
  cursor: pointer;
  color: var(--bi-text-muted);
  font-size: 17px;
  transition: color 0.15s ease;

  &:hover {
    color: #fbbf24;
  }

  &.active {
    color: #fbbf24;
  }
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

.card-desc {
  margin: 6px 0 8px;
  font-size: 12px;
  color: var(--bi-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* ========== 移动端适配 ========== */
@media (max-width: 768px) {
  .card-thumb {
    height: 140px;
  }
}
</style>
