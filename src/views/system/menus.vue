<template>
  <div class="menu-manage-page">
    <el-card class="page-card" shadow="never">
      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="搜索菜单名/权限码" clearable style="width: 260px" @keyup.enter="loadList" @clear="loadList" />
        <el-button type="primary" @click="loadList"><el-icon><Search /></el-icon>&nbsp;查询</el-button>
        <el-button @click="loadList"><el-icon><Refresh /></el-icon>&nbsp;刷新</el-button>
        <div class="spacer" />
        <el-button v-permission="'system:menu:add'" type="success" @click="openCreate"><el-icon><Plus /></el-icon>&nbsp;新增菜单</el-button>
      </div>
      <el-table v-loading="loading" :data="treeData" row-key="id" :tree-props="{ children: 'children' }" style="margin-top: 16px" border default-expand-all>
        <el-table-column prop="name" label="菜单名称" min-width="180" />
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon && row.icon !== '#'" size="18"><component :is="resolveIcon(row.icon)" /></el-icon>
            <span v-else style="color: #9ca3af">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="排序" width="70" align="center" />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.menuType === 'M'" type="info" size="small">目录</el-tag>
            <el-tag v-else-if="row.menuType === 'C'" type="success" size="small">菜单</el-tag>
            <el-tag v-else type="warning" size="small">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="perms" label="权限标识" min-width="160" show-overflow-tooltip>
          <template #default="{ row }"><span style="color: #6b7280">{{ row.perms || '-' }}</span></template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" min-width="140" show-overflow-tooltip />
        <el-table-column prop="component" label="组件路径" min-width="140" show-overflow-tooltip>
          <template #default="{ row }"><span style="color: #6b7280">{{ row.component || '-' }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '正常' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-permission="'system:menu:edit'" link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'system:menu:add'" link type="primary" size="small" @click="openCreate(row.id)">新增子项</el-button>
            <el-popconfirm title="确定删除该菜单吗？" confirm-button-type="danger" @confirm="handleDelete(row)">
              <template #reference>
                <el-button v-permission="'system:menu:remove'" link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="mode === 'create' ? '新增菜单' : '编辑菜单'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="父级菜单">
          <el-tree-select
            v-model="form.parentId" :data="parentTreeOptions" :props="{ label: 'name', value: 'id', children: 'children' }"
            check-strictly clearable placeholder="顶级菜单" style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio value="M">目录</el-radio>
            <el-radio value="C">菜单</el-radio>
            <el-radio value="F">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" maxlength="50" show-word-limit placeholder="中文显示名" />
        </el-form-item>
        <el-form-item v-if="form.menuType !== 'F'" label="路由路径" prop="path">
          <el-input v-model="form.path" maxlength="200" placeholder="如 /system 或 system/users" />
        </el-form-item>
        <el-form-item v-if="form.menuType === 'C'" label="组件路径" prop="component">
          <el-input v-model="form.component" maxlength="255" placeholder="如 system/users" />
        </el-form-item>
        <el-form-item label="权限标识" prop="perms">
          <el-input v-model="form.perms" maxlength="100" placeholder="如 system:user:add" />
        </el-form-item>
        <el-form-item v-if="form.menuType !== 'F'" label="图标">
          <el-input v-model="form.icon" maxlength="100" placeholder="Element Plus 图标名, 如 Setting" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.orderNum" :min="0" :max="999" />
        </el-form-item>
        <el-form-item v-if="form.menuType !== 'F'" label="是否显示">
          <el-switch v-model="form.visible" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus, Setting, DataBoard, User, UserFilled, OfficeBuilding, Coin, Link, Grid, Menu, Monitor } from '@element-plus/icons-vue'
import { getMenuList, createMenu, updateMenu, deleteMenu, getMenuTreeSelect, type MenuTreeNode } from '@/api/menu'

const loading = ref(false)
const list = ref<any[]>([])
const filters = reactive({ keyword: '' })

async function loadList() {
  loading.value = true
  try {
    const res = await getMenuList({ keyword: filters.keyword || undefined })
    list.value = res.data || []
  } catch { /* noop */ } finally { loading.value = false }
}

function buildTree(items: any[]): any[] {
  const map = new Map<number, any>()
  items.forEach((i) => map.set(i.id, { ...i, children: [] }))
  const roots: any[] = []
  items.forEach((i) => {
    const node = map.get(i.id)!
    if (i.parentId && map.has(i.parentId)) {
      map.get(i.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  // 清理空 children
  const clean = (arr: any[]) => arr.forEach((n) => { if (n.children.length === 0) delete n.children; else clean(n.children) })
  clean(roots)
  return roots
}

const treeData = computed(() => buildTree(list.value))

// 父菜单选项
const parentTreeOptions = ref<MenuTreeNode[]>([])
async function loadParentOptions() {
  try {
    const res = await getMenuTreeSelect()
    parentTreeOptions.value = res.data || []
  } catch { /* noop */ }
}

// 弹窗
const dialogVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<any>({
  id: undefined, parentId: 0, menuType: 'C', name: '', path: '', component: '',
  perms: '', icon: '', orderNum: 0, visible: true, status: 1, isFrame: false, isCache: true,
})
const rules: FormRules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
}

function openCreate(parentId?: number) {
  mode.value = 'create'
  Object.assign(form, { id: undefined, parentId: parentId || 0, menuType: 'C', name: '', path: '', component: '', perms: '', icon: '', orderNum: 0, visible: true, status: 1, isFrame: false, isCache: true })
  loadParentOptions()
  dialogVisible.value = true
}
function openEdit(row: any) {
  mode.value = 'edit'
  Object.assign(form, { ...row, visible: row.visible !== false, isFrame: !!row.isFrame, isCache: row.isCache !== false })
  loadParentOptions()
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    if (mode.value === 'create') {
      await createMenu(form)
      ElMessage.success('新增成功')
    } else if (form.id) {
      await updateMenu(form.id, form)
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    loadList()
  } catch { /* noop */ } finally { submitting.value = false }
}

async function handleDelete(row: any) {
  try {
    await deleteMenu(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch { /* noop */ }
}

function resolveIcon(iconName?: string) {
  if (!iconName || iconName === '#') return DataBoard
  const map: Record<string, any> = { Setting, DataBoard, User, UserFilled, OfficeBuilding, Coin, Link, Grid, Menu, Monitor }
  return map[iconName] || DataBoard
}

onMounted(loadList)
</script>

<style scoped lang="less">
.menu-manage-page { width: 100%; }
.page-card { border-radius: 8px; border: 1px solid #e5e7eb; }
.filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; .spacer { flex: 1; min-width: 4px; } }
</style>
