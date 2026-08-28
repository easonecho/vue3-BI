<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <button class="lang-switcher" :title="t('layout.language')">
      <el-icon class="icon"><Promotion /></el-icon>
      <span class="lang-label">{{ currentLabel }}</span>
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="opt in localeOptions"
          :key="opt.value"
          :command="opt.value"
          :class="{ 'is-active': opt.value === locale }"
        >
          {{ opt.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Promotion } from '@element-plus/icons-vue'
import { useLang } from '@/i18n/composables'

const { t } = useI18n()
const { locale, setLocale } = useLang()

const localeOptions = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: 'English' },
]

const currentLabel = computed(() => {
  const opt = localeOptions.find((o) => o.value === locale.value)
  return opt ? opt.label : locale.value
})

function handleCommand(val: string) {
  setLocale(val)
}
</script>

<style scoped lang="less">
.lang-switcher {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  background: var(--bi-component-bg);
  border: 1px solid var(--bi-border-color);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
  color: var(--bi-text-secondary);
  font-size: 12px;

  &:hover {
    border-color: var(--bi-border-accent);
    background: var(--bi-component-hover-bg);
    color: var(--bi-accent);
  }

  .icon {
    font-size: 14px;
  }

  .lang-label {
    font-weight: 500;
  }
}
</style>
