<template>
  <div class="widget-image" :style="containerStyle">
    <img v-if="imageSrc" :src="imageSrc" :alt="alt" class="widget-image__img" />
    <div v-else class="widget-image__placeholder">
      <span>图片</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance } from '@/views/bi-editor/types'

const props = defineProps<{ comp: ComponentInstance }>()

const imageSrc = computed(() => props.comp.props?.src || '')
const alt = computed(() => props.comp.props?.alt || '')
const containerStyle = computed(() => ({
  objectFit: props.comp.props?.fit || 'cover',
  borderRadius: `${props.comp.props?.borderRadius || 0}px`,
}))
</script>

<style scoped lang="less">
.widget-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f9fafb;

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #9ca3af;
    font-size: 14px;
    border: 1px dashed #d1d5db;
  }
}
</style>
