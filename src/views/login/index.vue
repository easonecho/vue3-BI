<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-title">BI 低代码平台</div>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名 (默认 admin)" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码 (默认 admin123)"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin"
            >登录</el-button
          >
        </el-form-item>
      </el-form>
      <div class="login-tip">测试账号: admin / admin123 &nbsp;或&nbsp; user / user123</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

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
      // 🔑 优先跳转到登录前尝试访问的页面（由路由守卫携带的 redirect 参数）
      const redirect = (route.query.redirect as string) || '/bi-editor'
      router.push(redirect)
    } catch {
      // 错误已在拦截器中统一处理
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="less" scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;

  .login-title {
    font-size: 20px;
    font-weight: 600;
    text-align: center;
    color: #303133;
  }

  .login-tip {
    margin-top: 12px;
    font-size: 12px;
    color: #909399;
    text-align: center;
  }
}
</style>
