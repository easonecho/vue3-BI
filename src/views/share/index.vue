<template>
  <div v-loading="loading" class="share-page">
    <!-- 密码输入对话框 -->
    <div v-if="needPassword && !loading" class="password-panel">
      <el-card class="password-card" shadow="always">
        <div class="password-header">
          <el-icon size="32" color="#60a5fa"><Lock /></el-icon>
          <h3>{{ t('sharePage.passwordRequiredTitle') }}</h3>
        </div>
        <el-input
          v-model="passwordInput"
          type="password"
          :placeholder="t('sharePage.passwordPlaceholder')"
          show-password
          @keyup.enter="submitPassword"
        >
          <template #prefix
            ><el-icon><Key /></el-icon
          ></template>
        </el-input>
        <el-button
          type="primary"
          :loading="verifying"
          style="width: 100%; margin-top: 12px"
          @click="submitPassword"
        >
          {{ t('sharePage.verifyAndView') }}
        </el-button>
        <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
      </el-card>
    </div>

    <!-- 看板预览 -->
    <template v-if="!needPassword && dashboard">
      <div v-if="!isEmbed" class="share-header">
        <div class="share-title">
          <h2>{{ dashboard.name }}</h2>
          <p v-if="dashboard.description">{{ dashboard.description }}</p>
        </div>
        <div class="share-actions">
          <el-tag type="success" size="small" effect="dark">{{
            t('sharePage.publicShare')
          }}</el-tag>
          <!-- 查看者导出：与预览页共用截图逻辑，导出画布本身 -->
          <el-dropdown trigger="click" :disabled="exporting" @command="handleExportCommand">
            <el-button size="small" :loading="exporting" :disabled="exporting">
              {{ t('sharePage.export') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="png">{{ t('sharePage.exportPng') }}</el-dropdown-item>
                <el-dropdown-item command="pdf">{{ t('sharePage.exportPdf') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <!-- 🔑 复用预览页画布：等比缩放自适应，移动端按宽度适配并可纵向滚动 -->
      <DashboardScreen />
    </template>

    <!-- 错误提示 -->
    <div v-if="loadError && !loading" class="error-panel">
      <el-empty :description="loadError">
        <el-button @click="goHome">{{ t('sharePage.backHome') }}</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, Lock, Key } from '@element-plus/icons-vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import { useLinkageStore } from '@/stores/linkage'
import DashboardScreen from '@/views/preview/components/DashboardScreen.vue'
import { getPublicDashboard, verifyPublicDashboard, isPasswordRequired } from '@/api/share'
import type { PublicDashboard } from '@/api/share'
import {
  setPublicDashboardContext,
  clearPublicDashboardContext,
} from '@/utils/public-dashboard-context'
import type { DashboardLayout } from '@/views/bi-editor/types'
import { useDashboardExport } from '@/views/preview/composables/useDashboardExport'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useBiEditorStore()
const linkageStore = useLinkageStore()

/** 🔑 嵌入模式 (/embed/:token): 隐藏顶部标题栏, 仅渲染画布 */
const isEmbed = computed(() => route.meta.embed === true)

const loading = ref(false)
const verifying = ref(false)
const loadError = ref('')
const needPassword = ref(false)
const passwordInput = ref('')
const passwordError = ref('')
const dashboard = ref<PublicDashboard | null>(null)

// 分享页查看者导出（与预览页共用实现）
const { exporting, exportPng, exportPdf } = useDashboardExport(
  () => dashboard.value?.name || t('sharePage.dashboardFallback'),
)

function handleExportCommand(command: string) {
  if (command === 'png') void exportPng()
  else if (command === 'pdf') void exportPdf()
}

onMounted(async () => {
  // 🔑 公开分享页开启图表联动/钻取
  linkageStore.setLinkageEnabled(true)
  const token = route.params.token as string
  if (!token) {
    loadError.value = t('sharePage.invalidLink')
    return
  }
  await loadPublicDashboard(token)
})

onUnmounted(() => {
  linkageStore.setLinkageEnabled(false)
  clearPublicDashboardContext()
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

    // 🔑 写入公开访问上下文:图表取数改走匿名公开接口 (仅允许看板绑定的数据集)
    setPublicDashboardContext({
      token,
      password: password || undefined,
    })

    // 将 layout 应用到 store, 复用 CanvasArea readonly 渲染
    const layout = (result.layout ?? {
      version: '1.0',
      components: [],
      canvas: undefined,
      guides: [],
    }) as unknown as DashboardLayout
    store.dashboardName = result.name
    store.applyLayout(layout)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('过期')) {
      loadError.value = t('sharePage.expiredLink')
    } else if (msg.includes('不存在')) {
      loadError.value = t('sharePage.notFoundLink')
    } else if (msg.includes('密码错误')) {
      passwordError.value = t('sharePage.passwordIncorrect')
      return
    } else {
      loadError.value = msg || t('sharePage.loadFailed')
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
  router.push('/dashboard')
}
</script>

<style scoped lang="less">
.share-page {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
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
    flex: 1;
    min-width: 0;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--bi-text-primary, #f3f4f6);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    p {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: var(--bi-text-secondary, #9ca3af);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .share-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
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

/* ========== 移动端适配 ========== */
@media (max-width: 768px) {
  .share-header {
    padding: 8px 12px;
  }

  .share-header .share-title h2 {
    font-size: 15px;
  }

  .share-header .share-title p {
    font-size: 12px;
  }

  .share-header .share-actions {
    gap: 8px;
  }

  .password-card {
    width: calc(100vw - 32px);
  }
}
</style>
