<template>
  <div class="config-page">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          :placeholder="t('configPage.searchPlaceholder')"
          clearable
          style="width: 240px"
          @keyup.enter="loadList"
          @clear="loadList"
        />
        <el-button type="primary" @click="loadList"
          ><el-icon><Search /></el-icon>&nbsp;{{ t('configPage.query') }}</el-button
        >
        <div class="spacer" />
        <el-button v-permission="'system:config:add'" type="success" @click="openCreate">
          <el-icon><Plus /></el-icon>&nbsp;{{ t('configPage.create') }}
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="configKey" :label="t('configPage.configKey')" min-width="180">
          <template #default="{ row }"
            ><el-tag size="small">{{ row.configKey }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="configName" :label="t('configPage.configName')" min-width="140" />
        <el-table-column :label="t('configPage.configValue')" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="config-value">{{ row.configValue || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('configPage.type')" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="typeTag(row.configType)">{{ row.configType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" :label="t('configPage.sort')" width="70" align="center" />
        <el-table-column
          prop="description"
          :label="t('configPage.description')"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column :label="t('common.actions')" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'system:config:edit'"
              link
              type="primary"
              size="small"
              @click="openEdit(row)"
              >{{ t('common.edit') }}</el-button
            >
            <el-popconfirm
              :title="t('configPage.deleteConfirm')"
              confirm-button-type="danger"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button v-permission="'system:config:remove'" link type="danger" size="small">{{
                  t('common.delete')
                }}</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="mode === 'create' ? t('configPage.createTitle') : t('configPage.editTitle')"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item :label="t('configPage.configKey')" prop="configKey">
          <el-input
            v-model="form.configKey"
            :disabled="mode === 'edit'"
            maxlength="100"
            show-word-limit
            :placeholder="t('configPage.configKeyPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('configPage.configName')" prop="configName">
          <el-input
            v-model="form.configName"
            maxlength="100"
            show-word-limit
            :placeholder="t('configPage.configNamePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('configPage.configValue')">
          <el-input
            v-model="form.configValue"
            type="textarea"
            :rows="3"
            :placeholder="t('configPage.configValuePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('configPage.type')" prop="configType">
          <el-radio-group v-model="form.configType">
            <el-radio value="string">{{ t('configPage.stringType') }}</el-radio>
            <el-radio value="number">{{ t('configPage.numberType') }}</el-radio>
            <el-radio value="boolean">{{ t('configPage.booleanType') }}</el-radio>
            <el-radio value="json">{{ t('configPage.jsonType') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('configPage.sort')">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item :label="t('configPage.description')">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">{{
          t('common.confirm')
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import {
  getSystemConfigList,
  createSystemConfig,
  updateSystemConfig,
  deleteSystemConfig,
  type SystemConfig,
  type SystemConfigForm,
} from '@/api/system-config'

const { t } = useI18n()

const loading = ref(false)
const list = ref<SystemConfig[]>([])
const filters = reactive({ keyword: '' })

async function loadList() {
  loading.value = true
  try {
    const res = await getSystemConfigList(filters.keyword || undefined)
    list.value = res.data
  } catch {
    /* noop */
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<SystemConfigForm & { id?: number }>({
  configKey: '',
  configName: '',
  configValue: '',
  configType: 'string',
  sort: 0,
  description: '',
})
const rules = computed<FormRules>(() => ({
  configKey: [{ required: true, message: t('configPage.configKeyRequired'), trigger: 'blur' }],
  configName: [{ required: true, message: t('configPage.configNameRequired'), trigger: 'blur' }],
  configType: [{ required: true, message: t('configPage.typeRequired'), trigger: 'change' }],
}))

function openCreate() {
  mode.value = 'create'
  Object.assign(form, {
    id: undefined,
    configKey: '',
    configName: '',
    configValue: '',
    configType: 'string',
    sort: 0,
    description: '',
  })
  dialogVisible.value = true
}

function openEdit(row: SystemConfig) {
  mode.value = 'edit'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function submit() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    if (mode.value === 'create') {
      await createSystemConfig({
        configKey: form.configKey,
        configName: form.configName,
        configValue: form.configValue,
        configType: form.configType,
        sort: form.sort,
        description: form.description,
      })
      ElMessage.success(t('configPage.created'))
    } else if (form.id) {
      await updateSystemConfig(form.id, {
        configKey: form.configKey,
        configName: form.configName,
        configValue: form.configValue,
        configType: form.configType,
        sort: form.sort,
        description: form.description,
      })
      ElMessage.success(t('configPage.saved'))
    }
    dialogVisible.value = false
    loadList()
  } catch {
    /* noop */
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: SystemConfig) {
  try {
    await deleteSystemConfig(row.id)
    ElMessage.success(t('configPage.deleted'))
    loadList()
  } catch {
    /* noop */
  }
}

function typeTag(t: string) {
  const map: Record<string, string> = {
    string: 'info',
    number: 'warning',
    boolean: 'success',
    json: 'primary',
  }
  return map[t] || 'info'
}

onMounted(loadList)
</script>

<style scoped lang="less">
.config-page {
  width: 100%;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  .spacer {
    flex: 1;
    min-width: 4px;
  }
}
.config-value {
  font-family: 'Consolas', 'Monaco', monospace;
  color: #4b5563;
}
</style>
