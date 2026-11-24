<template>
  <el-dialog
    v-model="visible"
    :title="t('editorUi.header.saveTemplateTitle')"
    width="480px"
    :close-on-click-modal="false"
  >
    <el-form :model="templateMeta" label-width="80px">
      <el-form-item :label="t('editorUi.header.templateName')">
        <el-input
          v-model="store.dashboardName"
          :placeholder="t('editorUi.header.templateNamePlaceholder')"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item :label="t('editorUi.header.description')">
        <el-input
          v-model="templateMeta.description"
          type="textarea"
          :rows="3"
          :placeholder="t('editorUi.header.templateDescPlaceholder')"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item :label="t('editorUi.header.category')">
        <el-select
          v-model="templateMeta.category"
          :placeholder="t('editorUi.header.categoryPlaceholder')"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="c in categoryOptions"
            :key="c.value"
            :label="c.label"
            :value="c.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('editorUi.header.isPublic')">
        <el-switch v-model="templateMeta.isPublic" />
        <span class="form-hint">{{ t('editorUi.header.templatePublicHint') }}</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="store.isSaving" @click="confirmSaveTemplate">{{
        t('editorUi.header.saveTemplate')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBiEditorStore } from '@/stores/bi-editor'
import { getTemplateCategories, type TemplateCategoryOption } from '@/api/dashboard-template'

const visible = defineModel<boolean>({ required: true })
const store = useBiEditorStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const templateMeta = reactive({
  description: '',
  category: undefined as string | undefined,
  isPublic: true,
})
const categoryOptions = ref<TemplateCategoryOption[]>([])

/** 打开对话框时预填当前 store 中的模板元数据 */
watch(visible, (open) => {
  if (!open) return
  templateMeta.description = store.templateDescription
  templateMeta.category = store.templateCategory
  templateMeta.isPublic = store.templateIsPublic
})

onMounted(() => {
  // 加载模板分类枚举（模板模式保存对话框使用；列表很小，无条件加载）
  getTemplateCategories()
    .then((r) => {
      categoryOptions.value = r.data
    })
    .catch(() => {
      // 加载失败不阻断：保存对话框分类项为空即可
    })
})

async function confirmSaveTemplate() {
  try {
    const res = await store.saveTemplate({
      description: templateMeta.description,
      category: templateMeta.category,
      isPublic: templateMeta.isPublic,
    })
    if (!res) return
    // 🔑 新建模板保存后 URL 停留在 /bi-editor-template(无 id)，用 replace 补上 id
    if (route.params.id == null && store.currentTemplateId != null) {
      router.replace(`/bi-editor-template/${store.currentTemplateId}`)
    }
    visible.value = false
  } catch {
    // 错误提示由 request 拦截器统一处理
  }
}
</script>

<style scoped lang="less">
.form-hint {
  margin-left: 12px;
  color: var(--bi-text-secondary, #9ca3af);
  font-size: 12px;
}
</style>
