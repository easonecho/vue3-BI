<template>
  <div class="right-panel-wrapper" :class="{ collapsed }">
    <!-- 折叠拉手（放在右面板的左边缘，点击展开/收起） -->
    <button
      class="sidebar-handle"
      :class="{ collapsed }"
      :title="collapsed ? '展开属性/样式/数据面板' : '收起属性/样式/数据面板'"
      @click="toggleCollapsed"
    >
      <el-icon class="handle-icon">
        <component :is="collapsed ? Left : Right" />
      </el-icon>
    </button>

    <div class="right-panel">
      <el-tabs v-model="activeTab" class="panel-tabs">
        <!-- 属性面板 -->
        <el-tab-pane label="属性" name="props">
          <div v-if="store.selectedComponent" class="props-section">
            <!-- 🔑 折叠面板：将「基础 / 位置 & 尺寸 / 层级 / 状态」与各 Schema group 都做成可折叠项 -->
            <el-collapse v-model="activePropSections">
              <!-- 基础属性 -->
              <el-collapse-item name="basic">
                <template #title>
                  <span class="collapse-title">基础</span>
                </template>
                <div class="form-item">
                  <label>名称</label>
                  <el-input
                    :model-value="store.selectedComponent.name"
                    @update:model-value="(v: string) => updateField('name', v)"
                  />
                </div>
              </el-collapse-item>

              <!-- 位置和尺寸 -->
              <el-collapse-item name="layout">
                <template #title>
                  <span class="collapse-title">位置 &amp; 尺寸</span>
                </template>
                <div class="form-row">
                  <div class="form-item">
                    <label>X</label>
                    <el-input-number
                      :model-value="store.selectedComponent.x"
                      size="small"
                      controls-position="right"
                      @update:model-value="(v: number) => updateField('x', v)"
                    />
                  </div>
                  <div class="form-item">
                    <label>Y</label>
                    <el-input-number
                      :model-value="store.selectedComponent.y"
                      size="small"
                      controls-position="right"
                      @update:model-value="(v: number) => updateField('y', v)"
                    />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-item">
                    <label>宽</label>
                    <el-input-number
                      :model-value="store.selectedComponent.width"
                      size="small"
                      controls-position="right"
                      :min="1"
                      @update:model-value="(v: number) => updateField('width', v)"
                    />
                  </div>
                  <div class="form-item">
                    <label>高</label>
                    <el-input-number
                      :model-value="store.selectedComponent.height"
                      size="small"
                      controls-position="right"
                      :min="1"
                      @update:model-value="(v: number) => updateField('height', v)"
                    />
                  </div>
                </div>
              </el-collapse-item>

              <!-- 层级控制 -->
              <el-collapse-item name="zindex">
                <template #title>
                  <span class="collapse-title">层级</span>
                </template>
                <div class="layer-actions">
                  <el-button
                    size="small"
                    :disabled="!store.canBringToFront"
                    @click="store.bringToFront(store.selectedComponent!.id)"
                    >置顶</el-button
                  >
                  <el-button
                    size="small"
                    :disabled="!store.canMoveUp"
                    @click="store.moveUp(store.selectedComponent!.id)"
                    >上移</el-button
                  >
                  <el-button
                    size="small"
                    :disabled="!store.canMoveDown"
                    @click="store.moveDown(store.selectedComponent!.id)"
                    >下移</el-button
                  >
                  <el-button
                    size="small"
                    :disabled="!store.canSendToBack"
                    @click="store.sendToBack(store.selectedComponent!.id)"
                    >置底</el-button
                  >
                </div>
              </el-collapse-item>

              <!-- 🔑 分组 / 取消分组 -->
              <el-collapse-item name="group">
                <template #title>
                  <span class="collapse-title">分组</span>
                </template>
                <div class="group-actions">
                  <el-button
                    size="small"
                    type="primary"
                    plain
                    :disabled="!store.canGroup"
                    @click="store.groupSelection()"
                  >
                    组合 (Group)
                  </el-button>
                  <el-button
                    size="small"
                    :disabled="!store.canUngroup"
                    @click="store.ungroupSelection()"
                  >
                    取消组合 (Ungroup)
                  </el-button>
                </div>
                <div class="group-hint" v-if="store.selectedComponent?.groupId">
                  主选组件已归属到分组
                </div>
              </el-collapse-item>

              <!-- 🔑 对齐 / 分布 -->
              <el-collapse-item name="align">
                <template #title>
                  <span class="collapse-title">对齐 &amp; 分布</span>
                </template>
                <div class="align-section">
                  <div class="align-label">水平对齐</div>
                  <div class="align-row">
                    <el-button size="small" @click="store.alignLeft()" :disabled="!canAlign"
                      >左对齐</el-button
                    >
                    <el-button size="small" @click="store.alignHCenter()" :disabled="!canAlign"
                      >水平居中</el-button
                    >
                    <el-button size="small" @click="store.alignRight()" :disabled="!canAlign"
                      >右对齐</el-button
                    >
                  </div>
                  <div class="align-label">垂直对齐</div>
                  <div class="align-row">
                    <el-button size="small" @click="store.alignTop()" :disabled="!canAlign"
                      >顶对齐</el-button
                    >
                    <el-button size="small" @click="store.alignVCenter()" :disabled="!canAlignMulti"
                      >垂直居中</el-button
                    >
                    <el-button size="small" @click="store.alignBottom()" :disabled="!canAlignMulti"
                      >底对齐</el-button
                    >
                  </div>
                  <div class="align-label">等距分布（≥3 个组件）</div>
                  <div class="align-row">
                    <el-button
                      size="small"
                      @click="store.distributeHorizontal()"
                      :disabled="!canDistribute"
                      >水平分布</el-button
                    >
                    <el-button
                      size="small"
                      @click="store.distributeVertical()"
                      :disabled="!canDistribute"
                      >垂直分布</el-button
                    >
                  </div>
                </div>
              </el-collapse-item>

              <!-- 状态控制 -->
              <el-collapse-item name="state">
                <template #title>
                  <span class="collapse-title">状态</span>
                </template>
                <div class="form-item">
                  <div class="form-check">
                    <el-checkbox
                      :model-value="store.selectedComponent.visible"
                      @update:model-value="(v: boolean) => updateField('visible', v)"
                      >可见</el-checkbox
                    >
                  </div>
                  <div class="form-check">
                    <el-checkbox
                      :model-value="store.selectedComponent.locked"
                      @update:model-value="(v: boolean) => updateField('locked', v)"
                      >锁定</el-checkbox
                    >
                  </div>
                </div>
              </el-collapse-item>

              <!-- 🔑 Schema 驱动：按 group 分组渲染组件特有属性（每个 group 也做成一个可折叠项） -->
              <template v-if="currentDefinition">
                <el-collapse-item
                  v-for="group in fieldGroups"
                  :key="`schema-${group}`"
                  :name="`schema-${group}`"
                >
                  <template #title>
                    <span class="collapse-title">{{ group }}</span>
                  </template>
                  <PropFieldRenderer
                    v-for="field in getGroupFields(group)"
                    :key="field.key"
                    :field="field"
                    :model-value="getProp(field.key)"
                    :all-props="store.selectedComponent!.props"
                    @update:model-value="(v) => updateProp(field.key, v)"
                  />
                </el-collapse-item>
              </template>
            </el-collapse>

            <div v-if="!currentDefinition" class="section section--plain">
              <div class="section-title">组件属性</div>
              <div class="placeholder-text">此组件暂无可配置的属性</div>
            </div>
          </div>

          <!-- 🔑 多选批量修改面板：选中 >1 个组件时显示此精简模式（批量状态/样式/分组） -->
          <div v-else-if="hasMultiSelection" class="props-section multi-edit">
            <div class="multi-summary">
              已选择 <b>{{ multiSelectedIds.length }}</b> 个组件
            </div>
            <el-collapse v-model="multiActiveSections">
              <!-- 批量状态：可见/锁定 -->
              <el-collapse-item name="state">
                <template #title><span class="collapse-title">批量状态</span></template>
                <div class="form-item">
                  <div class="form-check">
                    <el-checkbox
                      :model-value="sharedState.visible"
                      :indeterminate="sharedState.visibleMixed"
                      @update:model-value="(v: boolean) => batchSetField('visible', v)"
                      >可见</el-checkbox
                    >
                  </div>
                  <div class="form-check">
                    <el-checkbox
                      :model-value="sharedState.locked"
                      :indeterminate="sharedState.lockedMixed"
                      @update:model-value="(v: boolean) => batchSetField('locked', v)"
                      >锁定</el-checkbox
                    >
                  </div>
                </div>
              </el-collapse-item>

              <!-- 🔑 分组 / 取消分组 -->
              <el-collapse-item name="group">
                <template #title><span class="collapse-title">分组</span></template>
                <div class="group-actions">
                  <el-button
                    size="small"
                    type="primary"
                    plain
                    :disabled="!store.canGroup"
                    @click="store.groupSelection()"
                  >
                    组合 (Group)
                  </el-button>
                  <el-button
                    size="small"
                    :disabled="!store.canUngroup"
                    @click="store.ungroupSelection()"
                  >
                    取消组合 (Ungroup)
                  </el-button>
                </div>
              </el-collapse-item>

              <!-- 批量对齐 / 分布 -->
              <el-collapse-item name="align">
                <template #title><span class="collapse-title">对齐 &amp; 分布</span></template>
                <div class="align-section">
                  <div class="align-label">水平对齐</div>
                  <div class="align-row">
                    <el-button size="small" @click="store.alignLeft()" :disabled="!canAlign"
                      >左对齐</el-button
                    >
                    <el-button size="small" @click="store.alignHCenter()" :disabled="!canAlign"
                      >水平居中</el-button
                    >
                    <el-button size="small" @click="store.alignRight()" :disabled="!canAlign"
                      >右对齐</el-button
                    >
                  </div>
                  <div class="align-label">垂直对齐</div>
                  <div class="align-row">
                    <el-button size="small" @click="store.alignTop()" :disabled="!canAlign"
                      >顶对齐</el-button
                    >
                    <el-button size="small" @click="store.alignVCenter()" :disabled="!canAlignMulti"
                      >垂直居中</el-button
                    >
                    <el-button size="small" @click="store.alignBottom()" :disabled="!canAlignMulti"
                      >底对齐</el-button
                    >
                  </div>
                  <div class="align-label">等距分布（≥3 个组件）</div>
                  <div class="align-row">
                    <el-button
                      size="small"
                      @click="store.distributeHorizontal()"
                      :disabled="!canDistribute"
                      >水平分布</el-button
                    >
                    <el-button
                      size="small"
                      @click="store.distributeVertical()"
                      :disabled="!canDistribute"
                      >垂直分布</el-button
                    >
                  </div>
                </div>
              </el-collapse-item>

              <!-- 批量基础样式：背景色 / 圆角 -->
              <el-collapse-item name="style">
                <template #title><span class="collapse-title">批量样式</span></template>
                <div class="form-item">
                  <label>背景色</label>
                  <el-color-picker
                    :model-value="sharedStyle.backgroundColor"
                    @update:model-value="(v: string) => batchSetStyle('backgroundColor', v)"
                  />
                  <div v-if="sharedStyle.mixedBg" class="mixed-hint">选中组件背景色不一致</div>
                </div>
                <div class="form-item">
                  <label>边框圆角</label>
                  <el-input-number
                    :model-value="sharedStyle.borderRadius"
                    :min="0"
                    :max="50"
                    @update:model-value="(v: number) => batchSetStyle('borderRadius', v)"
                  />
                  <div v-if="sharedStyle.mixedRadius" class="mixed-hint">选中组件圆角不一致</div>
                </div>
              </el-collapse-item>
            </el-collapse>
            <div class="multi-tip">提示：点击画布任意组件可退出多选模式查看单组件完整属性面板</div>
          </div>

          <!-- 未选中状态 -->
          <el-empty v-else description="请选择组件查看属性" :image-size="100" />
        </el-tab-pane>

        <!-- 样式面板 -->
        <el-tab-pane label="样式" name="style">
          <div v-if="store.selectedComponent" class="style-section">
            <div class="section">
              <div class="section-title">外观</div>
              <div class="form-item">
                <label>背景色</label>
                <el-color-picker
                  :model-value="store.selectedComponent.style?.backgroundColor || '#ffffff'"
                  @update:model-value="(v: string) => updateStyle('backgroundColor', v)"
                />
              </div>
              <div class="form-item">
                <label>边框圆角</label>
                <el-input-number
                  :model-value="store.selectedComponent.style?.borderRadius || 0"
                  :min="0"
                  :max="50"
                  @update:model-value="(v: number) => updateStyle('borderRadius', v)"
                />
              </div>
            </div>
          </div>

          <el-empty v-else description="请选择组件查看样式" :image-size="100" />
        </el-tab-pane>

        <!-- 数据面板 -->
        <el-tab-pane label="数据" name="data">
          <div v-if="store.selectedComponent" class="data-section">
            <div v-if="currentDefinition?.supportsDataBinding" class="section">
              <!-- 数据集选择器 -->
              <div class="section-title">数据源</div>
              <div class="form-item">
                <label>数据集</label>
                <el-select
                  :model-value="store.selectedComponent.dataSource.datasetId"
                  placeholder="请选择数据集"
                  filterable
                  clearable
                  :loading="datasetListLoading"
                  @visible-change="handleDatasetSelectVisible"
                  @update:model-value="handleDatasetChange"
                >
                  <el-option
                    v-for="item in datasetList"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </div>

              <!-- 字段映射(根据 dataBindingSchema 动态渲染) -->
              <template v-if="store.selectedComponent.dataSource.datasetId">
                <div
                  v-if="dataBindingFields.length > 0"
                  class="section-title"
                  style="margin-top: 16px"
                >
                  字段映射
                </div>
                <div v-if="dataBindingFields.length === 0" class="form-item">
                  <span class="placeholder-text" style="padding: 8px 0">
                    表格组件自动展示数据集全部字段,无需手动映射
                  </span>
                </div>
                <div v-for="field in dataBindingFields" :key="field.key" class="form-item">
                  <label>{{ field.label }}</label>
                  <el-select
                    :model-value="getFieldMapping(field.key)"
                    :placeholder="`选择${field.label}`"
                    :multiple="field.multiple"
                    clearable
                    @update:model-value="
                      (v: string | string[] | null) => handleFieldMappingChange(field.key, v)
                    "
                  >
                    <el-option v-for="f in datasetFields" :key="f" :label="f" :value="f" />
                  </el-select>
                </div>
              </template>

              <!-- 数据预览 -->
              <template v-if="store.selectedComponent.dataSource.datasetId">
                <div class="section-title" style="margin-top: 16px">
                  数据预览
                  <span v-if="datasetLoading" class="loading-hint">加载中...</span>
                </div>
                <div class="data-preview">
                  <el-table
                    v-if="previewRows.length > 0"
                    :data="previewRows"
                    size="small"
                    border
                    max-height="200"
                  >
                    <el-table-column
                      v-for="f in previewFields"
                      :key="f"
                      :prop="f"
                      :label="f"
                      min-width="100"
                      show-overflow-tooltip
                    />
                  </el-table>
                  <el-empty v-else-if="!datasetLoading" description="暂无数据" :image-size="40" />
                </div>
              </template>
            </div>

            <template v-else>
              <div class="placeholder-text">此组件不支持数据绑定</div>
            </template>
          </div>

          <el-empty v-else description="请选择组件配置数据" :image-size="100" />
        </el-tab-pane>

        <!-- 🔑 画布全局设置：背景/尺寸/网格/标尺 -->
        <el-tab-pane label="画布" name="canvas">
          <div class="canvas-settings">
            <!-- 画布尺寸 -->
            <div class="cs-section">
              <div class="cs-section-head">
                <span class="cs-section-title">画布尺寸</span>
                <span class="cs-section-hint">宽 × 高 (px)</span>
              </div>
              <div class="cs-size-row">
                <el-input-number
                  :model-value="store.canvas.width"
                  size="small"
                  controls-position="right"
                  :min="100"
                  :max="10000"
                  :step="10"
                  class="cs-size-input"
                  @update:model-value="(v: number) => updateCanvasField('width', v)"
                />
                <span class="cs-size-x">×</span>
                <el-input-number
                  :model-value="store.canvas.height"
                  size="small"
                  controls-position="right"
                  :min="100"
                  :max="10000"
                  :step="10"
                  class="cs-size-input"
                  @update:model-value="(v: number) => updateCanvasField('height', v)"
                />
              </div>
              <div class="cs-presets">
                <button
                  v-for="p in canvasPresets"
                  :key="p.label"
                  class="cs-preset"
                  :class="{ active: store.canvas.width === p.w && store.canvas.height === p.h }"
                  @click="applyCanvasPreset(p.w, p.h)"
                >
                  <span class="cs-preset-size">{{ p.w }}×{{ p.h }}</span>
                  <span class="cs-preset-label">{{ p.label }}</span>
                </button>
              </div>
            </div>

            <!-- 画布外观 -->
            <div class="cs-section">
              <div class="cs-section-head">
                <span class="cs-section-title">外观</span>
              </div>
              <div class="cs-field-row">
                <label class="cs-field-label">背景色</label>
                <div class="cs-field-control">
                  <el-color-picker
                    :model-value="store.canvas.backgroundColor || '#ffffff'"
                    @update:model-value="(v: string) => updateCanvasField('backgroundColor', v)"
                  />
                </div>
              </div>
              <div class="cs-field-row cs-field-col">
                <label class="cs-field-label">背景图</label>
                <el-input
                  :model-value="store.canvas.backgroundImage"
                  size="small"
                  placeholder="图片 URL，留空不使用"
                  clearable
                  @update:model-value="(v: string) => updateCanvasField('backgroundImage', v)"
                />
              </div>
              <div class="cs-bg-preview" :style="canvasPreviewStyle">预览</div>
            </div>

            <!-- 视图 & 吸附 -->
            <div class="cs-section">
              <div class="cs-section-head">
                <span class="cs-section-title">视图与吸附</span>
              </div>
              <div class="cs-toggles">
                <div class="cs-toggle">
                  <span class="cs-toggle-label">显示标尺</span>
                  <el-switch
                    :model-value="store.canvas.showRuler"
                    size="small"
                    @update:model-value="(v: boolean) => updateCanvasField('showRuler', v)"
                  />
                </div>
                <div class="cs-toggle">
                  <span class="cs-toggle-label">显示网格</span>
                  <el-switch
                    :model-value="store.canvas.showGrid"
                    size="small"
                    @update:model-value="(v: boolean) => updateCanvasField('showGrid', v)"
                  />
                </div>
                <div class="cs-toggle">
                  <span class="cs-toggle-label">网格吸附</span>
                  <el-switch
                    :model-value="store.canvas.snapToGrid"
                    size="small"
                    @update:model-value="(v: boolean) => updateCanvasField('snapToGrid', v)"
                  />
                </div>
                <div class="cs-toggle">
                  <span class="cs-toggle-label">辅助线</span>
                  <el-switch
                    :model-value="store.canvas.showGuides"
                    size="small"
                    @update:model-value="(v: boolean) => updateCanvasField('showGuides', v)"
                  />
                </div>
              </div>
              <div class="cs-field-row">
                <label class="cs-field-label">网格大小</label>
                <div class="cs-field-control">
                  <el-input-number
                    :model-value="store.canvas.gridSize"
                    size="small"
                    controls-position="right"
                    :min="4"
                    :max="100"
                    :step="1"
                    @update:model-value="(v: number) => updateCanvasField('gridSize', v)"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'
