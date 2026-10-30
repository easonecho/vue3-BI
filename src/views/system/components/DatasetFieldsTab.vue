<template>
  <div>
    <div style="margin-bottom: 12px">
      <el-button type="primary" size="small" @click="addField">
        <el-icon><Plus /></el-icon>&nbsp;新增字段
      </el-button>
      <el-button size="small" :disabled="!previewColumns.length" @click="autoDetectFields">
        从预览结果自动检测
      </el-button>
      <span v-pre style="margin-left: 12px; color: #6b7280; font-size: 13px">
        配置字段别名、类型转换、计算字段
      </span>
      <div v-pre style="color: #9ca3af; font-size: 12px; margin-top: 6px; line-height: 1.7">
        计算字段表达式支持: 算术 (+ - * / % ^)、比较 (= != > >= &lt; &lt;=)、逻辑 (and or not)、三元
        (cond ? a : b); 函数: ABS ROUND CEIL FLOOR SQRT POW MIN MAX IF COALESCE NULLIF CONCAT LEFT
        RIGHT LEN UPPER LOWER TRIM SUBSTRING REPLACE CONTAINS STARTSWITH ENDSWITH YEAR MONTH DAY
        DATEDIFF NOW NUMBER STRING DATE; 字段名直接书写或用
        {{字段名}} 引用, 例如: ROUND({{price}} * {{quantity}}, 2)
      </div>
    </div>
    <el-table :data="fields" size="small" border>
      <el-table-column label="字段名" width="140">
        <template #default="{ row }">
          <el-input v-model="row.name" size="small" placeholder="如: price" />
        </template>
      </el-table-column>
      <el-table-column label="别名" width="120">
        <template #default="{ row }">
          <el-input v-model="row.alias" size="small" placeholder="显示名" />
        </template>
      </el-table-column>
      <el-table-column label="类型" width="110">
        <template #default="{ row }">
          <el-select v-model="row.type" size="small" clearable style="width: 100%">
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="日期" value="date" />
            <el-option label="日期时间" value="datetime" />
            <el-option label="布尔" value="boolean" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="语义角色" width="96" align="center">
        <template #default="{ row }">
          <el-select
            :model-value="row.role"
            size="small"
            placeholder="未设置"
            clearable
            style="width: 100%"
            @update:model-value="(v: string | undefined) => setFieldRole(row, v)"
          >
            <el-option label="维度" value="dimension" />
            <el-option label="度量" value="measure" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="默认聚合" width="110" align="center">
        <template #default="{ row }">
          <el-select
            :model-value="row.defaultAggregate"
            size="small"
            placeholder="不聚合"
            clearable
            :disabled="row.role === 'dimension'"
            style="width: 100%"
            @update:model-value="(v: string | undefined) => setFieldDefaultAggregate(row, v)"
          >
            <el-option
              v-for="opt in AGGREGATE_UI_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="显示格式" width="168">
        <template #default="{ row }">
          <div style="display: flex; gap: 4px">
            <el-select
              :model-value="row.format?.type"
              size="small"
              placeholder="默认"
              clearable
              style="flex: 1"
              @update:model-value="(v: string | undefined) => setFieldFormat(row, v)"
            >
              <el-option
                v-for="opt in FORMAT_UI_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-input-number
              v-if="
                row.format?.type === 'number' ||
                row.format?.type === 'currency' ||
                row.format?.type === 'percent'
              "
              :model-value="row.format?.decimals"
              size="small"
              :min="0"
              :max="6"
              controls-position="right"
              style="width: 74px"
              @update:model-value="(v: number | undefined) => setFieldDecimals(row, v)"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="可见" width="70" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.visible" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="计算字段" width="90" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.computed" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="表达式" min-width="200">
        <template #default="{ row }">
          <el-input
            v-model="row.expression"
            size="small"
            :disabled="!row.computed"
            placeholder="如: {{price}} * {{quantity}}"
          />
        </template>
      </el-table-column>
      <el-table-column label="校验" width="70" align="center">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            :disabled="!row.computed || !row.expression"
            @click="validateExpr(row)"
            >校验</el-button
          >
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" size="small" @click="removeField($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty
      v-if="fields.length === 0"
      description="暂无字段配置, 可从预览结果自动检测"
      :image-size="60"
    />
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { type DatasetField, validateCalcExpression } from '@/api/dataset'

const props = defineProps<{
  /** 预览结果的列名 (用于自动检测) */
  previewColumns: string[]
  /** 预览结果的行数据 (用于字段语义推断) */
  previewRows: any[]
}>()

/** 字段列表 (与父级 form.fields 双向绑定) */
const fields = defineModel<DatasetField[]>('fields', { default: () => [] })

/** 语义层: 默认聚合选项 */
const AGGREGATE_UI_OPTIONS = [
  { label: '不聚合', value: 'none' },
  { label: '求和', value: 'sum' },
  { label: '平均值', value: 'avg' },
  { label: '计数', value: 'count' },
  { label: '去重计数', value: 'countDistinct' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
]

/** 语义层: 显示格式选项 */
const FORMAT_UI_OPTIONS = [
  { label: '数值', value: 'number' },
  { label: '货币', value: 'currency' },
  { label: '百分比', value: 'percent' },
  { label: '日期', value: 'date' },
  { label: '文本', value: 'text' },
]

function setFieldRole(row: DatasetField, role?: string) {
  row.role = (role || undefined) as DatasetField['role']
  // 维度不参与聚合; 度量未设置默认聚合时给出常用默认值
  if (!row.role) {
    row.defaultAggregate = undefined
  } else if (row.role === 'dimension') {
    row.defaultAggregate = 'none'
  } else if (!row.defaultAggregate || row.defaultAggregate === 'none') {
    row.defaultAggregate = 'sum'
  }
}

function setFieldDefaultAggregate(row: DatasetField, value?: string) {
  row.defaultAggregate = (value || undefined) as DatasetField['defaultAggregate']
}

function setFieldFormat(row: DatasetField, type?: string) {
  if (!type) {
    row.format = undefined
    return
  }
  row.format = {
    ...row.format,
    type: type as NonNullable<DatasetField['format']>['type'],
  }
  if (['number', 'currency', 'percent'].includes(type) && row.format.decimals === undefined) {
    row.format.decimals = type === 'percent' ? 1 : 2
  }
}

function setFieldDecimals(row: DatasetField, decimals?: number) {
  row.format = { ...row.format, decimals: decimals ?? undefined }
}

/** 根据预览数据首行非空值推断列语义 (数字 → 度量/求和, 其余 → 维度) */
function inferFieldSemantic(col: string): Partial<DatasetField> {
  const sample = props.previewRows
    .slice(0, 20)
    .map((r) => r?.[col])
    .find((v) => v !== null && v !== undefined && v !== '')
  const numeric =
    typeof sample === 'number' ||
    (typeof sample === 'string' && sample.trim() !== '' && Number.isFinite(Number(sample)))
  return numeric
    ? { type: 'number', role: 'measure', defaultAggregate: 'sum' }
    : { type: 'string', role: 'dimension', defaultAggregate: 'none' }
}

function addField() {
  fields.value = [
    ...fields.value,
    {
      name: '',
      alias: '',
      type: 'string',
      visible: true,
      computed: false,
      expression: '',
      role: 'dimension',
      defaultAggregate: 'none',
    },
  ]
}

function removeField(idx: number) {
  const next = [...fields.value]
  next.splice(idx, 1)
  fields.value = next
}

function autoDetectFields() {
  if (!props.previewColumns.length) return
  const next = [...fields.value]
  const existingNames = next.map((f) => f.name)
  for (const col of props.previewColumns) {
    if (!existingNames.includes(col)) {
      next.push({
        name: col,
        alias: '',
        visible: true,
        computed: false,
        ...inferFieldSemantic(col),
      })
    }
  }
  fields.value = next
  ElMessage.success(`已添加 ${props.previewColumns.length} 个字段`)
}

// ---------- 计算字段表达式校验 ----------
async function validateExpr(row: DatasetField) {
  if (!row.expression) return
  // 可用字段 = 原始字段 (预览列) + 非计算字段别名
  const baseFields = new Set<string>(props.previewColumns)
  for (const f of fields.value || []) {
    if (!f.computed) {
      if (f.name) baseFields.add(f.name)
      if (f.alias) baseFields.add(f.alias)
    }
  }
  try {
    const res = await validateCalcExpression(row.expression, [...baseFields])
    const r = res.data
    if (r?.valid) {
      ElMessage.success('表达式有效')
    } else {
      ElMessage.warning(r?.error || '表达式无效')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '校验请求失败')
  }
}
</script>
