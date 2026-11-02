<template>
  <el-dialog
    v-model="visible"
    :title="dashboard ? `定时报表 - ${dashboard.name}` : '定时报表'"
    width="1040px"
    destroy-on-close
    @closed="handleClosed"
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane label="订阅配置" name="subs">
        <ReportSubscriptionsTab
          :subscriptions="subscriptions"
          :loading="loadingSubs"
          @create="openCreate"
          @refresh="loadSubscriptions"
          @toggle-enabled="toggleEnabled"
          @edit="openEdit"
          @delete="removeSubscription"
          @run-now="runNow"
        />
      </el-tab-pane>

      <el-tab-pane name="deliveries">
        <template #label>
          投递记录
          <el-badge v-if="unreadCount > 0" :value="unreadCount" class="delivery-badge" />
        </template>
        <ReportDeliveriesTab
          v-model:page="deliveryPage"
          :deliveries="deliveries"
          :loading="loadingDeliveries"
          :total="deliveryTotal"
          :page-size="deliveryPageSize"
          @refresh="loadDeliveries"
          @preview="previewDelivery"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 新增/编辑订阅 -->
    <ReportSubscriptionFormDialog
      v-model="formVisible"
      :dashboard-id="dashboard?.id ?? null"
      :editing="editingSubscription"
      @saved="loadSubscriptions"
    />

    <!-- 报表快照预览 -->
    <ReportSnapshotPreview
      v-model="previewVisible"
      :title="previewTitle"
      :error="previewError"
      :snapshot="snapshot"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ReportSubscription } from '@/api/report'
import ReportSubscriptionsTab from './ReportSubscriptionsTab.vue'
import ReportDeliveriesTab from './ReportDeliveriesTab.vue'
import ReportSubscriptionFormDialog from './ReportSubscriptionFormDialog.vue'
import ReportSnapshotPreview from './ReportSnapshotPreview.vue'
import { useReportDeliveries } from '../composables/useReportDeliveries'
import { useReportSubscriptions } from '../composables/useReportSubscriptions'

const props = defineProps<{
  modelValue: boolean
  dashboard: { id: number; name: string } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeTab = ref<'subs' | 'deliveries'>('subs')

const getDashboardId = () => props.dashboard?.id ?? null

const deliveriesApi = useReportDeliveries({ getDashboardId })
const subscriptionsApi = useReportSubscriptions({
  getDashboardId,
  getActiveTab: () => activeTab.value,
  loadUnreadCount: deliveriesApi.loadUnreadCount,
  loadDeliveries: deliveriesApi.loadDeliveries,
})

const {
  subscriptions,
  loadingSubs,
  loadSubscriptions,
  toggleEnabled,
  removeSubscription,
  runNow,
  resetSubscriptions,
} = subscriptionsApi

const {
  deliveries,
  loadingDeliveries,
  unreadCount,
  deliveryPage,
  deliveryPageSize,
  deliveryTotal,
  previewVisible,
  previewTitle,
  previewError,
  snapshot,
  loadDeliveries,
  loadUnreadCount,
  resetDeliveries,
  previewDelivery,
} = deliveriesApi

// 新增/编辑订阅
const formVisible = ref(false)
const editingSubscription = ref<ReportSubscription | null>(null)

function openCreate() {
  editingSubscription.value = null
  formVisible.value = true
}

function openEdit(row: ReportSubscription) {
  editingSubscription.value = row
  formVisible.value = true
}

watch(
  () => props.modelValue,
  (value) => {
    if (!value) return
    activeTab.value = 'subs'
    void loadSubscriptions()
    void loadUnreadCount()
  },
)

watch(activeTab, (tab) => {
  if (tab === 'deliveries') void loadDeliveries()
})

function handleClosed() {
  resetSubscriptions()
  resetDeliveries()
  formVisible.value = false
  editingSubscription.value = null
}
</script>

<style scoped lang="less">
.delivery-badge {
  margin-left: 4px;
  transform: translateY(-8px);
}
</style>
