<template>
  <el-dialog v-model="visible" title="分享看板" width="480px" @open="onOpen">
    <div v-loading="shareLoading">
      <template v-if="shareConfig?.isShared">
        <el-alert type="success" :closable="false" style="margin-bottom: 16px">
          分享链接已生成,任何人可通过链接访问
        </el-alert>
        <el-input :model-value="shareFullUrl" readonly style="margin-bottom: 12px">
          <template #append>
            <el-button @click="copyShareUrl">
              <el-icon><CopyDocument /></el-icon>&nbsp;复制
            </el-button>
          </template>
        </el-input>
        <div class="share-meta">
          <el-tag v-if="shareConfig.hasPassword" size="small" type="warning">
            <el-icon><Lock /></el-icon>&nbsp;密码保护
          </el-tag>
          <el-tag v-else size="small" type="info">无密码</el-tag>
          <el-tag v-if="shareConfig.expiresAt" size="small" type="warning">
            <el-icon><Clock /></el-icon>&nbsp;{{ formatTime(shareConfig.expiresAt) }} 过期
          </el-tag>
          <el-tag v-else size="small" type="success">永久有效</el-tag>
        </div>
        <!-- 🔑 P1-C: iframe 嵌入代码 (第三方系统无登录集成) -->
        <div class="embed-block">
          <div class="embed-title">iframe 嵌入代码</div>
          <el-input :model-value="embedCode" type="textarea" :rows="2" readonly />
          <el-button size="small" style="margin-top: 8px" @click="copyEmbedCode">
            <el-icon><CopyDocument /></el-icon>&nbsp;复制嵌入代码
          </el-button>
        </div>
      </template>
      <template v-else-if="shareConfig && !shareConfig.isShared">
        <el-alert type="info" :closable="false" style="margin-bottom: 16px">
          创建分享链接后,任何人可通过链接访问该看板 (无需登录)
        </el-alert>
        <el-form label-width="90px">
          <el-form-item label="密码保护">
            <el-switch v-model="shareForm.enablePassword" />
            <span class="form-hint">开启后访问者需输入密码</span>
          </el-form-item>
          <el-form-item v-if="shareForm.enablePassword" label="访问密码">
            <el-input
              v-model="shareForm.password"
              type="password"
              placeholder="请输入访问密码"
              show-password
              maxlength="50"
            />
          </el-form-item>
          <el-form-item label="有效期">
            <el-select v-model="shareForm.expiresInHours" style="width: 100%">
              <el-option label="永久有效" :value="0" />
              <el-option label="1 天" :value="24" />
              <el-option label="7 天" :value="168" />
              <el-option label="30 天" :value="720" />
              <el-option label="365 天" :value="8760" />
            </el-select>
          </el-form-item>
        </el-form>
      </template>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <template v-if="shareConfig?.isShared">
        <el-popconfirm title="确定取消分享吗? 链接将立即失效" @confirm="handleRevokeShare">
          <template #reference>
            <el-button type="danger" :loading="revoking">取消分享</el-button>
          </template>
        </el-popconfirm>
      </template>
      <template v-else-if="shareConfig && !shareConfig.isShared">
        <el-button type="primary" :loading="creatingShare" @click="handleCreateShare"
          >创建分享链接</el-button
        >
      </template>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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
    ElMessage.warning('请输入访问密码')
    return
  }
  creatingShare.value = true
  try {
    const res = await createShare(props.dashboard.id, {
      password: shareForm.enablePassword ? shareForm.password.trim() : undefined,
      expiresInHours: shareForm.expiresInHours || undefined,
    })
    shareConfig.value = res.data
    ElMessage.success('分享链接已生成')
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
    ElMessage.success('已取消分享')
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
  await copyToClipboard(shareFullUrl.value, '链接已复制到剪贴板')
}

async function copyEmbedCode() {
  await copyToClipboard(embedCode.value, '嵌入代码已复制')
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
