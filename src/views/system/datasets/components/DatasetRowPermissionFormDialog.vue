<template>
  <el-dialog
    v-model="visible"
    :title="
      editingId
        ? t('datasetPage.rowPermissionForm.editTitle')
        : t('datasetPage.rowPermissionForm.createTitle')
    "
    width="660px"
    append-to-body
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="96px">
      <el-form-item :label="t('datasetPage.rowPermissionForm.nameLabel')" prop="name">
        <el-input
          v-model="form.name"
          maxlength="100"
          :placeholder="t('datasetPage.rowPermissionForm.namePlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('datasetPage.rowPermissionForm.subjectLabel')" prop="subjectType">
        <el-radio-group v-model="form.subjectType" @change="form.subjectId = undefined">
          <el-radio-button value="all">{{
            t('datasetPage.rowPermissionForm.subjectAll')
          }}</el-radio-button>
          <el-radio-button value="role">{{
            t('datasetPage.rowPermissionForm.subjectRole')
          }}</el-radio-button>
          <el-radio-button value="user">{{
            t('datasetPage.rowPermissionForm.subjectUser')
          }}</el-radio-button>
          <el-radio-button value="dept">{{
            t('datasetPage.rowPermissionForm.subjectDept')
          }}</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="form.subjectType !== 'all'"
        :label="t('datasetPage.rowPermissionForm.subjectIdLabel')"
        prop="subjectId"
      >
        <el-select
          v-model="form.subjectId"
          filterable
          :placeholder="t('datasetPage.rowPermissionForm.subjectIdPlaceholder')"
          style="width: 100%"
        >
          <el-option
            v-for="opt in subjectOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('datasetPage.rowPermissionForm.conditionsLabel')" required>
        <div class="cond-list">
          <div v-for="(cond, idx) in form.conditions" :key="idx" class="cond-row">
            <el-input
              v-model="cond.field"
              size="small"
              :placeholder="t('datasetPage.rowPermissionForm.fieldPlaceholder')"
              style="width: 150px"
            />
            <el-select v-model="cond.operator" size="small" style="width: 140px">
              <el-option
                v-for="op in operatorOptions"
                :key="op.value"
                :label="op.label"
                :value="op.value"
              />
            </el-select>
            <el-input
              v-if="needsValue(cond.operator)"
              v-model="cond.valueText"
              size="small"
              style="flex: 1; min-width: 180px"
              :placeholder="
                t('datasetPage.rowPermissionForm.valuePlaceholder', {
                  placeholders: '{userId}/{username}/{deptId}',
                })
              "
            />
            <el-button
              link
              type="danger"
              size="small"
              :disabled="form.conditions.length <= 1"
              @click="removeCondition(idx)"
            >
              {{ t('common.delete') }}
            </el-button>
          </div>
          <el-button size="small" @click="addCondition">{{
            t('datasetPage.rowPermissionForm.addCondition')
          }}</el-button>
        </div>
      </el-form-item>

      <el-form-item :label="t('datasetPage.rowPermissionForm.priorityLabel')">
        <el-input-number v-model="form.priority" :min="0" :max="9999" controls-position="right" />
        <span class="rls-hint" style="margin-left: 10px">{{
          t('datasetPage.rowPermissionForm.priorityHint')
        }}</span>
      </el-form-item>
      <el-form-item :label="t('datasetPage.rowPermissionForm.enabledLabel')">
        <el-switch v-model="form.enabled" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="submitForm">{{
        t('datasetPage.confirm')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  type RowPermission,
  type RowPermissionOptions,
  createRowPermission,
  updateRowPermission,
} from '@/api/dataset'
import {
  type RowPermissionFormState,
  OPERATOR_OPTIONS,
  buildConditions,
  buildSubjectOptions,
  createEmptyCondition,
  createEmptyForm,
  formToPayload,
  needsValue,
  ruleToForm,
} from '../utils/row-permission-utils'

const props = defineProps<{
  modelValue: boolean
  datasetId: number
  options: RowPermissionOptions
  /** 传入已有规则表示编辑，null 表示新增 */
  rule: RowPermission | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const operatorOptions = OPERATOR_OPTIONS

const { t } = useI18n()

const editingId = computed(() => props.rule?.id ?? null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<RowPermissionFormState>(createEmptyForm())

const subjectOptions = computed(() => buildSubjectOptions(form.subjectType, props.options))

const formRules = computed<FormRules>(() => ({
  name: [
    { required: true, message: t('datasetPage.rowPermissionForm.nameRequired'), trigger: 'blur' },
  ],
  subjectId: [
    {
      validator: (_rule, value, callback) => {
        if (form.subjectType !== 'all' && (value === undefined || value === null)) {
          callback(new Error(t('datasetPage.rowPermissionForm.subjectRequired')))
          return
        }
        callback()
      },
      trigger: 'change',
    },
  ],
}))

/** 打开时按 rule 初始化表单 */
watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    Object.assign(form, props.rule ? ruleToForm(props.rule) : createEmptyForm())
  },
  { immediate: true },
)

function addCondition() {
  form.conditions.push(createEmptyCondition())
}

function removeCondition(idx: number) {
  if (form.conditions.length <= 1) return
  form.conditions.splice(idx, 1)
}

async function submitForm() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return

  const payload = formToPayload(form)
  if (buildConditions(form.conditions).length === 0) {
    ElMessage.warning(t('datasetPage.rowPermissionForm.conditionsRequired'))
    return
  }

  submitting.value = true
  try {
    if (editingId.value) {
      await updateRowPermission(props.datasetId, editingId.value, payload)
      ElMessage.success(t('datasetPage.rowPermissionForm.updated'))
    } else {
      await createRowPermission(props.datasetId, payload)
      ElMessage.success(t('datasetPage.rowPermissionForm.created'))
    }
    visible.value = false
    emit('saved')
  } catch (e: any) {
    ElMessage.error(e?.message || t('datasetPage.rowPermissionForm.saveFailed'))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="less">
.rls-hint {
  color: #9ca3af;
  font-size: 12px;
}
.cond-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cond-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
