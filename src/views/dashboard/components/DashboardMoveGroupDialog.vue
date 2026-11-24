<template>
  <el-dialog v-model="visible" :title="t('dashboard.moveGroup')" width="420px">
    <el-form label-width="80px">
      <el-form-item :label="t('dashboard.moveTarget')">
        <el-select
          v-model="moveGroupTarget"
          :placeholder="t('dashboard.moveTargetPlaceholder')"
          clearable
          style="width: 100%"
        >
          <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="movingGroup" @click="confirmMoveGroup">{{
        t('common.confirm')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { moveDashboardToGroup } from '@/api/dashboard'
import type { Dashboard, DashboardGroup } from '@/api/types'

const props = defineProps<{
  modelValue: boolean
  dashboard: Dashboard | null
  groups: DashboardGroup[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** 移动成功后通知父级刷新列表 */
  moved: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const moveGroupTarget = ref<number | null>(null)
const movingGroup = ref(false)

const { t } = useI18n()

// 打开时以看板当前分组作为默认值
watch(
  () => props.modelValue,
  (v) => {
    if (v) moveGroupTarget.value = props.dashboard?.groupId ?? null
  },
)

async function confirmMoveGroup() {
  if (!props.dashboard) return
  movingGroup.value = true
  try {
    await moveDashboardToGroup(props.dashboard.id, moveGroupTarget.value)
    ElMessage.success(t('dashboard.moveSuccess'))
    visible.value = false
    emit('moved')
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    movingGroup.value = false
  }
}
</script>
