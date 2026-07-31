<template>
  <div :class="['component-renderer', `render-${component.type}`]">
    <!-- 文本组件 -->
    <div v-if="component.type === 'text'" class="render-text">
      {{ component.props.text || '文本' }}
    </div>

    <!-- 图片组件 -->
    <div v-else-if="component.type === 'image'" class="render-image">
      <span>图片</span>
    </div>

    <!-- 矩形组件 -->
    <div v-else-if="component.type === 'rect'" class="render-rect"></div>

    <!-- 直线组件 -->
    <div v-else-if="component.type === 'line'" class="render-line"></div>

    <!-- 图表组件 -->
    <div
      v-else-if="['bar-chart', 'line-chart', 'pie-chart', 'scatter-chart'].includes(component.type)"
      class="render-chart"
    >
      <span>{{ component.props.title || '图表' }}</span>
    </div>

    <!-- 表格组件 -->
    <div v-else-if="component.type === 'table'" class="render-table">
      <span>表格</span>
    </div>

    <!-- 数字组件 -->
    <div v-else-if="component.type === 'number'" class="render-number">
      {{ component.props.value ?? 0 }}
    </div>

    <!-- 仪表盘组件 -->
    <div v-else-if="component.type === 'gauge'" class="render-gauge">
      <span>仪表盘</span>
    </div>

    <!-- 进度条组件 -->
    <div v-else-if="component.type === 'progress'" class="render-progress">
      <span>进度条</span>
    </div>

    <!-- 指标卡组件 -->
    <div v-else-if="component.type === 'indicator'" class="render-indicator">
      <span class="indicator-title">{{ component.props.title || '指标' }}</span>
      <span class="indicator-value">{{ component.props.value ?? 0 }}</span>
    </div>

    <!-- 默认组件 -->
    <div v-else class="render-default">
      {{ component.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentInstance } from '@/views/bi-editor/types'

defineProps<{
  component: ComponentInstance
}>()
</script>

<style scoped>
.component-renderer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.render-text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 14px;
  color: #333;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
}
.render-image,
.render-chart,
.render-table {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  color: #6b7280;
  font-size: 14px;
}
.render-rect {
  width: 100%;
  height: 100%;
  background: #e5e7eb;
  border: 1px solid #d1d5db;
}
.render-line {
  width: 100%;
  height: 100%;
  background: #9ca3af;
}
.render-number {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  font-size: 24px;
  font-weight: bold;
  color: #111827;
}
.render-gauge,
.render-progress,
.render-indicator {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  color: #6b7280;
}
.indicator-title {
  font-size: 14px;
  color: #6b7280;
}
.indicator-value {
  font-size: 28px;
  font-weight: bold;
  color: #111827;
}
.render-default {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  color: #6b7280;
}
</style>
