<template>
  <el-dialog v-model="visible" :title="t('dashboard.applyTemplateTitle')" width="440px">
    <el-form :model="form" label-width="80px">
      <el-form-item :label="t('dashboard.name')" required>
        <el-input v-model="form.name" :placeholder="t('dashboard.namePlaceholder')" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item :label="t('dashboard.description')">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          :placeholder="t('dashboard.descPlaceholder')"
          maxlength="200"
        />
      </el-form-item>
      <el-form-item :label="t('dashboard.isPublic')">
        <el-switch v-model="form.isPublic" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="confirm">
        {{ t('dashboard.createAndEdit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DashboardTemplate } from '@/api/dashboard-template'
import type { ApplyTemplateInput } from '../composables/useTemplateApply'

const props = defineProps<{
  item: DashboardTemplate | null
  loading: boolean
}>()

const emit = defineEmits<{ confirm: [ApplyTemplateInput] }>()

const visible = defineModel<boolean>({ required: true })
const { t } = useI18n()

const form = reactive({
  name: '',
  description: '',
  isPublic: false,
})

/** 打开对话框时按模板信息预填表单（与原 openApply 行为一致） */
watch(visible, (open) => {
  if (!open || !props.item) return
  form.name = `${props.item.name}_${t('dashboard.title')}`
  form.description = props.item.description || ''
  form.isPublic = false
})

function confirm() {
  emit('confirm', {
    name: form.name,
    description: form.description,
    isPublic: form.isPublic,
  })
}
</script>
