<template>
  <el-dialog v-model="visible" :title="t('dashboard.renameTitle')" width="400px">
    <el-input
      v-model="name"
      :placeholder="t('dashboard.renamePlaceholder')"
      maxlength="50"
      show-word-limit
    />
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="emit('confirm')">{{
        t('common.confirm')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()

const visible = defineModel<boolean>({ required: true })
const name = defineModel<string>('name', { required: true })

const { t } = useI18n()
</script>