import { getDefinition } from '@/views/bi-editor/component-defs'
import PropFieldRenderer from './PropFieldRenderer.vue'
import type { PropField, DataBindingField } from '@/views/bi-editor/component-defs/types'
import { ArrowLeft as Left, ArrowRight as Right } from '@element-plus/icons-vue'
import { getDatasetList } from '@/api/dataset'
import { useDatasetBinding } from '../composables/useDatasetBinding'
import type { Dataset } from '@/api/types'

const store = useBiEditorStore()
const activeTab = ref('props')

/** 侧边栏整体是否收起 */
const collapsed = ref(false)
function toggleCollapsed() {
  collapsed.value = !collapsed.value
}

/** 默认展开的折叠项（内置固定分类 + 所有 Schema group 全展开） */
// const builtInSections = ['basic', 'layout', 'zindex', 'state']
const activePropSections = ref<string[]>([])

const currentDefinition = computed(() => {
  const type = store.selectedComponent?.type
  return type ? getDefinition(type) : undefined
})

/** 🔑 对齐 / 分布可用性判定
 * canAlign：至少有 1 个组件（左/右/顶/底、水平居中对单选也生效，即贴画布）
 * canAlignMulti：至少有 2 个组件（垂直居中/底对齐只支持多选集合）
 * canDistribute：至少 3 个组件（等距分布的数学要求）
 */
