<template>
  <el-dialog
    v-model="visible"
    :title="editingId ? '编辑报表订阅' : '新增报表订阅'"
    width="640px"
    append-to-body
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="96px">
      <el-form-item label="订阅名称" prop="name">
        <el-input v-model="form.name" maxlength="100" placeholder="如: 每日销售看板" />
      </el-form-item>
      <el-form-item label="执行周期" prop="cron">
        <el-select v-model="form.cron" filterable allow-create default-first-option style="width: 100%">
          <el-option v-for="opt in cronOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="投递渠道" prop="channel">
        <el-radio-group v-model="form.channel">
          <el-radio label="inbox">站内投递</el-radio>
          <el-radio label="webhook">Webhook 推送</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="收件人">
        <el-input
          v-model="form.recipients"
          maxlength="500"
          placeholder="可选，多个收件人以逗号分隔（记录在投递记录中）"
        />
      </el-form-item>
      <el-form-item v-if="form.channel === 'webhook'" label="回调地址" prop="webhookUrl">
        <el-input v-model="form.webhookUrl" maxlength="500" placeholder="https://example.com/hook" />
      </el-form-item>
      <el-form-item label="启用">
        <el-switch v-model="form.enabled" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import type { ReportSubscription } from '@/api/report'
import { useSubscriptionForm } from '../../composables/report/useSubscriptionForm'

const props = defineProps<{
  dashboardId: number | null
  editing: ReportSubscription | null
}>()

const emit = defineEmits<{ saved: [] }>()

const visible = defineModel<boolean>({ required: true })

const { formRef, editingId, saving, form, cronOptions, formRules, initForm, saveForm } =
  useSubscriptionForm({
    getDashboardId: () => props.dashboardId,
    onSaved: () => emit('saved'),
  })

watch(visible, (value) => {
  if (value) initForm(props.editing)
})

async function handleSave() {
  if (await saveForm()) visible.value = false
}
</script>
