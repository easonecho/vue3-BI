<template>
  <el-dialog v-model="visible" title="保存为模板" width="440px">
    <el-form :model="saveTplForm" label-width="80px">
      <el-form-item label="模板名称">
        <el-input
          v-model="saveTplForm.name"
          placeholder="请输入模板名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="saveTplForm.description"
          type="textarea"
          :rows="2"
          placeholder="可选"
          maxlength="200"
        />
      </el-form-item>
      <el-form-item label="分类">
        <el-input v-model="saveTplForm.category" placeholder="如: 销售/运营/财务 (可选)" maxlength="50" />
      </el-form-item>
      <el-form-item label="是否公开">
        <el-switch v-model="saveTplForm.isPublic" />
        <span class="form-hint">公开模板其他用户可用</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="savingTpl" @click="confirmSaveAsTemplate">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { saveAsTemplate } from '@/api/dashboard-template'
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

const savingTpl = ref(false)
const saveTplForm = reactive({ name: '', description: '', category: '', isPublic: true })

// 打开时用当前看板信息预填表单
watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    saveTplForm.name = props.dashboard ? `${props.dashboard.name}_模板` : ''
    saveTplForm.description = props.dashboard?.description || ''
    saveTplForm.category = ''
    saveTplForm.isPublic = true
  },
)

async function confirmSaveAsTemplate() {
  if (!props.dashboard) return
  const name = saveTplForm.name.trim()
  if (!name) {
    ElMessage.warning('模板名称不能为空')
    return
  }
  savingTpl.value = true
  try {
    await saveAsTemplate(props.dashboard.id, {
      name,
      description: saveTplForm.description.trim() || undefined,
      category: saveTplForm.category.trim() || undefined,
      isPublic: saveTplForm.isPublic,
    })
    ElMessage.success('已保存为模板')
    visible.value = false
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    savingTpl.value = false
  }
}
</script>

<style scoped lang="less">
.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--bi-text-secondary);
}
</style>
