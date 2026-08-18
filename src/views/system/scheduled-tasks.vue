<template>
  <div class="task-page">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索任务名称/处理器"
          clearable
          style="width: 240px"
          @keyup.enter="loadList"
          @clear="loadList"
        />
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px" @change="loadList">
          <el-option label="运行中" :value="1" />
          <el-option label="暂停" :value="0" />
        </el-select>
        <el-button type="primary" @click="loadList"><el-icon><Search /></el-icon>&nbsp;查询</el-button>
        <div class="spacer" />
        <el-button type="success" v-permission="'system:task:add'" @click="openCreate">
          <el-icon><Plus /></el-icon>&nbsp;新增任务
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="任务名称" min-width="160" />
        <el-table-column label="cron 表达式" width="160">
          <template #default="{ row }"><code class="cron-code">{{ row.cron }}</code></template>
        </el-table-column>
        <el-table-column prop="handler" label="处理器" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              @change="handleToggle(row)"
              active-text="运行"
              inactive-text="暂停"
              inline-prompt
            />
          </template>
        </el-table-column>
        <el-table-column label="最后执行" width="170">
          <template #default="{ row }">
            <span v-if="row.lastRunAt">{{ formatTime(row.lastRunAt) }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="最后结果" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.lastResult" class="result-text">{{ row.lastResult }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-permission="'system:task:run'" link type="success" size="small" @click="handleRun(row)">
              执行
            </el-button>
            <el-button v-permission="'system:task:edit'" link type="primary" size="small" @click="openEdit(row)">
              编辑
            </el-button>
            <el-popconfirm title="确定删除该任务吗？" confirm-button-type="danger" @confirm="handleDelete(row)">
              <template #reference>
                <el-button v-permission="'system:task:remove'" link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="cron-tips">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            cron 表达式说明: 分 时 日 月 周 (5 段) 或 秒 分 时 日 月 周 (6 段)。例:
            <code>0 2 * * *</code> = 每天凌晨 2 点; <code>*/5 * * * *</code> = 每 5 分钟。
          </template>
        </el-alert>
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="mode === 'create' ? '新增定时任务' : '编辑定时任务'"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" maxlength="100" show-word-limit placeholder="如 清理操作日志" />
        </el-form-item>
        <el-form-item label="cron 表达式" prop="cron">
          <el-input v-model="form.cron" maxlength="50" placeholder="如 0 2 * * *">
            <template #append>
              <el-tooltip content="常用: 0 2 * * * (每天2点) / */5 * * * * (每5分钟) / 0 0 1 * * (每月1号)">
                <el-button><el-icon><QuestionFilled /></el-icon></el-button>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="处理器路径" prop="handler">
          <el-input v-model="form.handler" maxlength="200" placeholder="如 ./handlers/clean-logs" />
        </el-form-item>
        <el-form-item label="参数 (JSON)">
          <el-input
            v-model="paramsText"
            type="textarea"
            :rows="3"
            placeholder='{"days": 30}'
          />
          <span v-if="paramsError" class="error-text">{{ paramsError }}</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">运行中</el-radio>
            <el-radio :value="0">暂停</el-radio>
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
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Plus, QuestionFilled } from '@element-plus/icons-vue';
import {
  getScheduledTaskList,
  createScheduledTask,
  updateScheduledTask,
  deleteScheduledTask,
  toggleScheduledTaskStatus,
  runScheduledTask,
  type ScheduledTask,
  type ScheduledTaskForm,
} from '@/api/scheduled-task';

const loading = ref(false);
const list = ref<ScheduledTask[]>([]);
const filters = reactive<{ keyword: string; status: number | undefined }>({ keyword: '', status: undefined });

async function loadList() {
  loading.value = true;
  try {
    const res = await getScheduledTaskList({
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

function formatTime(t: string) {
  const d = new Date(t);
  return d.toLocaleString('zh-CN', { hour12: false });
}

const dialogVisible = ref(false);
const mode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<ScheduledTaskForm & { id?: number; status: number }>({
  name: '',
  cron: '',
  handler: '',
  params: {},
  status: 1,
  description: '',
});
const paramsText = ref('{}');
const paramsError = ref('');

const rules: FormRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  cron: [{ required: true, message: '请输入 cron 表达式', trigger: 'blur' }],
  handler: [{ required: true, message: '请输入处理器路径', trigger: 'blur' }],
};

watch(paramsText, (val) => {
  if (!val || val.trim() === '') {
    paramsError.value = '';
    form.params = {};
    return;
  }
  try {
    form.params = JSON.parse(val);
    paramsError.value = '';
  } catch (e) {
    paramsError.value = 'JSON 格式错误';
  }
});

function openCreate() {
  mode.value = 'create';
  Object.assign(form, {
    id: undefined,
    name: '',
    cron: '',
    handler: '',
    params: {},
    status: 1,
    description: '',
  });
  paramsText.value = '{}';
  dialogVisible.value = true;
}

function openEdit(row: ScheduledTask) {
  mode.value = 'edit';
  Object.assign(form, { ...row });
  paramsText.value = row.params ? JSON.stringify(row.params, null, 2) : '{}';
  dialogVisible.value = true;
}

async function submit() {
  if (!formRef.value) return;
  const ok = await formRef.value.validate().catch(() => false);
  if (!ok) return;
  if (paramsError.value) {
    ElMessage.warning('请修正参数 JSON 格式');
    return;
  }
  submitting.value = true;
  try {
    if (mode.value === 'create') {
      await createScheduledTask({
        name: form.name,
        cron: form.cron,
        handler: form.handler,
        params: form.params,
        status: form.status,
        description: form.description,
      });
      ElMessage.success('创建成功');
    } else if (form.id) {
      await updateScheduledTask(form.id, {
        name: form.name,
        cron: form.cron,
        handler: form.handler,
        params: form.params,
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

async function handleDelete(row: ScheduledTask) {
  try {
    await deleteScheduledTask(row.id);
    ElMessage.success('删除成功');
    loadList();
  } catch {
    /* noop */
  }
}

async function handleToggle(row: ScheduledTask) {
  try {
    await toggleScheduledTaskStatus(row.id);
    ElMessage.success('状态切换成功');
    loadList();
  } catch {
    /* noop */
  }
}

async function handleRun(row: ScheduledTask) {
  try {
    await ElMessageBox.confirm(`确定立即执行任务「${row.name}」吗？`, '手动触发', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    const res = await runScheduledTask(row.id);
    ElMessage.success(res.data.result);
    loadList();
  } catch {
    /* noop */
  }
}

onMounted(loadList);
</script>

<style scoped lang="less">
.task-page { width: 100%; }
.filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; .spacer { flex: 1; min-width: 4px; } }
.cron-code { font-family: 'Consolas', 'Monaco', monospace; color: #2563eb; font-size: 13px; }
.muted { color: #9ca3af; }
.result-text { font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; color: #4b5563; }
.error-text { color: #ef4444; font-size: 12px; margin-top: 4px; display: inline-block; }
.cron-tips { margin-top: 16px; }
</style>
