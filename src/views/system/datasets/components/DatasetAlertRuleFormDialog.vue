<template>
  <el-dialog
    v-model="visible"
    :title="editingId ? '编辑告警规则' : '新增告警规则'"
    width="640px"
    append-to-body
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="96px">
      <el-form-item label="规则名称" prop="name">
        <el-input v-model="form.name" maxlength="100" placeholder="如: 日订单量低于 100 告警" />
      </el-form-item>
      <el-form-item label="统计方式" prop="aggregate">
        <el-select v-model="form.aggregate" style="width: 160px">
          <el-option
            v-for="opt in aggregateOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-if="form.aggregate !== 'count'"
          v-model="form.field"
          filterable
          allow-create
          default-first-option
          placeholder="选择字段"
          style="width: 220px; margin-left: 10px"
        >
          <el-option v-for="f in fieldOptions" :key="f" :label="f" :value="f" />
        </el-select>
      </el-form-item>
      <el-form-item label="阈值" prop="threshold">
        <el-select v-model="form.operator" style="width: 100px">
          <el-option
            v-for="opt in operatorOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-input-number
          v-model="form.threshold"
          :precision="2"
          :step="1"
          style="width: 180px; margin-left: 10px"
        />
      </el-form-item>
      <el-form-item label="执行周期" prop="cron">
        <el-select v-model="form.cron" filterable allow-create default-first-option style="width: 100%">
          <el-option v-for="opt in cronOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="Webhook">
        <el-input
          v-model="form.webhookUrl"
          maxlength="500"
          placeholder="可选，触发后 POST JSON 到该地址"
        />
      </el-form-item>
      <el-form-item label="启用">
        <el-switch v-model="form.enabled" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { AlertRule } from '@/api/alert'
import {
  AGGREGATE_OPTIONS,
  CRON_OPTIONS,
  OPERATOR_OPTIONS,
} from '../utils/dataset-alert-utils'
import { useDatasetAlertRuleForm } from '../composables/useDatasetAlertRuleForm'

const props = defineProps<{
  modelValue: boolean
  datasetId: number | null
  editing: AlertRule | null
  fieldOptions: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const { formRef, editingId, saving, form, formRules, initForm, saveForm } =
  useDatasetAlertRuleForm({
    getDatasetId: () => props.datasetId,
  })

const aggregateOptions = AGGREGATE_OPTIONS
const operatorOptions = OPERATOR_OPTIONS
const cronOptions = CRON_OPTIONS

watch(
  () => props.modelValue,
  (value) => {
    if (!value) return
    initForm(props.editing)
  },
)

async function handleSave() {
  if (!(await saveForm())) return
  visible.value = false
  emit('saved')
}
</script>
