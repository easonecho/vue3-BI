<template>
  <div class="dict-page">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="搜索类型/名称" clearable style="width: 240px" @keyup.enter="loadList" @clear="loadList" />
        <el-button type="primary" @click="loadList"><el-icon><Search /></el-icon>&nbsp;查询</el-button>
        <div class="spacer" />
        <el-button type="success" @click="openCreate"><el-icon><Plus /></el-icon>&nbsp;新增字典</el-button>
      </div>

      <el-table v-loading="loading" :data="filteredList" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="type" label="字典类型" width="180">
          <template #default="{ row }"><el-tag size="small">{{ row.type }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="name" label="字典名称" min-width="160" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="字典项数" width="100" align="center">
          <template #default="{ row }">{{ row._count?.items ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openItems(row)">管理字典项</el-button>
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该字典吗？（含字典项将一并删除）" confirm-button-type="danger" @confirm="handleDelete(row)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑字典弹窗 -->
    <el-dialog v-model="dictDialogVisible" :title="mode === 'create' ? '新增字典' : '编辑字典'" width="500px" destroy-on-close>
      <el-form ref="dictFormRef" :model="dictForm" :rules="dictRules" label-width="90px">
        <el-form-item label="字典类型" prop="type">
          <el-input v-model="dictForm.type" :disabled="mode === 'edit'" maxlength="50" show-word-limit placeholder="如 chart_type" />
        </el-form-item>
        <el-form-item label="字典名称" prop="name">
          <el-input v-model="dictForm.name" maxlength="100" show-word-limit placeholder="如 图表类型" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="dictForm.description" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="dictForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dictDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitDict">确定</el-button>
      </template>
    </el-dialog>

    <!-- 字典项管理弹窗 -->
    <el-dialog v-model="itemDialogVisible" :title="`管理字典项 - ${currentDict?.name || ''}`" width="720px" destroy-on-close>
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center">
        <span style="color: #6b7280; font-size: 13px">类型: <el-tag size="small">{{ currentDict?.type }}</el-tag></span>
        <el-button type="primary" size="small" @click="openCreateItem"><el-icon><Plus /></el-icon>&nbsp;新增字典项</el-button>
      </div>
      <el-table v-loading="itemLoading" :data="itemList" border size="small">
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="label" label="显示文本" min-width="140" />
        <el-table-column prop="value" label="存储值" min-width="140" />
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditItem(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDeleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 字典项内嵌编辑表单 -->
      <el-dialog v-model="itemFormVisible" :title="itemMode === 'create' ? '新增字典项' : '编辑字典项'" width="420px" append-to-body destroy-on-close>
        <el-form :model="itemForm" label-width="80px">
          <el-form-item label="显示文本"><el-input v-model="itemForm.label" maxlength="100" /></el-form-item>
          <el-form-item label="存储值"><el-input v-model="itemForm.value" maxlength="100" /></el-form-item>
          <el-form-item label="排序"><el-input-number v-model="itemForm.sort" :min="0" /></el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="itemForm.status">
              <el-radio :value="1">启用</el-radio>
              <el-radio :value="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="itemFormVisible = false">取消</el-button>
          <el-button type="primary" :loading="itemSubmitting" @click="submitItem">确定</el-button>
        </template>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
import { getDictList, createDict, updateDict, deleteDict, getDictItems, createDictItem, updateDictItem, deleteDictItem, type Dict, type DictItem } from '@/api/dict';

const loading = ref(false);
const list = ref<Dict[]>([]);
const filters = reactive({ keyword: '' });

const filteredList = computed(() => {
  if (!filters.keyword) return list.value;
  const kw = filters.keyword.toLowerCase();
  return list.value.filter(d => d.type.toLowerCase().includes(kw) || d.name.toLowerCase().includes(kw));
});

async function loadList() {
  loading.value = true;
  try { list.value = await getDictList().then(r => r.data); } catch { /* noop */ } finally { loading.value = false; }
}

// ---- Dict 弹窗 ----
const dictDialogVisible = ref(false);
const mode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const dictFormRef = ref<FormInstance>();
const dictForm = reactive<any>({ id: undefined, type: '', name: '', description: '', status: 1 });
const dictRules: FormRules = {
  type: [{ required: true, message: '请输入字典类型', trigger: 'blur' }],
  name: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
};

function openCreate() {
  mode.value = 'create';
  Object.assign(dictForm, { id: undefined, type: '', name: '', description: '', status: 1 });
  dictDialogVisible.value = true;
}
function openEdit(row: Dict) {
  mode.value = 'edit';
  Object.assign(dictForm, { ...row });
  dictDialogVisible.value = true;
}
async function submitDict() {
  if (!dictFormRef.value) return;
  const ok = await dictFormRef.value.validate().catch(() => false);
  if (!ok) return;
  submitting.value = true;
  try {
    if (mode.value === 'create') {
      await createDict({ type: dictForm.type, name: dictForm.name, description: dictForm.description, status: dictForm.status });
      ElMessage.success('创建成功');
    } else if (dictForm.id) {
      await updateDict(dictForm.id, { name: dictForm.name, description: dictForm.description, status: dictForm.status });
      ElMessage.success('保存成功');
    }
    dictDialogVisible.value = false;
    loadList();
  } catch { /* noop */ } finally { submitting.value = false; }
}
async function handleDelete(row: Dict) {
  try { await deleteDict(row.id); ElMessage.success('删除成功'); loadList(); } catch { /* noop */ }
}

// ---- DictItem ----
const itemDialogVisible = ref(false);
const itemLoading = ref(false);
const currentDict = ref<Dict | null>(null);
const itemList = ref<DictItem[]>([]);

const itemFormVisible = ref(false);
const itemMode = ref<'create' | 'edit'>('create');
const itemSubmitting = ref(false);
const itemForm = reactive<any>({ id: undefined, dictId: 0, label: '', value: '', sort: 0, status: 1 });

async function openItems(row: Dict) {
  currentDict.value = row;
  itemDialogVisible.value = true;
  itemLoading.value = true;
  try { itemList.value = await getDictItems(row.id).then(r => r.data); } catch { /* noop */ } finally { itemLoading.value = false; }
}
function openCreateItem() {
  itemMode.value = 'create';
  Object.assign(itemForm, { id: undefined, dictId: currentDict.value?.id, label: '', value: '', sort: 0, status: 1 });
  itemFormVisible.value = true;
}
function openEditItem(row: DictItem) {
  itemMode.value = 'edit';
  Object.assign(itemForm, { ...row });
  itemFormVisible.value = true;
}
async function submitItem() {
  itemSubmitting.value = true;
  try {
    if (itemMode.value === 'create') {
      await createDictItem({ dictId: itemForm.dictId, label: itemForm.label, value: itemForm.value, sort: itemForm.sort, status: itemForm.status });
      ElMessage.success('创建成功');
    } else if (itemForm.id) {
      await updateDictItem(itemForm.id, { label: itemForm.label, value: itemForm.value, sort: itemForm.sort, status: itemForm.status });
      ElMessage.success('保存成功');
    }
    itemFormVisible.value = false;
    if (currentDict.value) itemList.value = await getDictItems(currentDict.value.id).then(r => r.data);
  } catch { /* noop */ } finally { itemSubmitting.value = false; }
}
async function handleDeleteItem(row: DictItem) {
  try { await deleteDictItem(row.id); ElMessage.success('删除成功'); if (currentDict.value) itemList.value = await getDictItems(currentDict.value.id).then(r => r.data); } catch { /* noop */ }
}

onMounted(loadList);
</script>

<style scoped lang="less">
.dict-page { width: 100%; }
.filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; .spacer { flex: 1; min-width: 4px; } }
</style>