const selectedCount = computed(() =>
  store.selectedIds.length > 0 ? store.selectedIds.length : store.selectedId ? 1 : 0,
)
const canAlign = computed(() => selectedCount.value >= 1)
const canAlignMulti = computed(() => selectedCount.value >= 2)
const canDistribute = computed(() => selectedCount.value >= 3)

// ========== 🔑 多选批量修改 ==========
/** 多选面板：有 >1 个组件被选中（且主选仍然存在），显示批量修改面板 */
const multiSelectedIds = computed<string[]>(() =>
  store.selectedIds.length > 0 ? [...store.selectedIds] : [],
)
const hasMultiSelection = computed(
  () => !store.selectedComponent && multiSelectedIds.value.length > 0,
)
const multiActiveSections = ref<string[]>(['state', 'group', 'align', 'style'])

/** 批量：可见/锁定的「共同值 / 混合状态」 */
const sharedState = computed(() => {
  const comps = multiSelectedIds.value
    .map((id) => store.components.find((c) => c.id === id))
    .filter(Boolean) as any[]
  if (comps.length === 0) {
    return { visible: false, visibleMixed: false, locked: false, lockedMixed: false }
  }
  const firstV = comps[0].visible
  const firstL = comps[0].locked
  const visibleMixed = comps.some((c) => c.visible !== firstV)
  const lockedMixed = comps.some((c) => c.locked !== firstL)
  return {
    visible: visibleMixed ? false : firstV,
    visibleMixed,
    locked: lockedMixed ? false : firstL,
    lockedMixed,
  }
})

