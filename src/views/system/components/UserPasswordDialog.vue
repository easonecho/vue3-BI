<template>
  <el-dialog v-model="visible" title="重置密码" width="420px" destroy-on-close>
    <el-form
      ref="pwdFormRef"
      :model="pwdForm"
      :rules="pwdRules"
      label-width="86px"
      label-position="right"
    >
      <el-form-item label="用户">
        <span>{{ user?.username }} ({{ user?.nickname || '无昵称' }})</span>
      </el-form-item>
      <el-form-item label="新密码" prop="password">
        <el-input
          v-model="pwdForm.password"
          type="password"
          show-password
          maxlength="50"
          placeholder="6-50 位"
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="pwdForm.confirmPassword"
          type="password"
          show-password
          maxlength="50"
          placeholder="再次输入新密码"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitResetPassword">
        确定重置
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { resetUserPassword } from '@/api/user.service'
import type { User } from '@/api/types'
import { buildPasswordRules } from '../user-utils'

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
const pwdRules = buildPasswordRules(() => pwdForm.password)

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
    ElMessage.success('密码已重置')
    visible.value = false
    emit('saved')
  } finally {
    submitting.value = false
  }
}
</script>
