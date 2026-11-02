<template>
  <el-dialog v-model="visible" title="保存版本快照" width="440px" append-to-body destroy-on-close>
    <el-form label-width="70px">
      <el-form-item label="备注">
        <el-input
          v-model="remark"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="可选，如: 销售看板改版前"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="emit('save')">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
}>()

const visible = defineModel<boolean>({ required: true })
const remark = defineModel<string>('remark', { required: true })
</script>
