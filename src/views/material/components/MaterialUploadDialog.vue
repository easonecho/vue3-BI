<template>
  <el-dialog
    v-model="visible"
    :title="t('materialPage.uploadTitle')"
    width="560px"
    destroy-on-close
    append-to-body
  >
    <el-form ref="uploadFormRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item :label="t('materialPage.formFile')" prop="file">
        <el-upload
          ref="uploadRef"
          class="upload-uploader"
          drag
          :auto-upload="false"
          :limit="1"
          :on-change="onFileChange"
          :on-exceed="onFileExceed"
          :accept="acceptString"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            {{ t('materialPage.uploadDrop') }}<em>{{ t('materialPage.uploadClickSelect') }}</em>
          </div>
          <template #tip>
            <div class="upload-tip">
              {{ t('materialPage.uploadTip') }}
            </div>
          </template>
        </el-upload>
      </el-form-item>
      <el-form-item :label="t('materialPage.formName')">
        <el-input
          v-model="form.name"
          :placeholder="t('materialPage.namePlaceholder')"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item :label="t('materialPage.formType')" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio-button label="video">{{ t('materialPage.typeVideo') }}</el-radio-button>
          <el-radio-button label="image">{{ t('materialPage.typeImage') }}</el-radio-button>
          <el-radio-button label="decor">{{ t('materialPage.typeDecor') }}</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="t('materialPage.formDescription')">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          :placeholder="t('materialPage.descriptionPlaceholder')"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('materialPage.cancel') }}</el-button>
      <el-button type="primary" :loading="uploading" :disabled="!form.file" @click="submitUpload">
        {{ t('materialPage.submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { useMaterialUpload } from '../composables/useMaterialUpload'

const { t } = useI18n()

const visible = defineModel<boolean>({ required: true })
const emit = defineEmits<{ uploaded: [] }>()

/** 表单实例仅用于保留原有 ref 绑定（提交前未做整体校验） */
const uploadFormRef = ref<FormInstance>()

const {
  uploading,
  uploadRef,
  form,
  rules,
  acceptString,
  resetForm,
  onFileChange,
  onFileExceed,
  submitUpload,
} = useMaterialUpload({
  onSuccess: () => {
    visible.value = false
    emit('uploaded')
  },
})

/** 每次打开都恢复初始表单（与原 openUploadDialog 行为一致） */
watch(visible, (open) => {
  if (open) resetForm()
})
</script>

<style scoped lang="less">
.upload-uploader {
  width: 100%;

  :deep(.el-upload-dragger) {
    width: 100%;
  }
}

.upload-tip {
  font-size: 12px;
  color: var(--bi-text-muted, #9ca3af);
  line-height: 1.6;
}
</style>
