<template>
  <component :is="widgetComponent" :comp="component" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentInstance, ComponentType } from '@/views/bi-editor/types'
import { getWidgetComponent } from './widget-registry'

const props = defineProps<{
  component: ComponentInstance
}>()

const widgetComponent = computed(() => getWidgetComponent(props.component.type as ComponentType))
</script>
