<template>
  <div class="filter-bar">
    <el-input
      v-model="keyword"
      placeholder="搜索素材名称"
      clearable
      style="width: 220px"
      :prefix-icon="Search"
      @keyup.enter="emit('search')"
      @clear="emit('search')"
    />
    <el-select
      v-model="materialType"
      placeholder="按类型筛选"
      clearable
      style="width: 160px"
      @change="emit('search')"
    >
      <el-option label="视频" value="video" />
      <el-option label="图片" value="image" />
      <el-option label="装饰" value="decor" />
    </el-select>
    <el-button type="primary" @click="emit('search')">
      <el-icon><Search /></el-icon>&nbsp;查询
    </el-button>
    <el-button @click="emit('reset')">
      <el-icon><Refresh /></el-icon>&nbsp;重置
    </el-button>
    <div class="spacer" />
    <el-button type="success" @click="emit('upload')">
      <el-icon><Upload /></el-icon>&nbsp;上传素材
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { Refresh, Search, Upload } from '@element-plus/icons-vue'
import type { MaterialType } from '@/api/material'

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
