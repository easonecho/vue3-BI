<template>
  <div class="dict-page">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          :placeholder="t('dictPage.searchPlaceholder')"
          clearable
          style="width: 240px"
          @keyup.enter="loadList"
          @clear="loadList"
        />
        <el-button type="primary" @click="loadList"
          ><el-icon><Search /></el-icon>&nbsp;{{ t('dictPage.query') }}</el-button
        >
        <div class="spacer" />
        <el-button v-permission="'system:dict:add'" type="success" @click="openCreate"
          ><el-icon><Plus /></el-icon>&nbsp;{{ t('dictPage.create') }}</el-button
        >
      </div>

      <el-table v-loading="loading" :data="filteredList" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="type" :label="t('dictPage.type')" width="180">
          <template #default="{ row }"
            ><el-tag size="small">{{ row.type }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="name" :label="t('dictPage.name')" min-width="160" />
        <el-table-column
          prop="description"
          :label="t('dictPage.description')"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column :label="t('dictPage.itemCount')" width="100" align="center">
          <template #default="{ row }">{{ row._count?.items ?? 0 }}</template>
        </el-table-column>
        <el-table-column :label="t('dictPage.status')" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 1 ? 'success' : 'danger'">{{
              row.status === 1 ? t('dictPage.enabled') : t('dictPage.disabled')
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openItems(row)">{{
              t('dictPage.manageItems')
            }}</el-button>
            <el-button
              v-permission="'system:dict:edit'"
              link
              type="primary"
              size="small"
              @click="openEdit(row)"
              >{{ t('common.edit') }}</el-button
            >
            <el-popconfirm
              :title="t('dictPage.deleteConfirm')"
              confirm-button-type="danger"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button v-permission="'system:dict:remove'" link type="danger" size="small">{{
                  t('common.delete')
                }}</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑字典弹窗 -->
    <el-dialog
      v-model="dictDialogVisible"
      :title="mode === 'create' ? t('dictPage.create') : t('dictPage.editTitle')"
      width="500px"
      destroy-on-close
    >
      <el-form ref="dictFormRef" :model="dictForm" :rules="dictRules" label-width="90px">
        <el-form-item :label="t('dictPage.type')" prop="type">
          <el-input
            v-model="dictForm.type"
            :disabled="mode === 'edit'"
            maxlength="50"
            show-word-limit
            :placeholder="t('dictPage.typePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('dictPage.name')" prop="name">
          <el-input
            v-model="dictForm.name"
            maxlength="100"
            show-word-limit
            :placeholder="t('dictPage.namePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('dictPage.description')">
          <el-input
            v-model="dictForm.description"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('dictPage.status')">
          <el-radio-group v-model="dictForm.status">
            <el-radio :value="1">{{ t('dictPage.enabled') }}</el-radio>
            <el-radio :value="0">{{ t('dictPage.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dictDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitDict">{{
          t('common.confirm')
        }}</el-button>
      </template>
    </el-dialog>

    <!-- 字典项管理弹窗 -->
    <el-dialog
      v-model="itemDialogVisible"
      :title="t('dictPage.itemsTitle', { name: currentDict?.name || '' })"
      width="720px"
      destroy-on-close
    >
      <div
        style="
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <span style="color: #6b7280; font-size: 13px"
          >{{ t('dictPage.typePrefix') }}:
          <el-tag size="small">{{ currentDict?.type }}</el-tag></span
        >
        <el-button
          v-permission="'system:dict:add'"
          type="primary"
          size="small"
          @click="openCreateItem"
          ><el-icon><Plus /></el-icon>&nbsp;{{ t('dictPage.createItem') }}</el-button
        >
      </div>
      <el-table v-loading="itemLoading" :data="itemList" border size="small">
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="label" :label="t('dictPage.label')" min-width="140" />
        <el-table-column prop="value" :label="t('dictPage.value')" min-width="140" />
        <el-table-column prop="sort" :label="t('dictPage.sort')" width="70" align="center" />
        <el-table-column :label="t('dictPage.status')" width="70" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 1 ? 'success' : 'danger'">{{
              row.status === 1 ? t('dictPage.enabled') : t('dictPage.disabled')
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="140" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'system:dict:edit'"
              link
              type="primary"
              size="small"
              @click="openEditItem(row)"
              >{{ t('common.edit') }}</el-button
            >
            <el-button
              v-permission="'system:dict:remove'"
              link
              type="danger"
              size="small"
              @click="handleDeleteItem(row)"
              >{{ t('common.delete') }}</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <!-- 字典项内嵌编辑表单 -->
      <el-dialog
        v-model="itemFormVisible"
        :title="itemMode === 'create' ? t('dictPage.createItem') : t('dictPage.editItemTitle')"
        width="420px"
        append-to-body
        destroy-on-close
      >
        <el-form :model="itemForm" label-width="80px">
          <el-form-item :label="t('dictPage.label')"
            ><el-input v-model="itemForm.label" maxlength="100"
          /></el-form-item>
          <el-form-item :label="t('dictPage.value')"
            ><el-input v-model="itemForm.value" maxlength="100"
          /></el-form-item>
          <el-form-item :label="t('dictPage.sort')"
            ><el-input-number v-model="itemForm.sort" :min="0"
          /></el-form-item>
          <el-form-item :label="t('dictPage.status')">
            <el-radio-group v-model="itemForm.status">
              <el-radio :value="1">{{ t('dictPage.enabled') }}</el-radio>
              <el-radio :value="0">{{ t('dictPage.disabled') }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="itemFormVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="itemSubmitting" @click="submitItem">{{
            t('common.confirm')
          }}</el-button>
        </template>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import {
  getDictList,
  createDict,
  updateDict,
  deleteDict,
  getDictItems,
  createDictItem,
  updateDictItem,
  deleteDictItem,
  type Dict,
  type DictItem,
} from '@/api/dict'

