<template>
  <div class="right-panel">
    <el-tabs v-model="activeTab" class="panel-tabs">
      <!-- 属性面板 -->
      <el-tab-pane label="属性" name="props">
        <div v-if="store.selectedComponent" class="props-section">
          <!-- 基础属性 -->
          <div class="section">
            <div class="section-title">基础</div>
            <div class="form-item">
              <label>名称</label>
              <el-input
                :model-value="store.selectedComponent.name"
                @update:model-value="(v: string) => updateField('name', v)"
              />
            </div>
          </div>

          <!-- 位置和尺寸 -->
          <div class="section">
            <div class="section-title">位置 & 尺寸</div>
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
          </div>

          <!-- 层级控制 -->
          <div class="section">
            <div class="section-title">层级</div>
            <div class="layer-actions">
              <el-button
                size="small"
                :disabled="!store.canBringToFront"
                @click="store.bringToFront(store.selectedComponent!.id)"
              >
                置顶
              </el-button>
              <el-button
                size="small"
                :disabled="!store.canMoveUp"
                @click="store.moveUp(store.selectedComponent!.id)"
              >
                上移
              </el-button>
              <el-button
                size="small"
                :disabled="!store.canMoveDown"
                @click="store.moveDown(store.selectedComponent!.id)"
              >
                下移
              </el-button>
              <el-button
                size="small"
                :disabled="!store.canSendToBack"
                @click="store.sendToBack(store.selectedComponent!.id)"
              >
                置底
              </el-button>
            </div>
          </div>

          <!-- 状态控制 -->
          <div class="section">
            <div class="section-title">状态</div>
            <div class="form-item">
              <div class="form-check">
                <el-checkbox
                  :model-value="store.selectedComponent.visible"
                  @update:model-value="(v: boolean) => updateField('visible', v)"
                >
                  可见
                </el-checkbox>
              </div>
              <div class="form-check">
                <el-checkbox
                  :model-value="store.selectedComponent.locked"
                  @update:model-value="(v: boolean) => updateField('locked', v)"
                >
                  锁定
                </el-checkbox>
              </div>
            </div>
          </div>

          <!-- 组件属性 (根据类型动态显示) -->
          <div class="section">
            <div class="section-title">组件属性</div>
            <template v-if="store.selectedComponent.type === 'text'">
              <div class="form-item">
                <label>文本</label>
                <el-input
                  type="textarea"
                  :model-value="store.selectedComponent.props.text"
                  :rows="2"
                  @update:model-value="(v: string) => updateProp('text', v)"
                />
              </div>
              <div class="form-item">
                <label>字号</label>
                <el-slider
                  :model-value="store.selectedComponent.props.fontSize"
                  :min="10"
                  :max="48"
                  @update:model-value="(v: number) => updateProp('fontSize', v)"
                />
              </div>
            </template>

            <template
              v-else-if="
                ['bar-chart', 'line-chart', 'pie-chart', 'scatter-chart'].includes(
                  store.selectedComponent.type,
                )
              "
            >
              <div class="form-item">
                <label>标题</label>
                <el-input
                  :model-value="store.selectedComponent.props.title"
                  @update:model-value="(v: string) => updateProp('title', v)"
                />
              </div>
            </template>

            <template v-else-if="store.selectedComponent.type === 'number'">
              <div class="form-item">
                <label>数值</label>
                <el-input-number
                  :model-value="store.selectedComponent.props.value"
                  @update:model-value="(v: number) => updateProp('value', v)"
                />
              </div>
              <div class="form-item">
                <label>字号</label>
                <el-slider
                  :model-value="store.selectedComponent.props.fontSize"
                  :min="14"
                  :max="72"
                  @update:model-value="(v: number) => updateProp('fontSize', v)"
                />
              </div>
            </template>

            <template v-else>
              <div class="placeholder-text">此组件暂无可配置的属性</div>
            </template>
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
          <template
            v-if="
              ['bar-chart', 'line-chart', 'pie-chart', 'scatter-chart'].includes(
                store.selectedComponent.type,
              )
            "
          >
            <div class="section">
              <div class="section-title">数据源</div>
              <div class="form-item">
                <el-button size="small" @click="mockLoadData">模拟加载数据</el-button>
              </div>
              <div class="form-item">
                <el-button size="small" @click="mockFetchData">从接口获取</el-button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="placeholder-text">此组件不支持数据绑定</div>
          </template>
        </div>

        <el-empty v-else description="请选择组件配置数据" :image-size="100" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'

const store = useBiEditorStore()

const activeTab = ref('props')

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
  // TODO: 实现模拟数据加载
  console.log('模拟加载数据')
}

function mockFetchData() {
  // TODO: 实现接口数据获取
  console.log('从接口获取数据')
}
</script>

<style scoped lang="less">
.right-panel {
  width: 300px;
  height: 100%;
  background: var(--bi-panel-bg, #1f2937);
  border-left: 1px solid var(--bi-border-color, #374151);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__header) {
  margin: 0;
  background: var(--bi-panel-header-bg, #111827);
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
  overflow-y: auto;
  padding: 16px;
}

.section {
  margin-bottom: 20px;
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
}

:deep(.form-check .el-checkbox__label) {
  color: var(--bi-text-primary, #f3f4f6);
}

.layer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

:deep(.layer-actions .el-button) {
  flex: 1;
  min-width: 60px;
}

.placeholder-text {
  font-size: 13px;
  color: var(--bi-text-muted, #6b7280);
  text-align: center;
  padding: 20px;
}

/* 表单控件样式覆盖 */
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

/* 滚动条 */
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
