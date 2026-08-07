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
                  :model-value="store.selectedComponent.style.backgroundColor || '#ffffff'"
                  @update:model-value="(v: string) => updateStyle('backgroundColor', v)"
                />
              </div>
              <div class="form-item">
                <label>边框圆角</label>
                <el-input-number
                  :model-value="store.selectedComponent.style.borderRadius || 0"
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
              <div class="section-title">数据源</div>
              <div class="form-item">
                <el-button size="small" @click="mockLoadData">模拟加载数据</el-button>
              </div>
              <div class="form-item">
                <el-button size="small" @click="mockFetchData">从接口获取</el-button>
              </div>
            </div>

            <template v-else>
              <div class="placeholder-text">此组件不支持数据绑定</div>
            </template>
          </div>

          <el-empty v-else description="请选择组件配置数据" :image-size="100" />
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
import type { PropField } from '@/views/bi-editor/component-defs/types'
import { ArrowLeft as Left, ArrowRight as Right } from '@element-plus/icons-vue'

const store = useBiEditorStore()
const activeTab = ref('props')

/** 侧边栏整体是否收起 */
const collapsed = ref(false)
function toggleCollapsed() {
  collapsed.value = !collapsed.value
}

/** 默认展开的折叠项（内置固定分类 + 所有 Schema group 全展开） */
const builtInSections = ['basic', 'layout', 'zindex', 'state']
const activePropSections = ref<string[]>([...builtInSections])

const currentDefinition = computed(() => {
  const type = store.selectedComponent?.type
  return type ? getDefinition(type) : undefined
})

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
watch(
  () => store.selectedId,
  () => {
    const schemaGroupNames = fieldGroups.value.map((g) => `schema-${g}`)
    const merged = Array.from(new Set([...builtInSections, ...schemaGroupNames]))
    activePropSections.value = merged
  },
  { immediate: true },
)

/** 收起右栏时顺手关一下所有折叠项，重新展开后恢复 */
watch(collapsed, (v) => {
  if (v) {
    activePropSections.value = []
  } else {
    const schemaGroupNames = fieldGroups.value.map((g) => `schema-${g}`)
    activePropSections.value = Array.from(new Set([...builtInSections, ...schemaGroupNames]))
  }
})

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

function mockLoadData() {
  console.log('模拟加载数据')
}

function mockFetchData() {
  console.log('从接口获取数据')
}
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

.placeholder-text {
  font-size: 13px;
  color: var(--bi-text-muted, #6b7280);
  text-align: center;
  padding: 20px;
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
