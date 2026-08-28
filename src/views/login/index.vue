<template>
  <div class="login-page">
    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="card-content">
        <!-- 标题区 -->
        <div class="login-header">
          <div class="logo-mark">
            <svg viewBox="0 0 40 40" class="logo-svg">
              <rect x="6" y="6" width="12" height="12" rx="2" fill="var(--bi-accent)" opacity="0.9" />
              <rect x="22" y="6" width="12" height="12" rx="2" fill="var(--bi-accent)" opacity="0.45" />
              <rect x="6" y="22" width="12" height="12" rx="2" fill="var(--bi-accent)" opacity="0.55" />
              <rect x="22" y="22" width="12" height="12" rx="2" fill="var(--bi-accent)" opacity="0.25" />
            </svg>
          </div>
          <h1 class="login-title">BI 低代码平台</h1>
          <p class="login-subtitle">数据可视化 · 看板搭建</p>
        </div>

        <!-- 表单 -->
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleLogin"
          class="login-form"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="请输入密码"
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
              <span v-if="!loading">登 录</span>
              <span v-else>认证中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>测试账号 <span class="account">admin / admin123</span> · <span class="account">user / user123</span></span>
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
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: 'admin123',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const result = await userStore.login(form.username, form.password)
      ElMessage.success(`登录成功，欢迎 ${result.user.nickname || result.user.username}`)
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
</style>
