<template>
  <div class="layer-tab">
    <!-- 🔑 图层搜索：按名称模糊过滤（不区分大小写） -->
    <div class="layer-toolbar">
      <el-input
        v-model="layerKeyword"
        size="small"
        clearable
        :placeholder="t('editorUi.layer.searchPlaceholder')"
        :prefix-icon="Search"
      />
      <div v-if="layerKeyword" class="layer-toolbar__count">
        {{ filteredLayerList.length }} / {{ store.layerList.length }}
      </div>
    </div>
    <div class="layer-list">
      <div
        v-for="layer in filteredLayerList"
        :key="layer.id"
        class="layer-item"
        :class="{
          active: layer.id === store.selectedId,
          'multi-selected': store.selectedIdSet.has(layer.id),
          hidden: !layer.visible,
        }"
        @click="onLayerClick($event, layer)"
        @dblclick.stop="startRename(layer)"
        @contextmenu.prevent="onLayerContextMenu($event, layer)"
      >
        <div class="layer-thumb">
          <div
            class="layer-thumb__inner"
            :style="previewScaleStyle(layer.width, layer.height, 34, 26)"
          >
            <ComponentRenderer :component="layer" />
          </div>
        </div>
        <div class="layer-info">
          <el-input
            v-if="renamingId === layer.id"
            ref="renameInputRef"
            v-model="renameDraft"
            size="small"
            class="layer-name-input"
            @click.stop
            @blur="commitRename(layer)"
            @keyup.enter="commitRename(layer)"
            @keyup.esc="cancelRename"
          />
          <span v-else class="layer-name" :class="{ hidden: !layer.visible }">
            {{ layer.name }}
          </span>
          <div v-if="layer.groupId" class="layer-tag">{{ t('editorUi.layer.groupTag') }}</div>
        </div>
        <div class="layer-actions">
          <el-tooltip
            :content="layer.visible ? t('editorUi.layer.hide') : t('editorUi.layer.show')"
            placement="top"
          >
            <el-icon
              :size="16"
              class="action-btn"
              :class="{ active: layer.visible }"
              @click.stop="store.toggleVisibility(layer.id)"
              ><component :is="layer.visible ? View : Hide"
            /></el-icon>
          </el-tooltip>
          <el-tooltip
            :content="layer.locked ? t('editorUi.layer.unlock') : t('editorUi.layer.lock')"
            placement="top"
          >
            <el-icon
              :size="16"
              class="action-btn"
              :class="{ active: layer.locked }"
              @click.stop="store.toggleLock(layer.id)"
              ><component :is="layer.locked ? Lock : Unlock"
            /></el-icon>
          </el-tooltip>
        </div>
      </div>

      <el-empty
        v-if="store.components.length === 0"
        :description="t('editorUi.layer.empty')"
        :image-size="80"
      />
    </div>
    <!-- 🔑 图层右键菜单（与画布/组件右键复用 ContextMenu.vue） -->
    <ContextMenu ref="layerCtxRef" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Search, View, Hide, Lock, Unlock } from '@element-plus/icons-vue'
import ComponentRenderer from '../canvas/ComponentRenderer.vue'
import ContextMenu from '../canvas/ContextMenu.vue'
import { useLayerList } from './useLayerList'

const { t } = useI18n()
const {
  store,
  layerKeyword,
  filteredLayerList,
  layerCtxRef,
  onLayerClick,
  renamingId,
  renameDraft,
  renameInputRef,
  startRename,
  commitRename,
  cancelRename,
  onLayerContextMenu,
  previewScaleStyle,
} = useLayerList()
</script>

<style scoped lang="less">
@import './layer-list.less';
</style>
