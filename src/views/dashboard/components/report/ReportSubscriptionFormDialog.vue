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
        <el-select
          v-model="form.cron"
          filterable
          allow-create
          default-first-option
          style="width: 100%"
        >
          <el-option
            v-for="opt in cronOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="投递渠道" prop="channel">
        <div class="channel-field">
          <el-radio-group v-model="form.channel" @change="handleChannelChange">
            <el-radio v-for="opt in channelOptions" :key="opt.value" :label="opt.value">
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
          <div class="channel-hint">{{ channelHint }}</div>
        </div>
      </el-form-item>
      <el-form-item
        v-if="showRecipients(form.channel)"
        :label="form.channel === 'email' ? '收件邮箱' : '收件人'"
        prop="recipients"
      >
        <el-input
          v-model="form.recipients"
          maxlength="500"
          :placeholder="
            form.channel === 'email'
              ? '必填，多个邮箱以逗号分隔，如: a@company.com, b@company.com'
              : '可选，多个收件人以逗号分隔（记录在投递记录中）'
          "
        />
      </el-form-item>
      <el-form-item
        v-if="isRobotChannel(form.channel)"
        :label="form.channel === 'webhook' ? '回调地址' : '机器人地址'"
        prop="webhookUrl"
      >
        <el-input v-model="form.webhookUrl" maxlength="500" :placeholder="robotUrlPlaceholder" />
      </el-form-item>
      <el-form-item v-if="form.channel === 'dingtalk'" label="加签密钥" prop="webhookSecret">
        <el-input
          v-model="form.webhookSecret"
          type="password"
          show-password
          maxlength="255"
          placeholder="可选，钉钉机器人「加签」安全设置的密钥"
        />
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
import { computed, watch } from 'vue'
import type { ReportSubscription } from '@/api/report'
import { useSubscriptionForm } from '../../composables/report/useSubscriptionForm'
import {
  REPORT_CHANNEL_OPTIONS,
  isRobotChannel,
  reportChannelHint,
  showRecipients,
} from '../../utils/report-channel'

const props = defineProps<{
  dashboardId: number | null
  editing: ReportSubscription | null
}>()

const emit = defineEmits<{ saved: [] }>()

const visible = defineModel<boolean>({ required: true })

const {
  formRef,
  editingId,
  saving,
  form,
  cronOptions,
  formRules,
  initForm,
  handleChannelChange,
  saveForm,
} = useSubscriptionForm({
  getDashboardId: () => props.dashboardId,
  onSaved: () => emit('saved'),
})

const channelOptions = REPORT_CHANNEL_OPTIONS
const channelHint = computed(() => reportChannelHint(form.channel))
const robotUrlPlaceholder = computed(() => {
  if (form.channel === 'wecom') {
    return 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...'
  }
  if (form.channel === 'dingtalk') {
    return 'https://oapi.dingtalk.com/robot/send?access_token=...'
  }
  return 'https://example.com/hook'
})

watch(visible, (value) => {
  if (value) initForm(props.editing)
})

async function handleSave() {
  if (await saveForm()) visible.value = false
}
</script>

<style scoped lang="less">
.channel-field {
  width: 100%;
}

.channel-hint {
  margin-top: 2px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}
</style>
