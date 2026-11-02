<template>
  <el-form :model="formModel" label-width="80px">
    <el-form-item :label="t('dashboard.name')">
      <el-input
        v-model="name"
        :placeholder="t('dashboard.namePlaceholder')"
        maxlength="50"
        show-word-limit
        @keyup.enter="emit('submit')"
      />
    </el-form-item>
    <el-form-item :label="t('dashboard.description')">
      <el-input
        v-model="description"
        type="textarea"
        :rows="3"
        :placeholder="t('dashboard.descPlaceholder')"
        maxlength="200"
        show-word-limit
      />
    </el-form-item>
    <el-form-item :label="t('dashboard.group')">
      <el-select
        v-model="groupId"
        :placeholder="t('dashboard.groupPlaceholder')"
        clearable
        style="width: 100%"
      >
        <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
      </el-select>
    </el-form-item>
    <el-form-item :label="t('dashboard.isPublic')">
      <el-switch v-model="isPublic" />
      <span class="form-hint">{{ t('dashboard.publicHint') }}</span>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DashboardGroup } from '@/api/types'

defineProps<{
  groups: DashboardGroup[]
}>()

const emit = defineEmits<{
  (e: 'submit'): void
}>()

const name = defineModel<string>('name', { required: true })
const description = defineModel<string>('description', { required: true })
const groupId = defineModel<number | null | undefined>('groupId', { required: true })
const isPublic = defineModel<boolean>('isPublic', { required: true })

const formModel = computed(() => ({
  name: name.value,
  description: description.value,
  groupId: groupId.value,
  isPublic: isPublic.value,
}))

const { t } = useI18n()
</script>

<style scoped lang="less">
.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--bi-text-secondary);
}
</style>
