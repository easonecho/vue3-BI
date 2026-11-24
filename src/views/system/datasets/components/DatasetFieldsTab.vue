<template>
  <div>
    <div style="margin-bottom: 12px">
      <el-button type="primary" size="small" @click="addField">
        <el-icon><Plus /></el-icon>&nbsp;{{ t('datasetPage.fields.add') }}
      </el-button>
      <el-button size="small" :disabled="!previewColumns.length" @click="autoDetectFields">
        {{ t('datasetPage.fields.autoDetect') }}
      </el-button>
      <span style="margin-left: 12px; color: #6b7280; font-size: 13px">
        {{ t('datasetPage.fields.hint') }}
      </span>
      <div style="color: #9ca3af; font-size: 12px; margin-top: 6px; line-height: 1.7">
        {{
          t('datasetPage.fields.expressionHint', {
            field: FIELD_REF,
            price: PRICE_REF,
            quantity: QUANTITY_REF,
          })
        }}
      </div>
    </div>
    <el-table :data="fields" size="small" border>
      <el-table-column :label="t('datasetPage.fields.colName')" width="140">
        <template #default="{ row }">
          <el-input
            v-model="row.name"
            size="small"
            :placeholder="t('datasetPage.fields.namePlaceholder')"
          />
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.fields.colAlias')" width="120">
        <template #default="{ row }">
          <el-input
            v-model="row.alias"
            size="small"
            :placeholder="t('datasetPage.fields.aliasPlaceholder')"
          />
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.fields.colType')" width="110">
        <template #default="{ row }">
          <el-select v-model="row.type" size="small" clearable style="width: 100%">
            <el-option :label="t('datasetPage.fieldType.string')" value="string" />
            <el-option :label="t('datasetPage.fieldType.number')" value="number" />
            <el-option :label="t('datasetPage.fieldType.date')" value="date" />
            <el-option :label="t('datasetPage.fieldType.datetime')" value="datetime" />
            <el-option :label="t('datasetPage.fieldType.boolean')" value="boolean" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.fields.colRole')" width="96" align="center">
        <template #default="{ row }">
          <el-select
            :model-value="row.role"
            size="small"
            :placeholder="t('datasetPage.fields.rolePlaceholder')"
            clearable
            style="width: 100%"
            @update:model-value="(v: string | undefined) => setFieldRole(row, v)"
          >
            <el-option :label="t('datasetPage.role.dimension')" value="dimension" />
            <el-option :label="t('datasetPage.role.measure')" value="measure" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column
        :label="t('datasetPage.fields.colDefaultAggregate')"
        width="110"
        align="center"
      >
        <template #default="{ row }">
          <el-select
            :model-value="row.defaultAggregate"
            size="small"
            :placeholder="t('datasetPage.fields.aggregatePlaceholder')"
            clearable
            :disabled="row.role === 'dimension'"
            style="width: 100%"
            @update:model-value="(v: string | undefined) => setFieldDefaultAggregate(row, v)"
          >
            <el-option
              v-for="opt in aggregateUiOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.fields.colFormat')" width="168">
        <template #default="{ row }">
          <div style="display: flex; gap: 4px">
            <el-select
              :model-value="row.format?.type"
              size="small"
              :placeholder="t('datasetPage.fields.formatPlaceholder')"
              clearable
              style="flex: 1"
              @update:model-value="(v: string | undefined) => setFieldFormat(row, v)"
            >
              <el-option
                v-for="opt in formatUiOptions"
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
      <el-table-column :label="t('datasetPage.fields.colVisible')" width="70" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.visible" size="small" />
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.fields.colComputed')" width="90" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.computed" size="small" />
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.fields.colExpression')" min-width="200">
        <template #default="{ row }">
          <el-input
            v-model="row.expression"
            size="small"
            :disabled="!row.computed"
            :placeholder="
              t('datasetPage.fields.expressionPlaceholder', {
                price: PRICE_REF,
                quantity: QUANTITY_REF,
              })
            "
          />
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.fields.colValidate')" width="70" align="center">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            :disabled="!row.computed || !row.expression"
            @click="validateExpr(row)"
            >{{ t('datasetPage.fields.colValidate') }}</el-button
          >
        </template>
      </el-table-column>
      <el-table-column :label="t('datasetPage.fields.colActions')" width="80" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" size="small" @click="removeField($index)">{{
            t('common.delete')
          }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty
      v-if="fields.length === 0"
      :description="t('datasetPage.fields.empty')"
      :image-size="60"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { type DatasetField, validateCalcExpression } from '@/api/dataset'

const { t, locale } = useI18n()

/** 表达式示例中的字段占位符 (避免在模板表达式中直接书写双大括号) */
const FIELD_REF = computed(() => (locale.value === 'en-US' ? '{{field}}' : '{{字段名}}'))
const PRICE_REF = '{{price}}'
const QUANTITY_REF = '{{quantity}}'

const props = defineProps<{
  /** 预览结果的列名 (用于自动检测) */
  previewColumns: string[]
  /** 预览结果的行数据 (用于字段语义推断) */
  previewRows: any[]
}>()

/** 字段列表 (与父级 form.fields 双向绑定) */
const fields = defineModel<DatasetField[]>('fields', { default: () => [] })

/** 语义层: 默认聚合选项 */
const aggregateUiOptions = computed(() => [
  { label: t('datasetPage.aggregateUi.none'), value: 'none' },
  { label: t('datasetPage.aggregateUi.sum'), value: 'sum' },
  { label: t('datasetPage.aggregateUi.avg'), value: 'avg' },
  { label: t('datasetPage.aggregateUi.count'), value: 'count' },
  { label: t('datasetPage.aggregateUi.countDistinct'), value: 'countDistinct' },
  { label: t('datasetPage.aggregateUi.max'), value: 'max' },
  { label: t('datasetPage.aggregateUi.min'), value: 'min' },
])

/** 语义层: 显示格式选项 */
const formatUiOptions = computed(() => [
  { label: t('datasetPage.formatUi.number'), value: 'number' },
  { label: t('datasetPage.formatUi.currency'), value: 'currency' },
  { label: t('datasetPage.formatUi.percent'), value: 'percent' },
  { label: t('datasetPage.formatUi.date'), value: 'date' },
  { label: t('datasetPage.formatUi.text'), value: 'text' },
])

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
  ElMessage.success(t('datasetPage.fields.added', { count: props.previewColumns.length }))
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
      ElMessage.success(t('datasetPage.fields.expressionValid'))
    } else {
      ElMessage.warning(r?.error || t('datasetPage.fields.expressionInvalid'))
    }
  } catch (e: any) {
    ElMessage.error(e?.message || t('datasetPage.fields.validateFailed'))
  }
}
</script>
