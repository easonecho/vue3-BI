<template>
  <div class="system-layout">
    <!-- 左侧菜单 -->
    <aside class="layout-aside">
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

      <el-menu :default-active="activeMenu" router class="layout-menu">
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

    <!-- 右侧主区域 -->
    <div class="layout-main-wrap">
      <header class="layout-header">
        <div class="header-left">
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
          <div class="clock-area">
            <el-icon class="clock-icon"><Clock /></el-icon>
            <span class="clock-text">{{ clockText }}</span>
          </div>
          <ThemeSwitcher />
          <LangSwitcher />
          <el-dropdown trigger="click" @command="handleUserCmd">
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

      <main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  DataBoard,
  Setting,
  User,
  UserFilled,
  OfficeBuilding,
  Coin,
  Link,
  Grid,
  ArrowDown,
  EditPen,
  SwitchButton,
  Menu,
  Monitor,
  Tools,
  Postcard,
  Timer,
  Cpu,
  Tickets,
  Document,
  Edit,
  Histogram,
  Clock,
  Files,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useMenuStore } from '@/stores/menu'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import LangSwitcher from '@/components/LangSwitcher.vue'
import type { MenuTreeNode } from '@/api/menu'

const route = useRoute()
const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const menuStore = useMenuStore()

const menuTree = computed<MenuTreeNode[]>(() => menuStore.menuTree as MenuTreeNode[])
const activeMenu = computed(() => route.path)

const MENU_TITLE: Record<string, string> = {
  '/dashboard': '看板管理',
  '/dashboard-templates': '模板库',
  '/system/users': '用户管理',
  '/system/roles': '角色管理',
  '/system/menus': '菜单管理',
  '/system/departments': '部门管理',
  '/system/datasources': '数据源管理',
  '/system/datasets': '数据集管理',
  '/system/dicts': '数据字典',
  '/system/logs': '操作日志',
  '/system/configs': '系统配置',
  '/system/positions': '岗位管理',
  '/system/scheduled-tasks': '定时任务',
  '/system/monitor': '系统监控',
}

function resolvePath(parentPath?: string | null, ...childPaths: (string | null | undefined)[]) {
  if (childPaths.length === 1) {
    const p = childPaths[0]
    if (!p) return parentPath || '/'
    if (p.startsWith('/')) return p.replace(/\/+/g, '/')
    return '/' + p.replace(/^\/+/, '')
  }
  const parts: string[] = []
  if (parentPath) parts.push(parentPath.replace(/^\/+|\/+$/g, ''))
  for (const p of childPaths) {
    if (!p) continue
    parts.push(p.replace(/^\/+|\/+$/g, ''))
  }
  let r = parts.join('/')
  return r.startsWith('/') ? r : '/' + r
}

function iconComp(iconName?: string) {
  if (!iconName || iconName === '#') return DataBoard
  const map: Record<string, any> = {
    DataBoard,
    Setting,
    User,
    UserFilled,
    OfficeBuilding,
    Coin,
    Link,
    Grid,
    Menu,
    Monitor,
    Edit,
    Histogram,
    Files,
  }
  return map[iconName] || DataBoard
}

const breadcrumbs = computed(() => {
  const crumbs: Array<{ title: string; path?: string }> = [{ title: '首页', path: '/dashboard' }]
  const title = MENU_TITLE[route.path]
  if (title && route.path !== '/dashboard') {
    crumbs.push({ title, path: route.path })
  }
  return crumbs
})

async function handleUserCmd(cmd: string) {
  if (cmd === 'logout') {
    await userStore.logout()
    router.replace('/login')
  } else if (cmd === 'editor') {
    router.push('/bi-editor')
  } else if (cmd === 'screen') {
    router.push('/screen/demo')
  }
}

// 实时时钟
const clockText = ref('')
let clockTimer: number | undefined
function updateClock() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  clockText.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}
onMounted(() => {
  updateClock()
  clockTimer = window.setInterval(updateClock, 1000)
})
onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
})
</script>

<style scoped lang="less">
.system-layout {
  position: relative;
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bi-bg);
}

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

/* 主区域 */
.layout-main-wrap {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  z-index: 1;
}

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

.layout-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
