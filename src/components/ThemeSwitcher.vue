<template>
  <button
    class="theme-switcher"
    @click="toggle"
    :title="isLight ? '切换到深色主题' : '切换到浅色主题'"
  >
    <el-icon class="icon">
      <Sunny v-if="isLight" />
      <Moon v-else />
    </el-icon>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Sunny, Moon } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isLight = computed(() => themeStore.theme === 'light')

function toggle() {
  themeStore.toggle()
}
</script>

<style scoped lang="less">
.theme-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
  background: var(--bi-component-bg);
  border: 1px solid var(--bi-border-color);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
  color: var(--bi-text-secondary);

  &:hover {
    border-color: var(--bi-border-accent);
    background: var(--bi-component-hover-bg);
    color: var(--bi-accent);
  }

  .icon {
    font-size: 16px;
  }
}
</style>
