<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'create' ? t('userPage.create') : t('userPage.editTitle')"
    width="520px"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="86px"
      label-position="right"
    >
      <el-form-item :label="t('userPage.username')" prop="username">
        <el-input
          v-model="form.username"
          :disabled="mode === 'edit'"
          maxlength="50"
          show-word-limit
          :placeholder="t('userPage.usernamePlaceholder')"
        />
      </el-form-item>
      <el-form-item v-if="mode === 'create'" :label="t('userPage.password')" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          maxlength="50"
          :placeholder="t('userPage.passwordPlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('userPage.nickname')" prop="nickname">
        <el-input
          v-model="form.nickname"
          maxlength="50"
          show-word-limit
          :placeholder="t('userPage.nicknamePlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('userPage.email')" prop="email">
        <el-input v-model="form.email" placeholder="example@mail.com" />
      </el-form-item>
      <el-form-item :label="t('userPage.phone')" prop="phone">
        <el-input
          v-model="form.phone"
          maxlength="20"
          :placeholder="t('userPage.phonePlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('userPage.role')" prop="roleId">
        <el-select
          v-model="form.roleId"
          :placeholder="t('userPage.rolePlaceholder')"
          style="width: 100%"
        >
          <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('userPage.status')" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">{{ t('userPage.enabled') }}</el-radio>
          <el-radio :value="0">{{ t('userPage.disabled') }}</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="submitForm">
        {{ mode === 'create' ? t('userPage.createBtn') : t('common.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance } from 'element-plus'
import { createUser, updateUser, type CreateUserPayload } from '@/api/user'
import type { User, Role } from '@/api/types'
import { buildUserFormRules } from '../utils/user-utils'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  user: User | null
  roleOptions: Role[]
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
const formRef = ref<FormInstance>()
const formRules = computed(() => buildUserFormRules())

const form = reactive<CreateUserPayload & { id?: number }>({
  id: undefined,
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  roleId: 2,
  status: 1,
})

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    if (props.mode === 'create' || !props.user) {
      Object.assign(form, {
        id: undefined,
        username: '',
        password: '',
        nickname: '',
        email: '',
        phone: '',
        roleId: 2,
        status: 1,
      })
      return
    }
    const row = props.user
    Object.assign(form, {
      id: row.id,
      username: row.username,
      password: '',
      nickname: row.nickname ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      roleId: row.roleId ?? 2,
      status: row.status,
    })
  },
  { immediate: true },
)

async function submitForm() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return

  submitting.value = true
  try {
    if (props.mode === 'create') {
      await createUser({
        username: form.username,
        password: form.password,
        nickname: form.nickname || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        roleId: form.roleId,
        status: form.status,
      })
      ElMessage.success(t('userPage.createUserSuccess'))
    } else if (form.id) {
      await updateUser(form.id, {
        nickname: form.nickname || null,
        email: form.email || null,
        phone: form.phone || null,
        roleId: form.roleId,
        status: form.status,
      })
      ElMessage.success(t('userPage.saveSuccess'))
    }
    visible.value = false
    emit('saved')
  } finally {
    submitting.value = false
  }
}
</script>
