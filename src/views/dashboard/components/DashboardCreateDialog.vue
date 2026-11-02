<template>
  <el-dialog v-model="visible" :title="t('dashboard.createTitle')" width="760px" @open="onOpen">
    <!-- 步骤 1: 选择模板 -->
    <DashboardCreateTemplatePicker
      v-if="createStep === 1"
      :templates="userTemplates"
      :loading="userTemplatesLoading"
      :selected-id="selectedUserTplId"
      @select="selectUserTemplate"
      @go-template-manage="goToTemplateManage"
    />

    <!-- 步骤 2: 填写看板信息 -->
    <DashboardCreateInfoForm
      v-else
      v-model:name="createForm.name"
      v-model:description="createForm.description"
      v-model:group-id="createForm.groupId"
      v-model:is-public="createForm.isPublic"
      :groups="groups"
      @submit="confirmCreate"
    />

    <template #footer>
      <el-button v-if="createStep === 2" @click="createStep = 1">{{ t('common.back') }}</el-button>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button v-if="createStep === 1" type="primary" @click="goToCreateStep2">{{
        t('common.next')
      }}</el-button>
      <el-button v-if="createStep === 2" type="primary" :loading="creating" @click="confirmCreate">{{
        t('dashboard.createAndEdit')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { DashboardGroup } from '@/api/types'
import DashboardCreateTemplatePicker from './DashboardCreateTemplatePicker.vue'
import DashboardCreateInfoForm from './DashboardCreateInfoForm.vue'
import { useDashboardCreate } from '../composables/useDashboardCreate'

const props = defineProps<{
  modelValue: boolean
  groups: DashboardGroup[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const {
  creating,
  createForm,
  createStep,
  selectedUserTplId,
  userTemplates,
  userTemplatesLoading,
  onOpen,
  selectUserTemplate,
  goToTemplateManage,
  goToCreateStep2,
  confirmCreate,
} = useDashboardCreate({
  router,
  t,
  close: () => {
    visible.value = false
  },
})
</script>
