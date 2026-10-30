<template>
  <div>
    <div style="margin-bottom: 12px">
      <el-button type="primary" size="small" @click="addParam">
        <el-icon><Plus /></el-icon>&nbsp;新增参数
      </el-button>
      <span v-pre style="margin-left: 12px; color: #6b7280; font-size: 13px">
        在 SQL 中使用 {{ paramName }} 引用参数, 执行时动态替换
      </span>
    </div>
    <el-table :data="params" size="small" border>
      <el-table-column label="参数名" width="140">
        <template #default="{ row }">
          <el-input v-model="row.name" size="small" placeholder="如: startDate" />
        </template>
      </el-table-column>
      <el-table-column label="标签" width="120">
        <template #default="{ row }">
          <el-input v-model="row.label" size="small" placeholder="显示名" />
        </template>
      </el-table-column>
      <el-table-column label="类型" width="120">
        <template #default="{ row }">
          <el-select v-model="row.type" size="small" style="width: 100%">
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="日期" value="date" />
            <el-option label="日期时间" value="datetime" />
            <el-option label="布尔" value="boolean" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="默认值" width="140">
        <template #default="{ row }">
          <el-input v-model="row.defaultValue" size="small" placeholder="可选" />
        </template>
      </el-table-column>
      <el-table-column label="必填" width="80" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.required" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" size="small" @click="removeParam($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="params.length === 0" description="暂无参数, 点击上方新增" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import type { DatasetParam } from '@/api/dataset'

/** 参数列表 (与父级 form.params 双向绑定) */
const params = defineModel<DatasetParam[]>('params', { default: () => [] })

function addParam() {
  params.value = [
    ...params.value,
    { name: '', label: '', type: 'string', defaultValue: '', required: false },
  ]
}

function removeParam(idx: number) {
  const next = [...params.value]
  next.splice(idx, 1)
  params.value = next
}
</script>
