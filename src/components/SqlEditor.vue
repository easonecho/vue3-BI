<template>
  <div class="sql-editor" :style="{ height: typeof height === 'number' ? height + 'px' : height }">
    <div class="sql-editor__toolbar">
      <span class="sql-editor__label">{{ label || 'SQL' }}</span>
      <div class="sql-editor__tools">
        <el-button text size="small" @click="formatSql">格式化</el-button>
        <el-button text size="small" @click="insertSnippet">插入片段</el-button>
      </div>
    </div>
    <div class="sql-editor__body">
      <div class="sql-editor__lines" ref="linesRef">
        <div v-for="n in lineCount" :key="n" class="sql-editor__line-num">{{ n }}</div>
      </div>
      <textarea
        ref="taRef"
        :value="modelValue"
        class="sql-editor__textarea"
        spellcheck="false"
        :placeholder="placeholder"
        @input="onInput"
        @scroll="syncScroll"
        @keydown="onKeyDown"
      />
      <div class="sql-editor__highlight" v-html="highlightedHtml" ref="hlRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: string;
  height?: number | string;
  label?: string;
  placeholder?: string;
}>(), {
  height: 200,
  placeholder: 'SELECT * FROM ...',
});

const emit = defineEmits<{ 'update:modelValue': [val: string] }>();

const taRef = ref<HTMLTextAreaElement | null>(null);
const linesRef = ref<HTMLDivElement | null>(null);
const hlRef = ref<HTMLDivElement | null>(null);

const lineCount = computed(() => {
  const lines = (props.modelValue || '').split('\n').length;
  return Math.max(lines, 1);
});

function onInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value;
  emit('update:modelValue', val);
}

function syncScroll() {
  if (!taRef.value) return;
  if (linesRef.value) linesRef.value.scrollTop = taRef.value.scrollTop;
  if (hlRef.value) {
    hlRef.value.scrollTop = taRef.value.scrollTop;
    hlRef.value.scrollLeft = taRef.value.scrollLeft;
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const ta = taRef.value!;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = props.modelValue;
    const newVal = val.substring(0, start) + '  ' + val.substring(end);
    emit('update:modelValue', newVal);
    nextTick(() => {
      ta.selectionStart = ta.selectionEnd = start + 2;
    });
  }
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    formatSql();
  }
}

const SQL_KEYWORDS = [
  'SELECT','FROM','WHERE','AND','OR','NOT','IN','EXISTS','BETWEEN','LIKE','IS','NULL','AS',
  'JOIN','LEFT','RIGHT','INNER','OUTER','FULL','ON','UNION','ALL','GROUP','BY','HAVING',
  'ORDER','ASC','DESC','LIMIT','OFFSET','DISTINCT','COUNT','SUM','AVG','MIN','MAX',
  'CASE','WHEN','THEN','ELSE','END','IF','CAST','CONVERT','SUBSTRING','CONCAT',
  'INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','ALTER','DROP',
  'INDEX','VIEW','DATABASE','SCHEMA','PRIMARY','KEY','FOREIGN','REFERENCES','DEFAULT',
  'CONSTRAINT','CHECK','UNIQUE','TIMESTAMP','DATETIME','VARCHAR','INT','BIGINT',
  'DECIMAL','FLOAT','DOUBLE','BOOLEAN','TEXT','BLOB','JSON','DATE','TIME',
  'WITH','RECURSIVE','WINDOW','OVER','PARTITION','ROW','ROWS','RANGE','UNBOUNDED',
  'PRECEDING','FOLLOWING','CURRENT','GROUP_CONCAT','COALESCE','IFNULL','NULLIF',
];

const highlightedHtml = computed(() => {
  let html = (props.modelValue || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/'([^']*)'/g, '<span class="tk-str">\'$1\'</span>');
  html = html.replace(/"([^"]*)"/g, '<span class="tk-str">"$1"</span>');
  html = html.replace(/--([^\n]*)/g, '<span class="tk-cmt">--$1</span>');
  html = html.replace(/\/\*([\s\S]*?)\*\//g, '<span class="tk-cmt">/*$1*/</span>');
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="tk-num">$1</span>');
  const kwPattern = new RegExp('\\b(' + SQL_KEYWORDS.join('|') + ')\\b', 'gi');
  html = html.replace(kwPattern, '<span class="tk-kw">$1</span>');
  html = html.replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span class="tk-fn">$1</span>(');
  if (!html.endsWith('\n')) html += '\n';
  return html;
});

watch(() => props.modelValue, () => {
  nextTick(syncScroll);
}, { flush: 'post' });

function formatSql() {
  let sql = (props.modelValue || '').replace(/\s+/g, ' ').trim();
  if (!sql) return;
  const kws = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'FULL JOIN', 'JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'UNION ALL', 'UNION'];
  for (const kw of kws) {
    const re = new RegExp('\\s' + kw.replace(' ', '\\s+') + '\\s', 'gi');
    sql = sql.replace(re, '\n' + kw + ' ');
  }
  sql = sql.replace(/^SELECT\s/i, 'SELECT\n  ');
  emit('update:modelValue', sql);
}

function insertSnippet() {
  const snippet = 'SELECT\n  t.col1,\n  t.col2,\n  COUNT(*) AS cnt\nFROM table_name t\nWHERE t.status = 1\nGROUP BY t.col1, t.col2\nORDER BY cnt DESC\nLIMIT 100';
  if (!props.modelValue) {
    emit('update:modelValue', snippet);
  } else {
    emit('update:modelValue', props.modelValue + '\n\n' + snippet);
  }
}
</script>

<style scoped lang="less">
.sql-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background: #fafafa;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 8px;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    height: 32px;
  }
  &__label { font-size: 12px; color: #909399; font-weight: 600; }
  &__tools { display: flex; gap: 4px; }
  &__body { flex: 1; display: flex; position: relative; overflow: hidden; }
  &__lines {
    width: 40px;
    background: #f5f7fa;
    border-right: 1px solid #e4e7ed;
    overflow: hidden;
    flex-shrink: 0;
    user-select: none;
  }
  &__line-num {
    height: 21px;
    line-height: 21px;
    text-align: right;
    padding-right: 6px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    color: #c0c4cc;
  }
  &__textarea {
    flex: 1;
    border: none;
    outline: none;
    resize: none;
    padding: 0 8px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 21px;
    background: transparent;
    color: transparent;
    caret-color: #333;
    z-index: 2;
    position: relative;
    white-space: pre;
    overflow: auto;
  }
  &__highlight {
    position: absolute;
    top: 0;
    left: 40px;
    right: 0;
    bottom: 0;
    padding: 0 8px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 21px;
    pointer-events: none;
    z-index: 1;
    white-space: pre;
    overflow: auto;
    color: #333;
    :deep(.tk-kw) { color: #c678dd; font-weight: 600; }
    :deep(.tk-str) { color: #98c379; }
    :deep(.tk-num) { color: #d19a66; }
    :deep(.tk-cmt) { color: #7f848e; font-style: italic; }
    :deep(.tk-fn) { color: #61afef; }
  }
}
</style>
