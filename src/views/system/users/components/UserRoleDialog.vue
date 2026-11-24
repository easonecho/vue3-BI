<template>
  <el-dialog
    v-model="visible"
    :title="t('userPage.updateRoleTitle')"
    width="360px"
    destroy-on-close
  >
    <el-form label-width="70px">
      <el-form-item :label="t('userPage.user')">
        <span>{{ user?.username }} ({{ user?.nickname || t('userPage.noNickname') }})</span>
      </el-form-item>
      <el-form-item :label="t('userPage.role')">
        <el-select
          v-model="selectedRoleId"
          :placeholder="t('userPage.rolePlaceholder')"
          style="width: 100%"
        >
          <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="submitRoleChange">{{
        t('userPage.confirm')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { changeUserRole } from '@/api/user'
import type { User, Role } from '@/api/types'

const { t } = useI18n()

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
    ElMessage.warning(t('userPage.roleRequired'))
    return
  }
  submitting.value = true
  try {
    await changeUserRole(props.user.id, selectedRoleId.value)
    ElMessage.success(t('userPage.roleUpdated'))
    visible.value = false
    emit('saved')
  } finally {
    submitting.value = false
  }
}
</script>
