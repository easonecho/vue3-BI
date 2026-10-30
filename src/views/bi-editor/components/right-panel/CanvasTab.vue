<template>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBiEditorStore } from '@/stores/bi-editor'

const store = useBiEditorStore()

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
  store.updateCanvas({ [key]: value })
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
</script>

<style scoped lang="less">
@import './shared.less';

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
</style>
