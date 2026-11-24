<template>
  <el-dialog
    v-model="visible"
    :title="
      editingId ? t('datasetPage.alertForm.editTitle') : t('datasetPage.alertForm.createTitle')
    "
    width="640px"
    append-to-body
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="96px">
      <el-form-item :label="t('datasetPage.alertForm.nameLabel')" prop="name">
        <el-input
          v-model="form.name"
          maxlength="100"
          :placeholder="t('datasetPage.alertForm.namePlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('datasetPage.alertForm.aggregateLabel')" prop="aggregate">
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
          :placeholder="t('datasetPage.alertForm.fieldPlaceholder')"
          style="width: 220px; margin-left: 10px"
        >
          <el-option v-for="f in fieldOptions" :key="f" :label="f" :value="f" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('datasetPage.alertForm.thresholdLabel')" prop="threshold">
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
      <el-form-item :label="t('datasetPage.alertForm.cronLabel')" prop="cron">
        <el-select
          v-model="form.cron"
          filterable
          allow-create
          default-first-option
          style="width: 100%"
        >
          <el-option
            v-for="opt in cronOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Webhook">
        <el-input
          v-model="form.webhookUrl"
          maxlength="500"
          :placeholder="t('datasetPage.alertForm.webhookPlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('datasetPage.alertForm.enabledLabel')">
        <el-switch v-model="form.enabled" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">{{
        t('common.save')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AlertRule } from '@/api/alert'
import { AGGREGATE_OPTIONS, CRON_OPTIONS, OPERATOR_OPTIONS } from '../utils/dataset-alert-utils'
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

const { formRef, editingId, saving, form, formRules, initForm, saveForm } = useDatasetAlertRuleForm(
  {
    getDatasetId: () => props.datasetId,
  },
)

const aggregateOptions = AGGREGATE_OPTIONS
const operatorOptions = OPERATOR_OPTIONS
const cronOptions = CRON_OPTIONS

const { t } = useI18n()

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
