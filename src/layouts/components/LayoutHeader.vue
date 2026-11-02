<template>
  <header class="layout-header">
    <div class="header-left">
      <el-button
        v-if="isMobile"
        class="menu-toggle"
        text
        :aria-label="asideVisible ? '收起菜单' : '展开菜单'"
        @click="emit('toggle-aside')"
      >
        <el-icon :size="18"><Expand /></el-icon>
      </el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item
          v-for="(item, idx) in breadcrumbs"
          :key="idx"
          :to="idx < breadcrumbs.length - 1 ? item.path : undefined"
        >
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="header-right">
      <div v-if="!isMobile" class="clock-area">
        <el-icon class="clock-icon"><Clock /></el-icon>
        <span class="clock-text">{{ clockText }}</span>
      </div>
      <ThemeSwitcher />
      <LangSwitcher />
      <el-dropdown trigger="click" @command="emit('user-command', $event)">
        <div class="user-info">
          <el-avatar :size="28" :src="userStore.userInfo?.avatar">
            {{ userStore.userInfo?.nickname?.[0] || userStore.userInfo?.username?.[0] || 'U' }}
          </el-avatar>
          <span class="user-name">
            {{ userStore.userInfo?.nickname || userStore.userInfo?.username || t('layout.user') }}
          </span>
          <el-icon class="arrow-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="editor">
              <el-icon><EditPen /></el-icon>&nbsp;{{ t('layout.enterEditor') }}
            </el-dropdown-item>
            <el-dropdown-item command="screen">
              <el-icon><Monitor /></el-icon>&nbsp;{{ t('layout.dataScreen') }}
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>&nbsp;{{ t('auth.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Expand, Clock, ArrowDown, EditPen, Monitor, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import LangSwitcher from '@/components/LangSwitcher.vue'
import type { BreadcrumbItem } from '../layout-menu-utils'

defineProps<{
  isMobile: boolean
  asideVisible: boolean
  breadcrumbs: BreadcrumbItem[]
  clockText: string
}>()

const emit = defineEmits<{
  (e: 'toggle-aside'): void
  (e: 'user-command', cmd: string): void
}>()

const { t } = useI18n()
const userStore = useUserStore()
</script>

<style scoped lang="less">
.layout-header {
  flex-shrink: 0;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--bi-header-bg);
  border-bottom: 1px solid var(--bi-border-color);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;

  .clock-area {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 6px;
    background: var(--bi-component-bg);
    border: 1px solid var(--bi-border-color);

    .clock-icon {
      color: var(--bi-text-muted);
      font-size: 13px;
    }
    .clock-text {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 12px;
      color: var(--bi-text-secondary);
      font-variant-numeric: tabular-nums;
    }
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 10px 4px 4px;
  border-radius: 18px;
  background: var(--bi-component-bg);
  border: 1px solid var(--bi-border-color);
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: var(--bi-border-accent);
    background: var(--bi-component-hover-bg);
  }

  :deep(.el-avatar) {
    background: var(--bi-accent);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
  }
  .user-name {
    font-size: 13px;
    color: var(--bi-text-primary);
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .arrow-icon {
    color: var(--bi-text-muted);
    font-size: 10px;
  }
}

@media (max-width: 900px) {
  .layout-header {
    padding: 0 12px;
  }

  .header-right {
    gap: 8px;
  }

  .header-left {
    min-width: 0;
    overflow: hidden;
  }

  .user-info {
    padding-right: 6px;

    .user-name {
      display: none;
    }
  }

  .menu-toggle {
    margin-right: 2px;
    padding: 4px;
  }
}
</style>
