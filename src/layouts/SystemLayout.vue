<template>
  <div class="system-layout">
    <SidebarMenu
      :menu-tree="menuTree"
      :active-menu="activeMenu"
      :is-mobile="isMobile"
      :aside-visible="asideVisible"
      @select="handleMenuSelect"
    />

    <!-- 移动端抽屉遮罩 -->
    <div v-if="isMobile && asideVisible" class="layout-mask" @click="closeAside" />

    <!-- 右侧主区域 -->
    <div class="layout-main-wrap">
      <LayoutHeader
        :is-mobile="isMobile"
        :aside-visible="asideVisible"
        :breadcrumbs="breadcrumbs"
        :clock-text="clockText"
        @toggle-aside="toggleAside"
        @open-search="searchVisible = true"
        @user-command="handleUserCmd"
      />

      <main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 全局搜索：Ctrl/Cmd + K 唤起 -->
    <GlobalSearchDialog v-model="searchVisible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useMenuStore } from '@/stores/menu'
import SidebarMenu from './components/SidebarMenu.vue'
import LayoutHeader from './components/LayoutHeader.vue'
import GlobalSearchDialog from './components/GlobalSearchDialog.vue'
import { useSystemLayout } from './composables/useSystemLayout'
import type { MenuTreeNode } from '@/api/menu'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const menuStore = useMenuStore()

const menuTree = computed<MenuTreeNode[]>(() => menuStore.menuTree as MenuTreeNode[])

const {
  activeMenu,
  isMobile,
  asideVisible,
  breadcrumbs,
  clockText,
  attach,
  detach,
  handleMenuSelect,
  toggleAside,
  closeAside,
  handleUserCmd,
} = useSystemLayout({
  getPath: () => route.path,
  logout: () => userStore.logout(),
  replace: (path) => router.replace(path),
  push: (path) => router.push(path),
})

const searchVisible = ref(false)

/** Ctrl/Cmd + K 打开全局搜索 */
function handleGlobalSearchShortcut(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchVisible.value = true
  }
}

onMounted(() => {
  attach()
  window.addEventListener('keydown', handleGlobalSearchShortcut)
})

onBeforeUnmount(() => {
  detach()
  window.removeEventListener('keydown', handleGlobalSearchShortcut)
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

/* 主区域 */
.layout-main-wrap {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  z-index: 1;
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

/* ========== 移动端适配 ========== */
.layout-mask {
  position: fixed;
  inset: 0;
  z-index: 19;
  background: rgba(0, 0, 0, 0.5);
}

@media (max-width: 900px) {
  .layout-main {
    padding: 12px;
  }
}
</style>
