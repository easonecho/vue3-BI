<template>
  <el-dialog
    v-model="visible"
    :title="dataset ? `告警订阅 - ${dataset.name}` : '告警订阅'"
    width="940px"
    destroy-on-close
    @closed="handleClosed"
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane label="告警规则" name="rules">
        <DatasetAlertRulesTab
          :rules="rules"
          :loading="loadingRules"
          @create="openCreate"
          @refresh="loadRules"
          @toggle-enabled="toggleEnabled"
          @run="runRule"
          @edit="openEdit"
          @delete="removeRule"
        />
      </el-tab-pane>

      <el-tab-pane name="events">
        <template #label>
          告警记录
          <el-badge v-if="unreadCount > 0" :value="unreadCount" class="event-badge" />
        </template>
        <DatasetAlertEventsTab
          v-model:page="eventPage"
          :events="events"
          :loading="loadingEvents"
          :unread-count="unreadCount"
          :total="eventTotal"
          :page-size="eventPageSize"
          @refresh="loadEvents"
          @read-all="readAll"
          @read-event="readEvent"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 新增/编辑规则 -->
    <DatasetAlertRuleFormDialog
      v-model="formVisible"
      :dataset-id="dataset?.id ?? null"
      :editing="editingRule"
      :field-options="fieldOptions"
      @saved="loadRules"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AlertRule } from '@/api/alert'
import DatasetAlertRulesTab from './DatasetAlertRulesTab.vue'
import DatasetAlertEventsTab from './DatasetAlertEventsTab.vue'
import DatasetAlertRuleFormDialog from './DatasetAlertRuleFormDialog.vue'
import { useDatasetAlerts } from '../composables/useDatasetAlerts'

const props = defineProps<{
  modelValue: boolean
  dataset: { id: number; name: string } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeTab = ref<'rules' | 'events'>('rules')

const {
  rules,
  events,
  loadingRules,
  loadingEvents,
  unreadCount,
  eventPage,
  eventPageSize,
  eventTotal,
  fieldOptions,
  onOpen,
  handleClosed: resetAlerts,
  loadRules,
  loadEvents,
  toggleEnabled,
  removeRule,
  runRule,
  readEvent,
  readAll,
} = useDatasetAlerts({
  getDatasetId: () => props.dataset?.id ?? null,
})

// 新增/编辑规则
const formVisible = ref(false)
const editingRule = ref<AlertRule | null>(null)

function openCreate() {
  editingRule.value = null
  formVisible.value = true
}

function openEdit(row: AlertRule) {
  editingRule.value = row
  formVisible.value = true
}

watch(
  () => props.modelValue,
  (value) => {
    if (!value) return
    activeTab.value = 'rules'
    onOpen()
  },
)

watch(activeTab, (tab) => {
  if (tab === 'events') void loadEvents()
})

function handleClosed() {
  resetAlerts()
  formVisible.value = false
  editingRule.value = null
}
</script>

<style scoped lang="less">
.event-badge {
  margin-left: 4px;
  transform: translateY(-8px);
}
</style>