/** 批量：基础样式的「共同值 / 混合状态」 */
const sharedStyle = computed(() => {
  const comps = multiSelectedIds.value
    .map((id) => store.components.find((c) => c.id === id))
    .filter(Boolean) as any[]
  if (comps.length === 0) {
    return {
      backgroundColor: '' as string | undefined,
      mixedBg: false,
      borderRadius: 0,
      mixedRadius: false,
    }
  }
  const firstBg = comps[0].style?.backgroundColor
  const firstR = comps[0].style?.borderRadius ?? 0
  const mixedBg = comps.some((c) => (c.style?.backgroundColor || '') !== (firstBg || ''))
  const mixedRadius = comps.some((c) => (c.style?.borderRadius ?? 0) !== firstR)
  return {
    backgroundColor: mixedBg ? undefined : (firstBg as string),
    mixedBg,
    borderRadius: mixedRadius ? undefined : (firstR as number),
    mixedRadius,
  }
})

/** 批量写入组件一级字段（visible / locked） */
function batchSetField(field: 'visible' | 'locked', value: boolean) {
  for (const id of multiSelectedIds.value) {
    store.updateComponent(id, { [field]: value })
  }
}
/** 批量写入组件 style 字段（backgroundColor / borderRadius） */
function batchSetStyle(field: 'backgroundColor' | 'borderRadius', value: any) {
  for (const id of multiSelectedIds.value) {
    const comp = store.components.find((c) => c.id === id)
    if (!comp) continue
    store.updateComponent(id, {
      style: { ...comp.style, [field]: value },
    })
  }
}

