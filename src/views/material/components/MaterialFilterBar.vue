<template>
  <div class="filter-bar">
    <el-input
      v-model="keyword"
      :placeholder="t('materialPage.searchPlaceholder')"
      clearable
      style="width: 220px"
      :prefix-icon="Search"
      @keyup.enter="emit('search')"
      @clear="emit('search')"
    />
    <el-select
      v-model="materialType"
      :placeholder="t('materialPage.typeFilterPlaceholder')"
      clearable
      style="width: 160px"
      @change="emit('search')"
    >
      <el-option :label="t('materialPage.typeVideo')" value="video" />
      <el-option :label="t('materialPage.typeImage')" value="image" />
      <el-option :label="t('materialPage.typeDecor')" value="decor" />
    </el-select>
    <el-button type="primary" @click="emit('search')">
      <el-icon><Search /></el-icon>&nbsp;{{ t('materialPage.query') }}
    </el-button>
    <el-button @click="emit('reset')">
      <el-icon><Refresh /></el-icon>&nbsp;{{ t('materialPage.reset') }}
    </el-button>
    <div class="spacer" />
    <el-button type="success" @click="emit('upload')">
      <el-icon><Upload /></el-icon>&nbsp;{{ t('materialPage.upload') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { Refresh, Search, Upload } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { MaterialType } from '@/api/material'

const { t } = useI18n()

const emit = defineEmits<{
  search: []
  reset: []
  upload: []
}>()

const keyword = defineModel<string>('keyword', { required: true })
const materialType = defineModel<'' | MaterialType>('materialType', { required: true })
</script>

<style scoped lang="less">
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  .spacer {
    flex: 1;
  }
}
</style>
