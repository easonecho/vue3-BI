<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'create' ? '新增用户' : '编辑用户'"
    width="520px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="86px" label-position="right">
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="form.username"
          :disabled="mode === 'edit'"
          maxlength="50"
          show-word-limit
          placeholder="登录用,创建后不可改"
        />
      </el-form-item>
      <el-form-item v-if="mode === 'create'" label="密码" prop="password">
        <el-input v-model="form.password" type="password" show-password maxlength="50" placeholder="6-50位" />
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="form.nickname" maxlength="50" show-word-limit placeholder="显示名" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="example@mail.com" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="form.phone" maxlength="20" placeholder="11位手机号" />
      </el-form-item>
      <el-form-item label="角色" prop="roleId">
        <el-select v-model="form.roleId" placeholder="请选择角色" style="width: 100%">
          <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitForm">
        {{ mode === 'create' ? '创建' : '保存' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { createUser, updateUser, type CreateUserPayload } from '@/api/user'
import type { User, Role } from '@/api/types'
import { userFormRules } from '../utils/user-utils'

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
const formRules = userFormRules

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
      ElMessage.success('创建用户成功')
    } else if (form.id) {
      await updateUser(form.id, {
        nickname: form.nickname || null,
        email: form.email || null,
        phone: form.phone || null,
        roleId: form.roleId,
        status: form.status,
      })
      ElMessage.success('保存成功')
    }
    visible.value = false
    emit('saved')
  } finally {
    submitting.value = false
  }
}
</script>
