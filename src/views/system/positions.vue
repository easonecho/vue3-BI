<template>
  <div class="position-page">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索名称/编码"
          clearable
          style="width: 220px"
          @keyup.enter="loadList"
          @clear="loadList"
        />
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px" @change="loadList">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" @click="loadList"><el-icon><Search /></el-icon>&nbsp;查询</el-button>
        <div class="spacer" />
        <el-button type="success" v-permission="'system:position:add'" @click="openCreate">
          <el-icon><Plus /></el-icon>&nbsp;新增岗位
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="岗位名称" min-width="160" />
        <el-table-column prop="code" label="岗位编码" min-width="140">
          <template #default="{ row }"><el-tag size="small">{{ row.code }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              @change="handleToggle(row)"
              active-text="启用"
              inactive-text="禁用"
              inline-prompt
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-permission="'system:position:edit'" link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该岗位吗？" confirm-button-type="danger" @confirm="handleDelete(row)">
              <template #reference>
                <el-button v-permission="'system:position:remove'" link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="mode === 'create' ? '新增岗位' : '编辑岗位'"
      width="500px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="岗位名称" prop="name">
          <el-input v-model="form.name" maxlength="100" show-word-limit placeholder="如 前端工程师" />
        </el-form-item>
        <el-form-item label="岗位编码" prop="code">
          <el-input
            v-model="form.code"
            :disabled="mode === 'edit'"
            maxlength="100"
            show-word-limit
            placeholder="如 FE_001 (全局唯一)"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
import {
  getPositionList,
  createPosition,
  updatePosition,
  deletePosition,
  togglePositionStatus,
  type Position,
  type PositionForm,
} from '@/api/position';

const loading = ref(false);
const list = ref<Position[]>([]);
const filters = reactive<{ keyword: string; status: number | undefined }>({ keyword: '', status: undefined });

async function loadList() {
  loading.value = true;
  try {
    const res = await getPositionList({
      keyword: filters.keyword || undefined,
      status: filters.status,
    });
    list.value = res.data;
  } catch {
    /* noop */
  } finally {
    loading.value = false;
  }
}

const dialogVisible = ref(false);
const mode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<PositionForm & { id?: number; status: number }>({
  name: '',
  code: '',
  sort: 0,
  status: 1,
  description: '',
});
const rules: FormRules = {
  name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入岗位编码', trigger: 'blur' }],
};

function openCreate() {
  mode.value = 'create';
  Object.assign(form, { id: undefined, name: '', code: '', sort: 0, status: 1, description: '' });
  dialogVisible.value = true;
}

function openEdit(row: Position) {
  mode.value = 'edit';
  Object.assign(form, { ...row });
  dialogVisible.value = true;
}

async function submit() {
  if (!formRef.value) return;
  const ok = await formRef.value.validate().catch(() => false);
  if (!ok) return;
  submitting.value = true;
  try {
    if (mode.value === 'create') {
      await createPosition({
        name: form.name,
        code: form.code,
        sort: form.sort,
        status: form.status,
        description: form.description,
      });
      ElMessage.success('创建成功');
    } else if (form.id) {
      await updatePosition(form.id, {
        name: form.name,
        sort: form.sort,
        status: form.status,
        description: form.description,
      });
      ElMessage.success('保存成功');
    }
    dialogVisible.value = false;
    loadList();
  } catch {
    /* noop */
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row: Position) {
  try {
    await deletePosition(row.id);
    ElMessage.success('删除成功');
    loadList();
  } catch {
    /* noop */
  }
}

async function handleToggle(row: Position) {
  try {
    await togglePositionStatus(row.id);
    ElMessage.success('状态切换成功');
    loadList();
  } catch {
    /* noop */
  }
}

onMounted(loadList);
</script>

<style scoped lang="less">
.position-page { width: 100%; }
.filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; .spacer { flex: 1; min-width: 4px; } }
</style>
