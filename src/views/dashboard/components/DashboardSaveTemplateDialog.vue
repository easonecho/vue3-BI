<template>
  <el-dialog v-model="visible" :title="t('dashboard.saveAsTemplateTitle')" width="440px">
    <el-form :model="saveTplForm" label-width="80px">
      <el-form-item :label="t('dashboard.templateName')">
        <el-input
          v-model="saveTplForm.name"
          :placeholder="t('dashboard.templateNamePlaceholder')"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item :label="t('dashboard.templateDesc')">
        <el-input
          v-model="saveTplForm.description"
          type="textarea"
          :rows="2"
          :placeholder="t('dashboard.optional')"
          maxlength="200"
        />
      </el-form-item>
      <el-form-item :label="t('dashboard.templateCategory')">
        <el-input
          v-model="saveTplForm.category"
          :placeholder="t('dashboard.templateCategoryPlaceholder')"
          maxlength="50"
        />
      </el-form-item>
      <el-form-item :label="t('dashboard.templatePublic')">
        <el-switch v-model="saveTplForm.isPublic" />
        <span class="form-hint">{{ t('dashboard.templatePublicHint') }}</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="savingTpl" @click="confirmSaveAsTemplate">{{
        t('common.save')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { saveAsTemplate } from '@/api/dashboard-template'
import type { Dashboard } from '@/api/types'

const props = defineProps<{
  modelValue: boolean
  dashboard: Dashboard | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const savingTpl = ref(false)
const saveTplForm = reactive({ name: '', description: '', category: '', isPublic: true })

const { t } = useI18n()

// 打开时用当前看板信息预填表单
watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    saveTplForm.name = props.dashboard
      ? t('dashboard.templateDefaultName', { name: props.dashboard.name })
      : ''
    saveTplForm.description = props.dashboard?.description || ''
    saveTplForm.category = ''
    saveTplForm.isPublic = true
  },
)

async function confirmSaveAsTemplate() {
  if (!props.dashboard) return
  const name = saveTplForm.name.trim()
  if (!name) {
    ElMessage.warning(t('dashboard.templateNameRequired'))
    return
  }
  savingTpl.value = true
  try {
    await saveAsTemplate(props.dashboard.id, {
      name,
      description: saveTplForm.description.trim() || undefined,
      category: saveTplForm.category.trim() || undefined,
      isPublic: saveTplForm.isPublic,
    })
    ElMessage.success(t('dashboard.templateSaveSuccess'))
    visible.value = false
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    savingTpl.value = false
  }
}
</script>

<style scoped lang="less">
.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--bi-text-secondary);
}
</style>
