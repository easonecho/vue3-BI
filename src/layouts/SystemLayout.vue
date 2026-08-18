<template>
  <el-container class="system-layout">
    <!-- 左侧菜单 -->
    <el-aside width="220px" class="layout-aside">
      <div class="logo-area">
        <span class="logo-icon">📊</span>
        <span class="logo-text">BI 低代码平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#111827"
        text-color="#9ca3af"
        active-text-color="#60a5fa"
        class="layout-menu"
      >
        <template v-if="menuTree.length">
          <template v-for="m in menuTree" :key="m.id">
            <el-sub-menu v-if="m.children && m.children.length" :index="m.path || String(m.id)">
              <template #title>
                <el-icon><component :is="iconComp(m.icon)" /></el-icon>
                <span>{{ m.name }}</span>
              </template>
              <template v-for="c in m.children" :key="c.id">
                <el-sub-menu v-if="c.children && c.children.length" :index="c.path || String(c.id)">
                  <template #title>
                    <el-icon><component :is="iconComp(c.icon)" /></el-icon>
                    <span>{{ c.name }}</span>
                  </template>
                  <el-menu-item v-for="g in c.children" :key="g.id" :index="resolvePath(m.path, c.path, g.path)">
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
            <span>看板管理</span>
          </el-menu-item>
          <el-sub-menu index="system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/system/users">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/system/roles">
              <el-icon><UserFilled /></el-icon>
              <span>角色管理</span>
            </el-menu-item>
            <el-menu-item index="/system/menus">
              <el-icon><Menu /></el-icon>
              <span>菜单管理</span>
            </el-menu-item>
            <el-menu-item index="/system/departments">
              <el-icon><OfficeBuilding /></el-icon>
              <span>部门管理</span>
            </el-menu-item>
            <el-menu-item index="/system/dicts">
              <el-icon><Tickets /></el-icon>
              <span>数据字典</span>
            </el-menu-item>
            <el-menu-item index="/system/logs">
              <el-icon><Document /></el-icon>
              <span>操作日志</span>
            </el-menu-item>
            <el-menu-item index="/system/configs">
              <el-icon><Tools /></el-icon>
              <span>系统配置</span>
            </el-menu-item>
            <el-menu-item index="/system/positions">
              <el-icon><Postcard /></el-icon>
              <span>岗位管理</span>
            </el-menu-item>
            <el-menu-item index="/system/scheduled-tasks">
              <el-icon><Timer /></el-icon>
              <span>定时任务</span>
            </el-menu-item>
            <el-menu-item index="/system/monitor">
              <el-icon><Cpu /></el-icon>
              <span>系统监控</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="data">
            <template #title>
              <el-icon><Coin /></el-icon>
              <span>数据管理</span>
            </template>
            <el-menu-item index="/system/datasources">
              <el-icon><Link /></el-icon>
              <span>数据源管理</span>
            </el-menu-item>
            <el-menu-item index="/system/datasets">
              <el-icon><Grid /></el-icon>
              <span>数据集管理</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>

    <!-- 右侧主区域 -->
    <el-container>
      <el-header class="layout-header">
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
          <el-dropdown trigger="click" @command="handleUserCmd">
            <div class="user-info">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar">
                {{ userStore.userInfo?.nickname?.[0] || userStore.userInfo?.username?.[0] || 'U' }}
              </el-avatar>
              <span class="user-name">
                {{ userStore.userInfo?.nickname || userStore.userInfo?.username || '用户' }}
              </span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="editor">
                  <el-icon><EditPen /></el-icon>&nbsp;进入看板编辑器
                </el-dropdown-item>
                <el-dropdown-item command="screen">
                  <el-icon><Monitor /></el-icon>&nbsp;数据大屏
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>&nbsp;退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, h, resolveComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataBoard, Setting, User, UserFilled, OfficeBuilding, Coin, Link, Grid,
  ArrowDown, EditPen, SwitchButton, Menu, Monitor,
  Tools, Postcard, Timer, Cpu, Tickets, Document,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useMenuStore } from '@/stores/menu'
import type { MenuTreeNode } from '@/api/menu'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const menuStore = useMenuStore()

const menuTree = computed<MenuTreeNode[]>(() => menuStore.menuTree as MenuTreeNode[])
const activeMenu = computed(() => route.path)

const MENU_TITLE: Record<string, string> = {
  '/dashboard': '看板管理',
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
  // 如果只有一个 childPath，直接标准化它
  if (childPaths.length === 1) {
    const p = childPaths[0]
    if (!p) return parentPath || '/'
    if (p.startsWith('/')) return p.replace(/\/+/g, '/')
    // 子路径如 'system/users' 直接加前导 /
    return '/' + p.replace(/^\/+/, '')
  }
  // 多级拼接
  const parts: string[] = []
  if (parentPath) parts.push(parentPath.replace(/^\/+|\/+$/g, ''))
  for (const p of childPaths) {
    if (!p) continue
    parts.push(p.replace(/^\/+|\/+$/g, ''))
  }
  let r = parts.join('/')
  return r.startsWith('/') ? r : '/' + r
}

/** 动态图标渲染: 用已注册的 Element Plus 图标名 */
function iconComp(iconName?: string) {
  if (!iconName || iconName === '#') return DataBoard
  // 尝试从全局组件解析
  const comp = resolveComponent(iconName)
  if (comp && typeof comp !== 'string') return comp
  // fallback 映射
  const map: Record<string, any> = {
    DataBoard, Setting, User, UserFilled, OfficeBuilding, Coin, Link, Grid, Menu, Monitor,
  }
  return map[iconName] || DataBoard
}

const breadcrumbs = computed(() => {
  const crumbs: Array<{ title: string; path?: string }> = [{ title: '首页', path: '/dashboard' }]
  const title = MENU_TITLE[route.path]
  if (title && route.path !== '/dashboard') {
    if (route.path.startsWith('/system/')) {
      crumbs.push({ title: '系统管理' })
    }
    crumbs.push({ title, path: route.path })
  }
  return crumbs
})

function handleUserCmd(cmd: string) {
  if (cmd === 'logout') {
    userStore.logout()
    router.replace('/login')
  } else if (cmd === 'editor') {
    router.push('/bi-editor')
  } else if (cmd === 'screen') {
    router.push('/screen/demo')
  }
}
</script>

<style scoped lang="less">
.system-layout {
  height: 100vh;
  width: 100vw;
  background: #f3f4f6;
}

.layout-aside {
  background: #111827;
  color: #f3f4f6;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo-area {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #1f2937;
  flex-shrink: 0;

  .logo-icon {
    font-size: 22px;
    margin-right: 8px;
  }
  .logo-text {
    font-size: 15px;
    font-weight: 600;
    color: #f9fafb;
    white-space: nowrap;
  }
}

.layout-menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 44px;
    line-height: 44px;
  }
  :deep(.el-menu-item.is-active) {
    background: rgba(96, 165, 250, 0.08);
  }
}

.layout-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.header-right {
  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.15s;

    &:hover {
      background: #f3f4f6;
    }
    .user-name {
      font-size: 14px;
      color: #374151;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .el-icon {
      color: #6b7280;
      font-size: 12px;
    }
  }
}

.layout-main {
  padding: 20px;
  overflow-y: auto;
  background: #f3f4f6;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
