<template>
  <el-dialog v-model="visible" title="修改用户角色" width="360px" destroy-on-close>
    <el-form label-width="70px">
      <el-form-item label="用户">
        <span>{{ user?.username }} ({{ user?.nickname || '无昵称' }})</span>
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="selectedRoleId" placeholder="请选择角色" style="width: 100%">
          <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitRoleChange">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { changeUserRole } from '@/api/user.service'
import type { User, Role } from '@/api/types'

const props = defineProps<{
  modelValue: boolean
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
const selectedRoleId = ref<number | undefined>()

watch(
  () => props.modelValue,
  (v) => {
    if (v) selectedRoleId.value = props.user?.roleId
  },
  { immediate: true },
)

async function submitRoleChange() {
  if (!props.user || selectedRoleId.value === undefined) {
    ElMessage.warning('请选择角色')
    return
  }
  submitting.value = true
  try {
    await changeUserRole(props.user.id, selectedRoleId.value)
    ElMessage.success('角色已更新')
    visible.value = false
    emit('saved')
  } finally {
    submitting.value = false
  }
}
</script>
