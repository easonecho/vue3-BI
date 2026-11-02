<template>
  <el-dialog v-model="visible" title="重命名看板" width="400px">
    <el-input v-model="name" placeholder="请输入看板名称" maxlength="50" show-word-limit />
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="emit('confirm')">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()

const visible = defineModel<boolean>({ required: true })
const name = defineModel<string>('name', { required: true })
</script>