const { t } = useI18n()

const loading = ref(false)
const list = ref<Dict[]>([])
const filters = reactive({ keyword: '' })

const filteredList = computed(() => {
  if (!filters.keyword) return list.value
  const kw = filters.keyword.toLowerCase()
  return list.value.filter(
    (d) => d.type.toLowerCase().includes(kw) || d.name.toLowerCase().includes(kw),
  )
})

async function loadList() {
  loading.value = true
  try {
    list.value = await getDictList().then((r) => r.data)
  } catch {
    /* noop */
  } finally {
    loading.value = false
  }
}

// ---- Dict 弹窗 ----
const dictDialogVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const dictFormRef = ref<FormInstance>()
const dictForm = reactive<{
  id?: number
  type: string
  name: string
  description: string
  status: number
}>({ id: undefined, type: '', name: '', description: '', status: 1 })
const dictRules = computed<FormRules>(() => ({
  type: [{ required: true, message: t('dictPage.typeRequired'), trigger: 'blur' }],
  name: [{ required: true, message: t('dictPage.nameRequired'), trigger: 'blur' }],
}))

function openCreate() {
  mode.value = 'create'
  Object.assign(dictForm, { id: undefined, type: '', name: '', description: '', status: 1 })
  dictDialogVisible.value = true
}
function openEdit(row: Dict) {
  mode.value = 'edit'
  Object.assign(dictForm, { ...row })
  dictDialogVisible.value = true
}
async function submitDict() {
  if (!dictFormRef.value) return
  const ok = await dictFormRef.value.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    if (mode.value === 'create') {
      await createDict({
        type: dictForm.type,
        name: dictForm.name,
        description: dictForm.description,
        status: dictForm.status,
      })
      ElMessage.success(t('dictPage.created'))
    } else if (dictForm.id) {
      await updateDict(dictForm.id, {
        name: dictForm.name,
        description: dictForm.description,
        status: dictForm.status,
      })
      ElMessage.success(t('dictPage.saved'))
    }
    dictDialogVisible.value = false
    loadList()
  } catch {
    /* noop */
  } finally {
    submitting.value = false
  }
}
async function handleDelete(row: Dict) {
  try {
    await deleteDict(row.id)
    ElMessage.success(t('dictPage.deleted'))
    loadList()
  } catch {
    /* noop */
  }
}

// ---- DictItem ----
const itemDialogVisible = ref(false)
const itemLoading = ref(false)
const currentDict = ref<Dict | null>(null)
const itemList = ref<DictItem[]>([])

const itemFormVisible = ref(false)
const itemMode = ref<'create' | 'edit'>('create')
const itemSubmitting = ref(false)
const itemForm = reactive<{
  id?: number
  dictId: number
  label: string
  value: string
  sort: number
  status: number
}>({ id: undefined, dictId: 0, label: '', value: '', sort: 0, status: 1 })

async function openItems(row: Dict) {
  currentDict.value = row
  itemDialogVisible.value = true
  itemLoading.value = true
  try {
    itemList.value = await getDictItems(row.id).then((r) => r.data)
  } catch {
    /* noop */
  } finally {
    itemLoading.value = false
  }
}
function openCreateItem() {
  itemMode.value = 'create'
  Object.assign(itemForm, {
    id: undefined,
    dictId: currentDict.value?.id ?? 0,
    label: '',
    value: '',
    sort: 0,
    status: 1,
  })
  itemFormVisible.value = true
}
function openEditItem(row: DictItem) {
  itemMode.value = 'edit'
  Object.assign(itemForm, { ...row })
  itemFormVisible.value = true
}
async function submitItem() {
  itemSubmitting.value = true
  try {
    if (itemMode.value === 'create') {
      await createDictItem({
        dictId: itemForm.dictId,
        label: itemForm.label,
        value: itemForm.value,
        sort: itemForm.sort,
        status: itemForm.status,
      })
      ElMessage.success(t('dictPage.created'))
    } else if (itemForm.id) {
      await updateDictItem(itemForm.id, {
        label: itemForm.label,
        value: itemForm.value,
        sort: itemForm.sort,
        status: itemForm.status,
      })
      ElMessage.success(t('dictPage.saved'))
    }
    itemFormVisible.value = false
    if (currentDict.value)
      itemList.value = await getDictItems(currentDict.value.id).then((r) => r.data)
  } catch {
    /* noop */
  } finally {
    itemSubmitting.value = false
  }
}
async function handleDeleteItem(row: DictItem) {
  try {
    await deleteDictItem(row.id)
    ElMessage.success(t('dictPage.deleted'))
    if (currentDict.value)
      itemList.value = await getDictItems(currentDict.value.id).then((r) => r.data)
  } catch {
    /* noop */
  }
}

onMounted(loadList)
</script>

<style scoped lang="less">
.dict-page {
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
