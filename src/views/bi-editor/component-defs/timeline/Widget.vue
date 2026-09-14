<template>
  <div class="widget-timeline" :class="`widget-timeline--${direction}`" :style="containerStyle">
    <div v-if="showTitle" class="widget-timeline__title" :style="titleStyle">{{ title }}</div>
    <div class="widget-timeline__body">
      <div class="widget-timeline__line" :style="lineStyle" />
      <div
        v-for="(ev, idx) in events"
        :key="idx"
        class="widget-timeline__item"
        :class="itemClass(idx)"
      >
        <div class="widget-timeline__dot" :style="dotStyle" />
        <div class="widget-timeline__content">
          <div class="widget-timeline__time" :style="timeStyle">{{ ev.time }}</div>
          <div class="widget-timeline__ev-title" :style="evTitleStyle">{{ ev.title }}</div>
          <div v-if="ev.content" class="widget-timeline__ev-content" :style="contentStyle">{{ ev.content }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const title = computed(() => props.comp.props?.title ?? '事件时间轴')
const showTitle = computed(() => props.comp.props?.showTitle ?? true)
const direction = computed(() => props.comp.props?.direction ?? 'vertical')
const alternate = computed(() => props.comp.props?.alternate ?? true)
const dotColor = computed(() => props.comp.props?.dotColor ?? '#22d3ee')
const lineColor = computed(() => props.comp.props?.lineColor ?? '#334155')
const fontSize = computed(() => props.comp.props?.fontSize ?? 12)
const titleColor = computed(() => props.comp.props?.titleColor ?? '#e2e8f0')
const contentColor = computed(() => props.comp.props?.contentColor ?? '#94a3b8')
const timeColor = computed(() => props.comp.props?.timeColor ?? '#67e8f9')

interface TimelineEvent {
  time: string
  title: string
  content: string
}

const events = computed<TimelineEvent[]>(() => {
  const raw = props.comp.props?.events
  return Array.isArray(raw) ? (raw as TimelineEvent[]) : []
})

const containerStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
}))

const titleStyle = computed(() => ({
  fontSize: `${fontSize.value + 2}px`,
  color: titleColor.value,
  fontWeight: 'bold',
}))

const lineStyle = computed(() => ({
  background: lineColor.value,
}))

const dotStyle = computed(() => ({
  background: dotColor.value,
  boxShadow: `0 0 6px ${dotColor.value}`,
}))

const timeStyle = computed(() => ({
  color: timeColor.value,
}))

const evTitleStyle = computed(() => ({
  color: titleColor.value,
  fontWeight: 'bold',
}))

const contentStyle = computed(() => ({
  color: contentColor.value,
}))

function itemClass(idx: number) {
  const classes: string[] = []
  if (direction.value === 'vertical') {
    if (alternate.value) {
      // 第1项(奇)在左，第2项(偶)在右
      classes.push(idx % 2 === 0 ? 'widget-timeline__item--left' : 'widget-timeline__item--right')
    } else {
      classes.push('widget-timeline__item--right')
    }
  } else {
    classes.push('widget-timeline__item--h')
  }
  return classes
}
</script>

<style scoped lang="less">
.widget-timeline {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  user-select: none;
  padding: 8px 12px;

  &__title {
    flex-shrink: 0;
    margin-bottom: 12px;
  }

  &__body {
    flex: 1;
    position: relative;
    overflow: auto;
  }

  &__line {
    position: absolute;
    background: #334155;
  }

  &__dot {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__time {
    line-height: 1.3;
  }

  &__ev-title {
    line-height: 1.3;
  }

  &__ev-content {
    line-height: 1.4;
  }

  // 垂直模式
  &--vertical &__line {
    left: 50%;
    top: 0;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%);
  }

  &--vertical &__item {
    position: relative;
    width: 50%;
    padding: 6px 0;
    box-sizing: border-box;
  }

  &--vertical &__item--left {
    margin-right: 50%;
    padding-right: 20px;
    text-align: right;

    .widget-timeline__content {
      align-items: flex-end;
    }

    .widget-timeline__dot {
      right: -6px;
      top: 10px;
    }
  }

  &--vertical &__item--right {
    margin-left: 50%;
    padding-left: 20px;

    .widget-timeline__dot {
      left: -6px;
      top: 10px;
    }
  }

  // 水平模式
  &--horizontal &__body {
    display: flex;
    align-items: flex-start;
    overflow-x: auto;
    overflow-y: hidden;
  }

  &--horizontal &__line {
    left: 0;
    right: 0;
    top: 9px;
    height: 2px;
    width: 100%;
  }

  &--horizontal &__item--h {
    position: relative;
    flex: 1;
    min-width: 100px;
    padding: 24px 12px 0 0;
    box-sizing: border-box;

    .widget-timeline__dot {
      left: 0;
      top: 4px;
    }

    .widget-timeline__content {
      align-items: flex-start;
    }
  }
}
</style>
