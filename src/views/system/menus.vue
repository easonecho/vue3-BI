<template>
  <div class="menu-manage-page">
    <el-card class="page-card" shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          :placeholder="t('menuPage.searchPlaceholder')"
          clearable
          style="width: 260px"
          @keyup.enter="loadList"
          @clear="loadList"
        />
        <el-button type="primary" @click="loadList"
          ><el-icon><Search /></el-icon>&nbsp;{{ t('menuPage.query') }}</el-button
        >
        <el-button @click="loadList"
          ><el-icon><Refresh /></el-icon>&nbsp;{{ t('menuPage.refresh') }}</el-button
        >
        <div class="spacer" />
        <el-button v-permission="'system:menu:add'" type="success" @click="openCreate"
          ><el-icon><Plus /></el-icon>&nbsp;{{ t('menuPage.create') }}</el-button
        >
      </div>
      <el-table
        v-loading="loading"
        :data="treeData"
        row-key="id"
        :tree-props="{ children: 'children' }"
        style="margin-top: 16px"
        border
        default-expand-all
      >
        <el-table-column prop="name" :label="t('menuPage.name')" min-width="180" />
        <el-table-column prop="icon" :label="t('menuPage.icon')" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon && row.icon !== '#'" size="18"
              ><component :is="resolveIcon(row.icon)"
            /></el-icon>
            <span v-else style="color: #9ca3af">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" :label="t('menuPage.sort')" width="70" align="center" />
        <el-table-column :label="t('menuPage.type')" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.menuType === 'M'" type="info" size="small">{{
              t('menuPage.typeDir')
            }}</el-tag>
            <el-tag v-else-if="row.menuType === 'C'" type="success" size="small">{{
              t('menuPage.typeMenu')
            }}</el-tag>
            <el-tag v-else type="warning" size="small">{{ t('menuPage.typeButton') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="perms"
          :label="t('menuPage.perms')"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }"
            ><span style="color: #6b7280">{{ row.perms || '-' }}</span></template
          >
        </el-table-column>
        <el-table-column
          prop="path"
          :label="t('menuPage.path')"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column
          prop="component"
          :label="t('menuPage.component')"
          min-width="140"
          show-overflow-tooltip
        >
          <template #default="{ row }"
            ><span style="color: #6b7280">{{ row.component || '-' }}</span></template
          >
        </el-table-column>
        <el-table-column :label="t('menuPage.status')" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{
              row.status === 1 ? t('menuPage.enabled') : t('menuPage.disabled')
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'system:menu:edit'"
              link
              type="primary"
              size="small"
              @click="openEdit(row)"
              >{{ t('common.edit') }}</el-button
            >
            <el-button
              v-permission="'system:menu:add'"
              link
              type="primary"
              size="small"
              @click="openCreate(row.id)"
              >{{ t('menuPage.addChild') }}</el-button
            >
            <el-popconfirm
              :title="t('menuPage.deleteConfirm')"
              confirm-button-type="danger"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button v-permission="'system:menu:remove'" link type="danger" size="small">{{
                  t('common.delete')
                }}</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="mode === 'create' ? t('menuPage.create') : t('menuPage.editTitle')"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item :label="t('menuPage.parent')">
          <el-tree-select
            v-model="form.parentId"
            :data="parentTreeOptions"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            check-strictly
            clearable
            :placeholder="t('menuPage.parentPlaceholder')"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="t('menuPage.menuType')" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio value="M">{{ t('menuPage.typeDir') }}</el-radio>
            <el-radio value="C">{{ t('menuPage.typeMenu') }}</el-radio>
            <el-radio value="F">{{ t('menuPage.typeButton') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('menuPage.name')" prop="name">
          <el-input
            v-model="form.name"
            maxlength="50"
            show-word-limit
            :placeholder="t('menuPage.namePlaceholder')"
          />
        </el-form-item>
        <el-form-item v-if="form.menuType !== 'F'" :label="t('menuPage.path')" prop="path">
          <el-input
            v-model="form.path"
            maxlength="200"
            :placeholder="t('menuPage.pathPlaceholder')"
          />
        </el-form-item>
        <el-form-item
          v-if="form.menuType === 'C'"
          :label="t('menuPage.component')"
          prop="component"
        >
          <el-input
            v-model="form.component"
            maxlength="255"
            :placeholder="t('menuPage.componentPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('menuPage.perms')" prop="perms">
          <el-input
            v-model="form.perms"
            maxlength="100"
            :placeholder="t('menuPage.permsPlaceholder')"
          />
        </el-form-item>
        <el-form-item v-if="form.menuType !== 'F'" :label="t('menuPage.icon')">
          <el-input
            v-model="form.icon"
            maxlength="100"
            :placeholder="t('menuPage.iconPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('menuPage.sort')">
          <el-input-number v-model="form.orderNum" :min="0" :max="999" />
        </el-form-item>
        <el-form-item v-if="form.menuType !== 'F'" :label="t('menuPage.visible')">
          <el-switch v-model="form.visible" />
        </el-form-item>
        <el-form-item :label="t('menuPage.status')">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">{{ t('menuPage.enabled') }}</el-radio>
            <el-radio :value="0">{{ t('menuPage.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">{{
          t('menuPage.confirm')
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Setting,
  DataBoard,
  User,
  UserFilled,
  OfficeBuilding,
  Coin,
  Link,
  Grid,
  Menu,
  Monitor,
} from '@element-plus/icons-vue'
import {
  getMenuList,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenuTreeSelect,
  type MenuTreeNode,
} from '@/api/menu'

const { t } = useI18n()

const loading = ref(false)
const list = ref<MenuTreeNode[]>([])
const filters = reactive({ keyword: '' })

async function loadList() {
  loading.value = true
  try {
    const res = await getMenuList({ keyword: filters.keyword || undefined })
    list.value = res.data || []
  } catch {
    /* noop */
  } finally {
    loading.value = false
  }
}

type MenuNode = Omit<MenuTreeNode, 'children'> & { children: MenuNode[] }

function buildTree(items: MenuTreeNode[]): MenuTreeNode[] {
  const map = new Map<number, MenuNode>()
  items.forEach((i) => map.set(i.id, { ...i, children: [] }))
  const roots: MenuNode[] = []
  items.forEach((i) => {
    const node = map.get(i.id)
    if (!node) return
    const parent = i.parentId ? map.get(i.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  })
  // 清理空 children
  const clean = (nodes: MenuNode[]): MenuTreeNode[] =>
    nodes.map(({ children, ...rest }) =>
      children.length ? { ...rest, children: clean(children) } : rest,
    )
  return clean(roots)
}

const treeData = computed(() => buildTree(list.value))

// 父菜单选项
const parentTreeOptions = ref<MenuTreeNode[]>([])
async function loadParentOptions() {
  try {
    const res = await getMenuTreeSelect()
    parentTreeOptions.value = res.data || []
  } catch {
    /* noop */
  }
}

// 弹窗
const dialogVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<Partial<MenuTreeNode>>({
  id: undefined,
  parentId: 0,
  menuType: 'C',
  name: '',
  path: '',
  component: '',
  perms: '',
  icon: '',
  orderNum: 0,
  visible: true,
  status: 1,
  isFrame: false,
  isCache: true,
})
const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('menuPage.nameRequired'), trigger: 'blur' }],
  menuType: [{ required: true, message: t('menuPage.menuTypeRequired'), trigger: 'change' }],
}))

function openCreate(parentId?: number) {
  mode.value = 'create'
  Object.assign(form, {
    id: undefined,
    parentId: parentId || 0,
    menuType: 'C',
    name: '',
    path: '',
    component: '',
    perms: '',
    icon: '',
    orderNum: 0,
    visible: true,
    status: 1,
    isFrame: false,
    isCache: true,
  })
  loadParentOptions()
  dialogVisible.value = true
}
function openEdit(row: MenuTreeNode) {
  mode.value = 'edit'
  Object.assign(form, {
    ...row,
    visible: row.visible !== false,
    isFrame: !!row.isFrame,
    isCache: row.isCache !== false,
  })
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
      ElMessage.success(t('menuPage.createSuccess'))
    } else if (form.id) {
      await updateMenu(form.id, form)
      ElMessage.success(t('menuPage.saveSuccess'))
    }
    dialogVisible.value = false
    loadList()
  } catch {
    /* noop */
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: MenuTreeNode) {
  try {
    await deleteMenu(row.id)
    ElMessage.success(t('menuPage.deleteSuccess'))
    loadList()
  } catch {
    /* noop */
  }
}

function resolveIcon(iconName?: string) {
  if (!iconName || iconName === '#') return DataBoard
  const map: Record<string, Component> = {
    Setting,
    DataBoard,
    User,
    UserFilled,
    OfficeBuilding,
    Coin,
    Link,
    Grid,
    Menu,
    Monitor,
  }
  return map[iconName] || DataBoard
}

onMounted(loadList)
</script>

<style scoped lang="less">
.menu-manage-page {
  width: 100%;
}
.page-card {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
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