// ========== 🔑 画布全局设置（尺寸/背景/视图） ==========
const canvasPresets = [
  { w: 1920, h: 1080, label: 'Full HD' },
  { w: 1600, h: 900, label: 'HD+' },
  { w: 1440, h: 900, label: '笔记本' },
  { w: 1366, h: 768, label: '标准' },
  { w: 1280, h: 720, label: 'HD' },
  { w: 1024, h: 768, label: '4:3' },
]
function updateCanvasField<K extends keyof (typeof store)['canvas']>(
  key: K,
  value: (typeof store)['canvas'][K],
) {
  store.updateCanvas({ [key]: value } as any)
}
function applyCanvasPreset(w: number, h: number) {
  store.updateCanvas({ width: w, height: h })
}
const canvasPreviewStyle = computed(() => ({
  background: store.canvas.backgroundColor || '#ffffff',
  backgroundImage: store.canvas.backgroundImage ? `url(${store.canvas.backgroundImage})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  width: '100%',
  height: '96px',
  borderRadius: '6px',
  border: '1px dashed rgba(255,255,255,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: store.canvas.backgroundColor ? '#9ca3af' : '#4b5563',
  fontSize: '12px',
}))

/** 按 group 分组的字段列表（无 group 的归入"组件属性"默认组） */
const fieldGroups = computed(() => {
  if (!currentDefinition.value) return []
  const groups = new Set<string>()
  for (const field of currentDefinition.value.propsSchema) {
    groups.add(field.group || '组件属性')
  }
  return Array.from(groups)
})

/** 切换组件时：将当前组件的所有 Schema group 加进展开列表（避免切到新组件全是关着的） */
// watch(
//   () => store.selectedId,
//   () => {
//     const schemaGroupNames = fieldGroups.value.map((g) => `schema-${g}`)
//     const merged = Array.from(new Set([...builtInSections, ...schemaGroupNames]))
//     activePropSections.value = merged
//   },
//   { immediate: true },
// )

/** 收起右栏时顺手关一下所有折叠项，重新展开后恢复 */
// watch(collapsed, (v) => {
//   if (v) {
//     activePropSections.value = []
//   } else {
//     const schemaGroupNames = fieldGroups.value.map((g) => `schema-${g}`)
//     activePropSections.value = Array.from(new Set([...builtInSections, ...schemaGroupNames]))
//   }
// })

function getGroupFields(group: string): PropField[] {
  if (!currentDefinition.value) return []
  return currentDefinition.value.propsSchema.filter((f) => (f.group || '组件属性') === group)
}

function getProp(key: string): any {
  return store.selectedComponent?.props?.[key]
}

function updateField(field: string, value: any) {
  if (store.selectedId) {
    store.updateComponent(store.selectedId, { [field]: value })
  }
}

function updateProp(key: string, value: any) {
  if (store.selectedId) {
    const comp = store.selectedComponent
    if (comp) {
      store.updateComponent(store.selectedId, {
        props: { ...comp.props, [key]: value },
      })
    }
  }
}

function updateStyle(key: string, value: any) {
  if (store.selectedId) {
    const comp = store.selectedComponent
    if (comp) {
      store.updateComponent(store.selectedId, {
        style: { ...comp.style, [key]: value },
      })
    }
  }
}

// ====== 数据绑定面板逻辑 ======

/** 数据集列表 */
const datasetList = ref<Dataset[]>([])
const datasetListLoading = ref(false)
/** 已加载过列表标志(避免每次展开 select 都请求) */
let datasetListLoaded = false

async function loadDatasetList() {
  if (datasetListLoaded) return
  datasetListLoading.value = true
  try {
    const res = await getDatasetList({ page: 1, pageSize: 100 })
    datasetList.value = res.data.list ?? []
    datasetListLoaded = true
  } finally {
    datasetListLoading.value = false
  }
}

/** 下拉展开时懒加载数据集列表 */
function handleDatasetSelectVisible(visible: boolean) {
  if (visible) loadDatasetList()
}

/** 当前组件的数据绑定字段 schema(从组件定义读取) */
const dataBindingFields = computed<DataBindingField[]>(() => {
  return currentDefinition.value?.dataBindingSchema ?? []
})

/** 当前组件绑定的数据集 dataSource ref(供 useDatasetBinding 取数) */
const currentDataSource = computed(() => {
  return store.selectedComponent?.dataSource ?? { datasetId: null }
})

/** RightPanel 自己也用 useDatasetBinding 取一份数据(用于字段映射下拉选项 + 数据预览)。
 *   与 Widget 内部的 useDatasetBinding 共享模块级缓存,不会重复请求 */
const {
  rows: datasetRows,
  fields: datasetFields,
  loading: datasetLoading,
} = useDatasetBinding(currentDataSource)

/** 预览数据(前 5 行) */
const previewRows = computed(() => datasetRows.value.slice(0, 5))
const previewFields = computed(() => datasetFields.value)

/** 切换数据集 */
function handleDatasetChange(datasetId: number | null) {
  if (!store.selectedId) return
  store.updateComponent(store.selectedId, {
    dataSource: { datasetId },
    // 🔑 切换数据集时清空字段映射,避免旧字段名残留
    dataConfig: {},
  })
}

/** 读取字段映射值 */
function getFieldMapping(key: string): string | string[] | undefined {
  const config = store.selectedComponent?.dataConfig as Record<string, unknown> | undefined
  return config?.[key] as string | string[] | undefined
}

/** 更新字段映射 */
function handleFieldMappingChange(key: string, value: string | string[] | null) {
  if (!store.selectedId || !store.selectedComponent) return
  store.updateComponent(store.selectedId, {
    dataConfig: { ...store.selectedComponent.dataConfig, [key]: value ?? undefined },
  })
}

/** 切换组件时重置数据集列表加载标志(可选,这里不重置,复用已加载列表) */
watch(
  () => store.selectedId,
  () => {
    // 切换组件无需清缓存,useDatasetBinding 会自动按新 datasetId 取数
  },
)
</script>

<style scoped lang="less">
.right-panel-wrapper {
  position: relative;
  height: 100%;
  display: flex;
  flex-shrink: 0;
  transition: width 0.25s ease;
}

.right-panel {
  width: 300px;
  height: 100%;
  background: var(--bi-panel-bg, #1f2937);
  border-left: 1px solid var(--bi-border-color, #374151);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  transition:
    width 0.25s ease,
    opacity 0.25s ease;
}

.right-panel-wrapper.collapsed .right-panel {
  width: 0;
  opacity: 0;
  pointer-events: none;
  border-left: none;
}

/* ===== 折叠拉手（贴在侧边栏的左边缘） ===== */
.sidebar-handle {
  position: absolute;
  top: 50%;
  left: -11px; /* 一半露在 wrapper 外，方便点击 */
  transform: translateY(-50%);
  width: 22px;
  height: 64px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--bi-border-color, #374151);
  border-right: none;
  background: linear-gradient(270deg, var(--bi-panel-bg, #1f2937), #253142);
  cursor: pointer;
  border-radius: 6px 0 0 6px;
  z-index: 10;
  box-shadow: -2px 0 6px rgba(0, 0, 0, 0.25);
  color: var(--bi-text-secondary, #d1d5db);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(270deg, #2a3749, #37445b);
    color: var(--bi-accent, #409eff);
  }

  &.collapsed {
    left: -11px;
    border-left: 1px solid var(--bi-border-color, #374151);
    border-right: 1px solid var(--bi-border-color, #374151);
    background: linear-gradient(270deg, var(--bi-panel-bg, #1f2937), #253142);
    border-radius: 6px;
  }
}

.handle-icon {
  font-size: 14px;
}

.panel-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 🔑 允许子元素真正溢出并触发滚动 */
}

:deep(.el-tabs__nav-wrap) {
  padding-left: 20px;
}

:deep(.el-tabs__header) {
  margin: 0;
  background: var(--bi-panel-header-bg, #111827);
  flex-shrink: 0; /* 🔑 防止 tab header 被压缩 */
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

:deep(.el-tabs__item) {
  color: var(--bi-text-secondary, #9ca3af);
  font-size: 13px;
}

:deep(.el-tabs__item.is-active) {
  color: var(--bi-accent, #409eff);
}

:deep(.el-tabs__active-bar) {
  background-color: var(--bi-accent, #409eff);
}

:deep(.el-tabs__content) {
  flex: 1;
  min-height: 0; /* 🔑 flex 容器内产生滚动的关键 */
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: var(--bi-scrollbar-thumb, #4b5563) var(--bi-scrollbar-track, #1f2937);
}

:deep(.el-tab-pane) {
  height: 100%;
}

/* 🔑 属性面板的折叠样式（保持和 LeftPanel 视觉一致） */
.props-section :deep(.el-collapse) {
  border-top: none;
  border-bottom: none;
  background: transparent;
}

.props-section :deep(.el-collapse-item) {
  border-bottom: 1px solid var(--bi-border-color, #374151);
  background: transparent;
  margin-bottom: 4px;
}

.props-section :deep(.el-collapse-item__header) {
  height: 30px;
  line-height: 30px;
  padding: 0 4px;
  background: transparent;
  border-bottom: none;
  color: var(--bi-text-muted, #6b7280);
  font-weight: 600;
}

.props-section :deep(.el-collapse-item__wrap) {
  border-bottom: none;
  background: transparent;
  will-change: auto;
}

.props-section :deep(.el-collapse-item__content) {
  padding: 8px 4px 14px;
  background: transparent;
  color: inherit;
}

.collapse-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: inherit;
}

.section {
  margin-bottom: 20px;
}

.section--plain {
  padding: 0 4px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--bi-text-muted, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--bi-border-color, #374151);
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-item--inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.form-item label {
  font-size: 12px;
  color: var(--bi-text-secondary, #9ca3af);
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-item {
  flex: 1;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 16px;
}

:deep(.form-check .el-checkbox__label) {
  color: var(--bi-text-primary, #f3f4f6);
}

.layer-actions {
  display: flex;
  gap: 6px;
}

:deep(.layer-actions .el-button) {
  flex: 1;
  min-width: 50px;
}

/* 🔑 分组 */
.group-actions {
  display: flex;
  gap: 8px;
}
:deep(.group-actions .el-button) {
  flex: 1;
  min-width: 0;
}
.group-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--bi-text-muted, #9ca3af);
  padding: 6px 8px;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 4px;
  border: 1px dashed rgba(64, 158, 255, 0.4);
}

/* 🔑 对齐 / 分布工具条 */
.align-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.align-label {
  font-size: 12px;
  color: var(--bi-text-muted, #9ca3af);
  margin-top: 2px;
}
.align-row {
  display: flex;
  gap: 6px;
}
:deep(.align-row .el-button) {
  flex: 1;
  min-width: 0;
  padding: 6px 4px;
  font-size: 12px;
}

.placeholder-text {
  font-size: 13px;
  color: var(--bi-text-muted, #6b7280);
  text-align: center;
  padding: 20px;
}

/* ===== 画布全局设置 ===== */
.canvas-settings {
  .cs-section {
    padding: 12px 0;
    border-bottom: 1px solid var(--bi-border-color, #374151);

    &:last-child {
      border-bottom: none;
    }
  }
  .cs-section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .cs-section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--bi-text-primary, #f3f4f6);
  }
  .cs-section-hint {
    font-size: 11px;
    color: var(--bi-text-muted, #9ca3af);
  }

  /* 尺寸输入行 */
  .cs-size-row {
    display: flex;
    align-items: center;
    gap: 8px;

    .cs-size-input {
      flex: 1;
    }
    .cs-size-x {
      color: var(--bi-text-muted, #9ca3af);
      font-size: 14px;
      flex-shrink: 0;
    }
  }

  /* 预设尺寸网格 */
  .cs-presets {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-top: 10px;
  }
  .cs-preset {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px;
    border-radius: 6px;
    background: var(--bi-component-bg, #1a1a1d);
    border: 1px solid var(--bi-component-border, #2d2d33);
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;

    &:hover {
      border-color: var(--bi-border-accent, rgba(16, 185, 129, 0.3));
      background: var(--bi-component-hover-bg, #26262b);
    }
    &.active {
      border-color: var(--bi-accent, #10b981);
      background: var(--bi-layer-active-bg, rgba(16, 185, 129, 0.12));

      .cs-preset-size {
        color: var(--bi-accent, #10b981);
      }
    }
    .cs-preset-size {
      font-size: 12px;
      font-weight: 600;
      color: var(--bi-text-primary, #f3f4f6);
      font-variant-numeric: tabular-nums;
    }
    .cs-preset-label {
      font-size: 10px;
      color: var(--bi-text-muted, #9ca3af);
    }
  }

  /* 行内字段 */
  .cs-field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;

    &.cs-field-col {
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
    }
  }
  .cs-field-label {
    font-size: 12px;
    color: var(--bi-text-secondary, #a1a1aa);
    flex-shrink: 0;
  }
  .cs-field-control {
    display: flex;
    align-items: center;
  }

  /* 背景预览 */
  .cs-bg-preview {
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--bi-text-muted, #9ca3af);
    border: 1px dashed var(--bi-border-color, #2d2d33);
    border-radius: 6px;
  }

  /* 开关网格 */
  .cs-toggles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
    margin-bottom: 12px;
  }
  .cs-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    border-radius: 6px;
    background: var(--bi-component-bg, #1a1a1d);
    border: 1px solid var(--bi-component-border, #2d2d33);
  }
  .cs-toggle-label {
    font-size: 12px;
    color: var(--bi-text-secondary, #a1a1aa);
  }
}

/* ===== 多选批量修改 ===== */
.multi-edit {
  .multi-summary {
    padding: 12px 14px;
    margin: 0 -4px 8px;
    background: rgba(64, 158, 255, 0.12);
    color: var(--bi-text-primary, #f3f4f6);
    border-radius: 6px;
    font-size: 13px;
    b {
      color: var(--bi-accent, #409eff);
      font-size: 15px;
      margin: 0 2px;
    }
  }
  .mixed-hint {
    margin-top: 6px;
    font-size: 12px;
    color: var(--bi-text-muted, #9ca3af);
  }
  .multi-tip {
    margin-top: 14px;
    padding: 8px 10px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--bi-text-muted, #9ca3af);
    background: rgba(255, 255, 255, 0.04);
    border-radius: 6px;
  }
}

/* ===== 数据面板 ===== */
.data-section .section {
  margin-bottom: 16px;
}

.loading-hint {
  font-size: 12px;
  color: var(--bi-accent, #409eff);
  margin-left: 8px;
  font-weight: normal;
}

.data-preview {
  margin-top: 8px;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.data-preview .el-table) {
  background: var(--bi-input-bg, #374151);
  color: var(--bi-text-primary, #f3f4f6);
  font-size: 12px;
}

:deep(.data-preview .el-table th.el-table__cell) {
  background: var(--bi-panel-header-bg, #111827);
  color: var(--bi-text-secondary, #9ca3af);
  border-color: var(--bi-border-color, #374151);
}

:deep(.data-preview .el-table td.el-table__cell) {
  border-color: var(--bi-border-color, #374151);
}

:deep(.data-preview .el-table__empty-text) {
  color: var(--bi-text-muted, #6b7280);
}

:deep(.el-input__wrapper) {
  background: var(--bi-input-bg, #374151);
  box-shadow: none;
}

:deep(.el-input__inner) {
  color: var(--bi-text-primary, #f3f4f6);
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  background: var(--bi-input-bg, #374151);
}

:deep(.el-slider__runway) {
  background: var(--bi-slider-bg, #374151);
}

:deep(.el-slider__bar) {
  background: var(--bi-accent, #409eff);
}

:deep(.el-slider__button) {
  border-color: var(--bi-accent, #409eff);
}

:deep(.el-tabs__content::-webkit-scrollbar) {
  width: 6px;
}

:deep(.el-tabs__content::-webkit-scrollbar-track) {
  background: var(--bi-scrollbar-track, #1f2937);
}

:deep(.el-tabs__content::-webkit-scrollbar-thumb) {
  background: var(--bi-scrollbar-thumb, #4b5563);
  border-radius: 3px;
}

:deep(.el-tabs__content::-webkit-scrollbar-thumb:hover) {
  background: var(--bi-scrollbar-thumb-hover, #6b7280);
}
</style>
