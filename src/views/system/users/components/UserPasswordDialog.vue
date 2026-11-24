<template>
  <el-dialog
    v-model="visible"
    :title="t('userPage.resetPasswordTitle')"
    width="420px"
    destroy-on-close
  >
    <el-form
      ref="pwdFormRef"
      :model="pwdForm"
      :rules="pwdRules"
      label-width="86px"
      label-position="right"
    >
      <el-form-item :label="t('userPage.user')">
        <span>{{ user?.username }} ({{ user?.nickname || t('userPage.noNickname') }})</span>
      </el-form-item>
      <el-form-item :label="t('userPage.newPassword')" prop="password">
        <el-input
          v-model="pwdForm.password"
          type="password"
          show-password
          maxlength="50"
          :placeholder="t('userPage.newPasswordPlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('userPage.confirmPassword')" prop="confirmPassword">
        <el-input
          v-model="pwdForm.confirmPassword"
          type="password"
          show-password
          maxlength="50"
          :placeholder="t('userPage.confirmPasswordPlaceholder')"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="submitResetPassword">
        {{ t('userPage.confirmReset') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance } from 'element-plus'
import { resetUserPassword } from '@/api/user'
import type { User } from '@/api/types'
import { buildPasswordRules } from '../utils/user-utils'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  user: User | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const submitting = ref(false)
const pwdFormRef = ref<FormInstance>()
const pwdForm = reactive({ password: '', confirmPassword: '' })
const pwdRules = computed(() => buildPasswordRules(() => pwdForm.password))

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    pwdForm.password = ''
    pwdForm.confirmPassword = ''
  },
  { immediate: true },
)

async function submitResetPassword() {
  if (!pwdFormRef.value || !props.user) return
  const ok = await pwdFormRef.value.validate().catch(() => false)
  if (!ok) return

  submitting.value = true
  try {
    await resetUserPassword(props.user.id, pwdForm.password)
    ElMessage.success(t('userPage.passwordReset'))
    visible.value = false
    emit('saved')
  } finally {
    submitting.value = false
  }
}
</script>
