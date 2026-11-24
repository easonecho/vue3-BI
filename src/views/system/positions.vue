<template>
  <div class="position-page">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          :placeholder="t('positionPage.searchPlaceholder')"
          clearable
          style="width: 220px"
          @keyup.enter="loadList"
          @clear="loadList"
        />
        <el-select
          v-model="filters.status"
          :placeholder="t('positionPage.status')"
          clearable
          style="width: 120px"
          @change="loadList"
        >
          <el-option :label="t('positionPage.enabled')" :value="1" />
          <el-option :label="t('positionPage.disabled')" :value="0" />
        </el-select>
        <el-button type="primary" @click="loadList"
          ><el-icon><Search /></el-icon>&nbsp;{{ t('positionPage.query') }}</el-button
        >
        <div class="spacer" />
        <el-button v-permission="'system:position:add'" type="success" @click="openCreate">
          <el-icon><Plus /></el-icon>&nbsp;{{ t('positionPage.create') }}
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" :label="t('positionPage.name')" min-width="160" />
        <el-table-column prop="code" :label="t('positionPage.code')" min-width="140">
          <template #default="{ row }"
            ><el-tag size="small">{{ row.code }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="sort" :label="t('positionPage.sort')" width="80" align="center" />
        <el-table-column :label="t('positionPage.status')" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              :active-text="t('positionPage.enabled')"
              :inactive-text="t('positionPage.disabled')"
              inline-prompt
              @change="handleToggle(row)"
            />
          </template>
        </el-table-column>
        <el-table-column
          prop="description"
          :label="t('positionPage.description')"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column :label="t('common.actions')" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'system:position:edit'"
              link
              type="primary"
              size="small"
              @click="openEdit(row)"
              >{{ t('common.edit') }}</el-button
            >
            <el-popconfirm
              :title="t('positionPage.deleteConfirm')"
              confirm-button-type="danger"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button
                  v-permission="'system:position:remove'"
                  link
                  type="danger"
                  size="small"
                  >{{ t('common.delete') }}</el-button
                >
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="mode === 'create' ? t('positionPage.create') : t('positionPage.editTitle')"
      width="500px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item :label="t('positionPage.name')" prop="name">
          <el-input
            v-model="form.name"
            maxlength="100"
            show-word-limit
            :placeholder="t('positionPage.namePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('positionPage.code')" prop="code">
          <el-input
            v-model="form.code"
            :disabled="mode === 'edit'"
            maxlength="100"
            show-word-limit
            :placeholder="t('positionPage.codePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('positionPage.sort')">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item :label="t('positionPage.status')">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">{{ t('positionPage.enabled') }}</el-radio>
            <el-radio :value="0">{{ t('positionPage.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('positionPage.description')">
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
          t('positionPage.confirm')
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import {
  getPositionList,
  createPosition,
  updatePosition,
  deletePosition,
  togglePositionStatus,
  type Position,
  type PositionForm,
} from '@/api/position'

const { t } = useI18n()

const loading = ref(false)
const list = ref<Position[]>([])
const filters = reactive<{ keyword: string; status: number | undefined }>({
  keyword: '',
  status: undefined,
})

async function loadList() {
  loading.value = true
  try {
    const res = await getPositionList({
      keyword: filters.keyword || undefined,
      status: filters.status,
    })
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
const form = reactive<PositionForm & { id?: number; status: number }>({
  name: '',
  code: '',
  sort: 0,
  status: 1,
  description: '',
})
const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('positionPage.nameRequired'), trigger: 'blur' }],
  code: [{ required: true, message: t('positionPage.codeRequired'), trigger: 'blur' }],
}))

function openCreate() {
  mode.value = 'create'
  Object.assign(form, { id: undefined, name: '', code: '', sort: 0, status: 1, description: '' })
  dialogVisible.value = true
}

function openEdit(row: Position) {
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
      await createPosition({
        name: form.name,
        code: form.code,
        sort: form.sort,
        status: form.status,
        description: form.description,
      })
      ElMessage.success(t('positionPage.createSuccess'))
    } else if (form.id) {
      await updatePosition(form.id, {
        name: form.name,
        sort: form.sort,
        status: form.status,
        description: form.description,
      })
      ElMessage.success(t('positionPage.saveSuccess'))
    }
    dialogVisible.value = false
    loadList()
  } catch {
    /* noop */
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: Position) {
  try {
    await deletePosition(row.id)
    ElMessage.success(t('positionPage.deleteSuccess'))
    loadList()
  } catch {
    /* noop */
  }
}

async function handleToggle(row: Position) {
  try {
    await togglePositionStatus(row.id)
    ElMessage.success(t('positionPage.toggleSuccess'))
    loadList()
  } catch {
    /* noop */
  }
}

onMounted(loadList)
</script>

<style scoped lang="less">
.position-page {
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
</style>
