<template>
  <el-dialog
    v-model="visible"
    :title="t('layout.globalSearch')"
    width="min(560px, 92vw)"
    append-to-body
    class="global-search-dialog"
    @opened="handleOpened"
    @closed="handleClosed"
  >
    <el-input
      ref="inputRef"
      :model-value="keyword"
      :placeholder="t('layout.globalSearchPlaceholder')"
      clearable
      @input="setKeyword"
      @keydown.down.prevent="moveActive(1)"
      @keydown.up.prevent="moveActive(-1)"
      @keydown.enter.prevent="openActive"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>

    <div class="search-body">
      <div v-if="loading" class="search-hint">{{ t('layout.searching') }}</div>
      <ul v-else-if="results.length" class="search-list">
        <li v-for="(item, index) in results" :key="item.id">
          <button
            type="button"
            class="search-item"
            :class="{ active: index === activeIndex }"
            @mouseenter="activeIndex = index"
            @click="open(item.id)"
          >
            <span class="item-main">
              <span class="item-name">{{ item.name }}</span>
              <span v-if="item.description" class="item-desc">{{ item.description }}</span>
            </span>
            <span v-if="item.recent" class="item-tag">{{ t('layout.recent') }}</span>
          </button>
        </li>
      </ul>
      <div v-else class="search-hint">
        {{ hasQuery ? t('layout.noMatch') : t('layout.noRecent') }}
      </div>
    </div>

    <template #footer>
      <span class="search-foot">{{ t('layout.searchFoot') }}</span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { getDashboardList } from '@/api/dashboard'
import { readRecentDashboards } from '@/utils/recent-dashboards'
import { useGlobalSearch } from '../composables/useGlobalSearch'

const visible = defineModel<boolean>({ required: true })

const { t } = useI18n()
const router = useRouter()
const inputRef = ref<{ focus: () => void } | null>(null)

const {
  keyword,
  results,
  loading,
  activeIndex,
  hasQuery,
  setKeyword,
  refreshRecent,
  moveActive,
  selectActive,
  reset,
} = useGlobalSearch({
  fetchDashboards: async (query) => {
    const res = await getDashboardList({ keyword: query, page: 1, pageSize: 8 })
    return res.data.list.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
    }))
  },
  readRecent: readRecentDashboards,
})

function handleOpened() {
  refreshRecent()
  inputRef.value?.focus()
}

function handleClosed() {
  reset()
}

function open(id: number) {
  visible.value = false
  void router.push(`/preview/${id}`)
}

function openActive() {
  const id = selectActive()
  if (id !== null) open(id)
}

onBeforeUnmount(reset)
</script>

<style scoped lang="less">
.search-body {
  margin-top: 12px;
  max-height: 320px;
  overflow-y: auto;
}

.search-hint {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--bi-text-muted);
}

.search-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.search-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--bi-text-primary);
  text-align: left;
  cursor: pointer;

  &.active,
  &:hover {
    background: var(--bi-component-hover-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--bi-accent);
    outline-offset: -2px;
  }
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.item-desc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--bi-text-muted);
}

.item-tag {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--bi-component-bg);
  border: 1px solid var(--bi-border-color);
  font-size: 11px;
  line-height: 18px;
  color: var(--bi-text-muted);
}

.search-foot {
  font-size: 12px;
  color: var(--bi-text-muted);
}
</style>
