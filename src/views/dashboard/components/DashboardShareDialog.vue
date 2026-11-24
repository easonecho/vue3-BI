<template>
  <el-dialog v-model="visible" :title="t('dashboard.shareTitle')" width="480px" @open="onOpen">
    <div v-loading="shareLoading">
      <template v-if="shareConfig?.isShared">
        <el-alert type="success" :closable="false" style="margin-bottom: 16px">
          {{ t('dashboard.shareCreated') }}
        </el-alert>
        <el-input :model-value="shareFullUrl" readonly style="margin-bottom: 12px">
          <template #append>
            <el-button @click="copyShareUrl">
              <el-icon><CopyDocument /></el-icon>&nbsp;{{ t('dashboard.copyUrl') }}
            </el-button>
          </template>
        </el-input>
        <div class="share-meta">
          <el-tag v-if="shareConfig.hasPassword" size="small" type="warning">
            <el-icon><Lock /></el-icon>&nbsp;{{ t('dashboard.passwordProtection') }}
          </el-tag>
          <el-tag v-else size="small" type="info">{{ t('dashboard.noPassword') }}</el-tag>
          <el-tag v-if="shareConfig.expiresAt" size="small" type="warning">
            <el-icon><Clock /></el-icon>&nbsp;{{
              t('dashboard.expiresAt', { time: formatTime(shareConfig.expiresAt) })
            }}
          </el-tag>
          <el-tag v-else size="small" type="success">{{ t('dashboard.permanent') }}</el-tag>
        </div>
        <!-- 🔑 P1-C: iframe 嵌入代码 (第三方系统无登录集成) -->
        <div class="embed-block">
          <div class="embed-title">{{ t('dashboard.iframeEmbedTitle') }}</div>
          <el-input :model-value="embedCode" type="textarea" :rows="2" readonly />
          <el-button size="small" style="margin-top: 8px" @click="copyEmbedCode">
            <el-icon><CopyDocument /></el-icon>&nbsp;{{ t('dashboard.copyEmbedCode') }}
          </el-button>
        </div>
      </template>
      <template v-else-if="shareConfig && !shareConfig.isShared">
        <el-alert type="info" :closable="false" style="margin-bottom: 16px">
          {{ t('dashboard.shareCreateHint') }}
        </el-alert>
        <el-form label-width="90px">
          <el-form-item :label="t('dashboard.passwordProtection')">
            <el-switch v-model="shareForm.enablePassword" />
            <span class="form-hint">{{ t('dashboard.passwordHint') }}</span>
          </el-form-item>
          <el-form-item v-if="shareForm.enablePassword" :label="t('dashboard.accessPassword')">
            <el-input
              v-model="shareForm.password"
              type="password"
              :placeholder="t('dashboard.passwordPlaceholder')"
              show-password
              maxlength="50"
            />
          </el-form-item>
          <el-form-item :label="t('dashboard.validity')">
            <el-select v-model="shareForm.expiresInHours" style="width: 100%">
              <el-option :label="t('dashboard.permanent')" :value="0" />
              <el-option :label="t('dashboard.days1')" :value="24" />
              <el-option :label="t('dashboard.days7')" :value="168" />
              <el-option :label="t('dashboard.days30')" :value="720" />
              <el-option :label="t('dashboard.days365')" :value="8760" />
            </el-select>
          </el-form-item>
        </el-form>
      </template>
    </div>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.close') }}</el-button>
      <template v-if="shareConfig?.isShared">
        <el-popconfirm :title="t('dashboard.revokeConfirm')" @confirm="handleRevokeShare">
          <template #reference>
            <el-button type="danger" :loading="revoking">{{
              t('dashboard.revokeShare')
            }}</el-button>
          </template>
        </el-popconfirm>
      </template>
      <template v-else-if="shareConfig && !shareConfig.isShared">
        <el-button type="primary" :loading="creatingShare" @click="handleCreateShare">{{
          t('dashboard.createShare')
        }}</el-button>
      </template>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { CopyDocument, Lock, Clock } from '@element-plus/icons-vue'
import { getShareConfig, createShare, revokeShare } from '@/api/share'
import type { ShareConfig } from '@/api/share'
import type { Dashboard } from '@/api/types'

const props = defineProps<{
  modelValue: boolean
  dashboard: Dashboard | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const shareLoading = ref(false)
const shareConfig = ref<ShareConfig | null>(null)
const creatingShare = ref(false)
const revoking = ref(false)
const shareForm = reactive({
  enablePassword: false,
  password: '',
  expiresInHours: 0,
})

const { t } = useI18n()

const shareFullUrl = computed(() => {
  if (!shareConfig.value?.shareUrl) return ''
  const origin = window.location.origin
  return `${origin}${shareConfig.value.shareUrl}`
})

/** 🔑 P1-C: iframe 嵌入地址 (嵌入模式隐藏标题栏) */
const embedCode = computed(() => {
  const token = shareConfig.value?.shareToken
  if (!token) return ''
  return `<iframe src="${window.location.origin}/embed/${token}" width="100%" height="720" style="border:0;border-radius:8px;" allowfullscreen></iframe>`
})

function formatTime(t?: string): string {
  if (!t) return '-'
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return '-'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 打开时重置表单并拉取分享配置 */
function onOpen() {
  shareConfig.value = null
  shareForm.enablePassword = false
  shareForm.password = ''
  shareForm.expiresInHours = 0
  loadShareConfig()
}

async function loadShareConfig() {
  if (!props.dashboard) return
  shareLoading.value = true
  try {
    const res = await getShareConfig(props.dashboard.id)
    shareConfig.value = res.data
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    shareLoading.value = false
  }
}

async function handleCreateShare() {
  if (!props.dashboard) return
  if (shareForm.enablePassword && !shareForm.password.trim()) {
    ElMessage.warning(t('dashboard.passwordRequired'))
    return
  }
  creatingShare.value = true
  try {
    const res = await createShare(props.dashboard.id, {
      password: shareForm.enablePassword ? shareForm.password.trim() : undefined,
      expiresInHours: shareForm.expiresInHours || undefined,
    })
    shareConfig.value = res.data
    ElMessage.success(t('dashboard.shareSuccess'))
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    creatingShare.value = false
  }
}

async function handleRevokeShare() {
  if (!props.dashboard) return
  revoking.value = true
  try {
    await revokeShare(props.dashboard.id)
    shareConfig.value = null
    ElMessage.success(t('dashboard.revokeSuccess'))
    visible.value = false
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    revoking.value = false
  }
}

async function copyToClipboard(text: string, successMsg: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(successMsg)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success(successMsg)
  }
}

async function copyShareUrl() {
  await copyToClipboard(shareFullUrl.value, t('dashboard.urlCopied'))
}

async function copyEmbedCode() {
  await copyToClipboard(embedCode.value, t('dashboard.embedCodeCopied'))
}
</script>

<style scoped lang="less">
.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--bi-text-secondary);
}

.share-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.embed-block {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--bi-border-color);

  .embed-title {
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--bi-text-secondary);
  }
}
</style>
