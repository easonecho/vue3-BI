<template>
  <el-dialog
    v-model="visible"
    :title="t('dashboard.saveVersionTitle')"
    width="440px"
    append-to-body
    destroy-on-close
  >
    <el-form label-width="70px">
      <el-form-item :label="t('dashboard.remark')">
        <el-input
          v-model="remark"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          :placeholder="t('dashboard.saveVersionRemarkPlaceholder')"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="emit('save')">{{
        t('common.save')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
}>()

const visible = defineModel<boolean>({ required: true })
const remark = defineModel<string>('remark', { required: true })

const { t } = useI18n()
</script>
