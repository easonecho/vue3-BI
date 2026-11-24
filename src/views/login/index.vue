<template>
  <div class="login-page">
    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="card-content">
        <!-- 标题区 -->
        <div class="login-header">
          <div class="logo-mark">
            <svg viewBox="0 0 40 40" class="logo-svg">
              <rect
                x="6"
                y="6"
                width="12"
                height="12"
                rx="2"
                fill="var(--bi-accent)"
                opacity="0.9"
              />
              <rect
                x="22"
                y="6"
                width="12"
                height="12"
                rx="2"
                fill="var(--bi-accent)"
                opacity="0.45"
              />
              <rect
                x="6"
                y="22"
                width="12"
                height="12"
                rx="2"
                fill="var(--bi-accent)"
                opacity="0.55"
              />
              <rect
                x="22"
                y="22"
                width="12"
                height="12"
                rx="2"
                fill="var(--bi-accent)"
                opacity="0.25"
              />
            </svg>
          </div>
          <h1 class="login-title">{{ t('auth.appTitle') }}</h1>
          <p class="login-subtitle">{{ t('auth.loginSubtitle') }}</p>
        </div>

        <!-- 表单 -->
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item :label="t('auth.username')" prop="username">
            <el-input
              v-model="form.username"
              :placeholder="t('auth.usernamePlaceholder')"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item :label="t('auth.tenantCode')" prop="tenantCode">
            <el-input
              v-model="form.tenantCode"
              :placeholder="t('auth.tenantCodePlaceholder')"
              :prefix-icon="OfficeBuilding"
              size="large"
            />
          </el-form-item>
          <el-form-item :label="t('auth.password')" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              :placeholder="t('auth.passwordPlaceholder')"
              :prefix-icon="Lock"
              size="large"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              size="large"
              class="login-btn"
              @click="handleLogin"
            >
              <span v-if="!loading">{{ t('auth.loginBtn') }}</span>
              <span v-else>{{ t('auth.loggingIn') }}</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-tip">
          <el-icon><InfoFilled /></el-icon>
          <span
            >{{ t('auth.testAccounts') }} <span class="account">admin / admin123</span> ·
            <span class="account">user / user123</span></span
          >
        </div>
      </div>
    </div>

    <!-- 右上角主题切换 -->
    <div class="theme-area">
      <ThemeSwitcher />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, InfoFilled, OfficeBuilding } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: 'admin123',
  tenantCode: '',
})

// 校验文案随语言切换实时更新
const rules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('auth.usernameRequired'), trigger: 'blur' }],
  password: [{ required: true, message: t('auth.passwordRequired'), trigger: 'blur' }],
}))

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const result = await userStore.login(
        form.username,
        form.password,
        form.tenantCode.trim() || undefined,
      )
      const name = result.user.nickname || result.user.username
      ElMessage.success(t('auth.loginSuccessWithName', { name }))
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    } catch {
      // 错误已在拦截器中统一处理
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="less">
.login-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bi-bg);
}

/* ========== 登录卡片 ========== */
.login-card {
  position: relative;
  width: 400px;
  z-index: 1;
  border-radius: 12px;
  background: var(--bi-glass-bg);
  border: 1px solid var(--bi-glass-border);
  backdrop-filter: blur(var(--bi-glass-blur));
  box-shadow: var(--bi-shadow-md);
  animation: cardEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  .card-content {
    padding: 40px 36px;
  }
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 标题区 ========== */
.login-header {
  text-align: center;
  margin-bottom: 32px;

  .logo-mark {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
  }

  .logo-svg {
    width: 100%;
    height: 100%;
  }

  .login-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--bi-text-primary);
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .login-subtitle {
    font-size: 12px;
    color: var(--bi-text-muted);
    letter-spacing: 1px;
  }
}

/* ========== 表单 ========== */
.login-form {
  :deep(.el-form-item__label) {
    color: var(--bi-text-secondary);
    font-size: 13px;
    font-weight: 500;
    padding-bottom: 4px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    height: 44px;
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  border-radius: 8px;
}

/* ========== 提示区 ========== */
.login-tip {
  margin-top: 20px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--bi-text-muted);
  background: var(--bi-component-bg);
  border-radius: 6px;
  border: 1px solid var(--bi-border-color);

  .el-icon {
    color: var(--bi-accent);
    flex-shrink: 0;
    font-size: 14px;
  }

  .account {
    color: var(--bi-text-secondary);
    font-family: 'JetBrains Mono', 'Courier New', monospace;
  }
}

/* ========== 主题切换 ========== */
.theme-area {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
}

/* ========== 移动端适配 ========== */
@media (max-width: 520px) {
  .login-card {
    width: calc(100vw - 32px);
  }

  .login-card .card-content {
    padding: 28px 20px;
  }

  .theme-area {
    top: 12px;
    right: 12px;
  }
}
</style>
