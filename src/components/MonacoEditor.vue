<template>
  <div ref="containerRef" class="monaco-editor-container" :style="containerStyle"></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import * as monaco from 'monaco-editor'
// 🔑 Vite 官方推荐方式：用 ?worker 后缀导入 monaco web worker
// 注意：monaco-editor 的 package.json exports 将 "./*" 映射到 "./esm/vs/*.js"
// 所以导入路径不能带 esm/vs/ 前缀，否则路径会重复
import editorWorker from 'monaco-editor/editor/editor.worker.js?worker'
import jsonWorker from 'monaco-editor/language/json/json.worker.js?worker'

// 配置 Monaco Environment：JSON 语言用 jsonWorker，其余用 editorWorker
// 必须在 monaco.editor.create 之前设置
self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'json') return new jsonWorker()
    return new editorWorker()
  },
}

const props = withDefaults(
  defineProps<{
    /** 编辑器内容（双向绑定） */
    modelValue: string
    /** 语言，如 'json' / 'sql' / 'javascript' */
    language?: string
    /** 高度，数字按 px，字符串直接作为 CSS */
    height?: number | string
    /** 是否只读 */
    readOnly?: boolean
    /** 主题 */
    theme?: string
  }>(),
  {
    language: 'json',
    height: 300,
    readOnly: false,
    theme: 'vs-dark',
  },
)

const emit = defineEmits<{
  'update:modelValue': [val: string]
  /** JSON 语法错误信息，无错误时为 null */
  error: [msg: string | null]
  /** Ctrl+S 快捷键 */
  save: []
}>()

const containerRef = ref<HTMLDivElement | null>(null)
/** 用 shallowRef 避免 monaco editor 实例被 Vue 响应式包裹（深度代理会破坏内部状态） */
const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)

const containerStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  width: '100%',
}))

/** 当前编辑器值，用于判断是否需要 setValue 同步（避免光标跳动） */
let currentValue = ''

onMounted(() => {
  if (!containerRef.value) return

  editorRef.value = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    lineHeight: 21,
    tabSize: 2,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    readOnly: props.readOnly,
    smoothScrolling: true,
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
    padding: { top: 8, bottom: 8 },
  })

  currentValue = props.modelValue

  // 内容变更 → 双向绑定
  editorRef.value.onDidChangeModelContent(() => {
    const val = editorRef.value!.getValue()
    currentValue = val
    emit('update:modelValue', val)

    // 🔑 利用 monaco 内置 JSON 诊断捕获语法错误
    if (props.language === 'json') {
      const markers = monaco.editor.getModelMarkers({
        resource: editorRef.value!.getModel()!.uri,
      })
      const errorMarker = markers.find(
        (m) => m.severity === monaco.MarkerSeverity.Error,
      )
      emit('error', errorMarker ? errorMarker.message : null)
    }
  })

  // Ctrl+S 快捷键 → emit save
  editorRef.value.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    emit('save')
  })

  // 失焦时也触发 save（方便自动应用）
  editorRef.value.onDidBlurEditorText(() => {
    emit('save')
  })
})

// 外部 modelValue 变更 → 同步到编辑器（仅当值确实不同时）
watch(
  () => props.modelValue,
  (val) => {
    if (val !== currentValue && editorRef.value) {
      currentValue = val
      editorRef.value.setValue(val)
    }
  },
)

// 切换语言
watch(
  () => props.language,
  (lang) => {
    if (editorRef.value) {
      const model = editorRef.value.getModel()
      if (model) monaco.editor.setModelLanguage(model, lang)
    }
  },
)

// 切换只读
watch(
  () => props.readOnly,
  (ro) => {
    editorRef.value?.updateOptions({ readOnly: ro })
  },
)

onBeforeUnmount(() => {
  editorRef.value?.dispose()
  editorRef.value = null
})

defineExpose({
  /** 格式化当前文档 */
  format: () => {
    editorRef.value?.getAction('editor.action.formatDocument')?.run()
  },
  /** 聚焦编辑器 */
  focus: () => editorRef.value?.focus(),
})
</script>

<style scoped>
.monaco-editor-container {
  border: 1px solid #2d2d2d;
  border-radius: 4px;
  overflow: hidden;
  background: #1e1e1e;
}
</style>
