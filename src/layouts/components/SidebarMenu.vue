<template>
  <aside class="layout-aside" :class="{ 'is-mobile': isMobile, 'is-open': asideVisible }">
    <div class="logo-area">
      <div class="logo-mark">
        <svg viewBox="0 0 40 40" class="logo-svg">
          <rect x="6" y="6" width="12" height="12" rx="2" fill="var(--bi-accent)" opacity="0.9" />
          <rect x="22" y="6" width="12" height="12" rx="2" fill="var(--bi-accent)" opacity="0.45" />
          <rect x="6" y="22" width="12" height="12" rx="2" fill="var(--bi-accent)" opacity="0.55" />
          <rect x="22" y="22" width="12" height="12" rx="2" fill="var(--bi-accent)" opacity="0.25" />
        </svg>
      </div>
      <div class="logo-text">
        <span class="logo-title">{{ t('auth.welcome') }} BI</span>
        <span class="logo-sub">{{ t('auth.subtitle') }}</span>
      </div>
    </div>

    <div class="aside-divider" />

    <el-menu
      :default-active="activeMenu"
      router
      class="layout-menu"
      @select="emit('select')"
    >
      <template v-if="menuTree.length">
        <template v-for="m in menuTree" :key="m.id">
          <el-sub-menu
            v-if="m.children && m.children.length"
            :index="m.path || String(m.id)"
          >
            <template #title>
              <el-icon><component :is="iconComp(m.icon)" /></el-icon>
              <span>{{ m.name }}</span>
            </template>
            <template v-for="c in m.children" :key="c.id">
              <el-sub-menu
                v-if="c.children && c.children.length"
                :index="c.path || String(c.id)"
              >
                <template #title>
                  <el-icon><component :is="iconComp(c.icon)" /></el-icon>
                  <span>{{ c.name }}</span>
                </template>
                <el-menu-item
                  v-for="g in c.children"
                  :key="g.id"
                  :index="resolvePath(m.path, c.path, g.path)"
                >
                  <el-icon><component :is="iconComp(g.icon)" /></el-icon>
                  <span>{{ g.name }}</span>
                </el-menu-item>
              </el-sub-menu>
              <el-menu-item v-else :index="resolvePath(m.path, c.path)">
                <el-icon><component :is="iconComp(c.icon)" /></el-icon>
                <span>{{ c.name }}</span>
              </el-menu-item>
            </template>
          </el-sub-menu>
          <el-menu-item v-else :index="m.path || '/'">
            <el-icon><component :is="iconComp(m.icon)" /></el-icon>
            <span>{{ m.name }}</span>
          </el-menu-item>
        </template>
      </template>
      <!-- fallback: 静态菜单 -->
      <template v-else>
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>{{ t('menu.dashboard') }}</span>
        </el-menu-item>
        <el-menu-item index="/dashboard-templates">
          <el-icon><Files /></el-icon>
          <span>{{ t('menu.dashboardTemplates') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/users">
          <el-icon><User /></el-icon>
          <span>{{ t('menu.users') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/roles">
          <el-icon><UserFilled /></el-icon>
          <span>{{ t('menu.roles') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/menus">
          <el-icon><Menu /></el-icon>
          <span>{{ t('menu.menus') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/departments">
          <el-icon><OfficeBuilding /></el-icon>
          <span>{{ t('menu.departments') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/dicts">
          <el-icon><Tickets /></el-icon>
          <span>{{ t('menu.dicts') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/logs">
          <el-icon><Document /></el-icon>
          <span>{{ t('menu.logs') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/configs">
          <el-icon><Tools /></el-icon>
          <span>{{ t('menu.configs') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/positions">
          <el-icon><Postcard /></el-icon>
          <span>{{ t('menu.positions') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/scheduled-tasks">
          <el-icon><Timer /></el-icon>
          <span>{{ t('menu.scheduledTasks') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/usage">
          <el-icon><TrendCharts /></el-icon>
          <span>{{ t('menu.usage') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/monitor">
          <el-icon><Cpu /></el-icon>
          <span>{{ t('menu.monitor') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/datasources">
          <el-icon><Link /></el-icon>
          <span>{{ t('menu.datasources') }}</span>
        </el-menu-item>
        <el-menu-item index="/system/datasets">
          <el-icon><Grid /></el-icon>
          <span>{{ t('menu.datasets') }}</span>
        </el-menu-item>
      </template>
    </el-menu>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  DataBoard,
  Files,
  User,
  UserFilled,
  Menu,
  OfficeBuilding,
  Tickets,
  Document,
  Tools,
  Postcard,
  Timer,
  TrendCharts,
  Cpu,
  Link,
  Grid,
} from '@element-plus/icons-vue'
import type { MenuTreeNode } from '@/api/menu'
import { iconComp, resolvePath } from '../layout-menu-utils'

defineProps<{
  menuTree: MenuTreeNode[]
  activeMenu: string
  isMobile: boolean
  asideVisible: boolean
}>()

const emit = defineEmits<{
  (e: 'select'): void
}>()

const { t } = useI18n()
</script>

<style scoped lang="less">
/* 侧边栏 */
.layout-aside {
  position: relative;
  width: 220px;
  flex-shrink: 0;
  z-index: 2;
  background: var(--bi-panel-bg);
  border-right: 1px solid var(--bi-border-color);
  display: flex;
  flex-direction: column;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--bi-border-color);

  .logo-mark {
    width: 28px;
    height: 28px;
    flex-shrink: 0;

    .logo-svg {
      width: 100%;
      height: 100%;
    }
  }
  .logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
    min-width: 0;

    .logo-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--bi-text-primary);
      letter-spacing: 0.3px;
    }
    .logo-sub {
      font-size: 10px;
      color: var(--bi-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.aside-divider {
  height: 0;
}

.layout-menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 6px;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 38px;
    line-height: 38px;
    margin: 1px 0;
    border-radius: 6px;
    font-size: 13px;
  }
}

@media (max-width: 900px) {
  .layout-aside {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: 240px;
    z-index: 20;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    box-shadow: var(--bi-shadow-md);
  }

  .layout-aside.is-open {
    transform: translateX(0);
  }
}
</style>
