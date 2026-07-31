<template>
  <div class="bi-editor">
    <HeaderToolbar />
    <div class="editor-body">
      <LeftPanel
        @drag-start="handleDragStart"
        @add-component="handleAddComponent"
      />
      <CanvasArea
        :zoom="store.canvas.zoom"
        @select-component="handleSelectComponent"
      />
      <RightPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import HeaderToolbar from './components/HeaderToolbar.vue'
import LeftPanel from './components/LeftPanel.vue'
import CanvasArea from './components/CanvasArea.vue'
import RightPanel from './components/RightPanel.vue'
import { useBiEditorStore } from '@/stores/biEditor'
import { useKeyboardShortcuts } from './composables/useCanvas'
import type { ComponentMeta } from './types'

const store = useBiEditorStore()

useKeyboardShortcuts()

function handleDragStart(event: DragEvent, meta: ComponentMeta) {
  console.log('drag start', meta)
}

function handleAddComponent(meta: ComponentMeta) {
  const centerX = store.canvas.width / 2 - meta.defaultWidth / 2
  const centerY = store.canvas.height / 2 - meta.defaultHeight / 2
  store.addComponent(meta.type, centerX, centerY)
}

function handleSelectComponent(id: string | null) {
  store.selectComponent(id)
}

onMounted(() => {
  store.clearHistory()
})
</script>

<style scoped>
.bi-editor {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bi-bg, #111827);
  overflow: hidden;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
