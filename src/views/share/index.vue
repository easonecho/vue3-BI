<template>
  <div class="share-page" v-loading="loading">
    <!-- 密码输入对话框 -->
    <div v-if="needPassword && !loading" class="password-panel">
      <el-card class="password-card" shadow="always">
        <div class="password-header">
          <el-icon size="32" color="#60a5fa"><Lock /></el-icon>
          <h3>该看板已设置访问密码</h3>
        </div>
        <el-input
          v-model="passwordInput"
          type="password"
          placeholder="请输入访问密码"
          show-password
          @keyup.enter="submitPassword"
        >
          <template #prefix><el-icon><Key /></el-icon></template>
        </el-input>
        <el-button type="primary" :loading="verifying" @click="submitPassword" style="width: 100%; margin-top: 12px">
          验证并查看
        </el-button>
        <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
      </el-card>
    </div>

    <!-- 看板预览 -->
    <template v-if="!needPassword && dashboard">
      <div class="share-header">
        <div class="share-title">
          <h2>{{ dashboard.name }}</h2>
          <p v-if="dashboard.description">{{ dashboard.description }}</p>
        </div>
        <el-tag type="success" size="small" effect="dark">公开分享</el-tag>
      </div>
      <CanvasArea readonly />
    </template>

    <!-- 错误提示 -->
    <div v-if="loadError && !loading" class="error-panel">
      <el-empty :description="loadError">
        <el-button @click="goHome">返回首页</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, Key } from '@element-plus/icons-vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import CanvasArea from '@/views/bi-editor/components/CanvasArea.vue'
import { getPublicDashboard, verifyPublicDashboard, isPasswordRequired } from '@/api/share'
import type { PublicDashboard } from '@/api/share'
import type { DashboardLayout } from '@/views/bi-editor/types'

const route = useRoute()
const router = useRouter()
const store = useBiEditorStore()

const loading = ref(false)
const verifying = ref(false)
const loadError = ref('')
const needPassword = ref(false)
const passwordInput = ref('')
const passwordError = ref('')
const dashboard = ref<PublicDashboard | null>(null)

onMounted(async () => {
  const token = route.params.token as string
  if (!token) {
    loadError.value = '分享链接无效'
    return
  }
  await loadPublicDashboard(token)
})

async function loadPublicDashboard(token: string, password?: string) {
  loading.value = true
  loadError.value = ''
  try {
    let result: PublicDashboard | { passwordRequired: boolean }
    if (password) {
      const res = await verifyPublicDashboard(token, password)
      result = res.data
    } else {
      const res = await getPublicDashboard(token)
      result = res.data
    }

    if (isPasswordRequired(result)) {
      needPassword.value = true
      loading.value = false
      return
    }

    dashboard.value = result
    needPassword.value = false

    // 将 layout 应用到 store, 复用 CanvasArea readonly 渲染
    const layout = (result.layout ?? {
      version: '1.0',
      components: [],
      canvas: undefined,
      guides: [],
    }) as unknown as DashboardLayout
    store.dashboardName = result.name
    store.applyLayout(layout)
  } catch (e: any) {
    const msg = e?.message || ''
    if (msg.includes('过期')) {
      loadError.value = '分享链接已过期'
    } else if (msg.includes('不存在')) {
      loadError.value = '分享链接不存在或已被取消'
    } else if (msg.includes('密码错误')) {
      passwordError.value = '访问密码错误, 请重试'
      return
    } else {
      loadError.value = msg || '加载失败'
    }
  } finally {
    loading.value = false
  }
}

async function submitPassword() {
  const token = route.params.token as string
  if (!token || !passwordInput.value) return
  passwordError.value = ''
  verifying.value = true
  try {
    await loadPublicDashboard(token, passwordInput.value)
  } finally {
    verifying.value = false
  }
}

function goHome() {
  router.push('/')
}
</script>

<style scoped lang="less">
.share-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bi-bg, #111827);
  overflow: hidden;
  position: relative;
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bi-header-bg, #1f2937);
  border-bottom: 1px solid var(--bi-border-color, #374151);
  flex-shrink: 0;

  .share-title {
    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--bi-text-primary, #f3f4f6);
    }
    p {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: var(--bi-text-secondary, #9ca3af);
    }
  }
}

.password-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-card {
  width: 400px;
  background: var(--bi-card-bg, #1f2937);
  border: 1px solid var(--bi-border-color, #374151);

  :deep(.el-card__body) {
    padding: 32px 24px;
  }

  .password-header {
    text-align: center;
    margin-bottom: 20px;

    h3 {
      margin: 12px 0 0 0;
      font-size: 16px;
      color: var(--bi-text-primary, #f3f4f6);
    }
  }
}

.error-text {
  margin: 12px 0 0 0;
  font-size: 13px;
  color: #f87171;
  text-align: center;
}

.error-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
