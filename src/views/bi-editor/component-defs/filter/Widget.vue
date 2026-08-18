<template>
  <div class="filter-widget" :style="{ padding: '8px 12px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }">
    <div v-if="props.title" class="filter-widget__title">{{ props.title }}</div>
    <el-select
      v-if="props.filterType === 'select'"
      v-model="selectedValue"
      :placeholder="props.placeholder"
      clearable
      style="width: 100%"
      @change="onFilterChange"
    >
      <el-option v-for="opt in parsedOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
    </el-select>
    <el-select
      v-else-if="props.filterType === 'multi-select'"
      v-model="selectedValues"
      multiple
      :placeholder="props.placeholder"
      clearable
      style="width: 100%"
      @change="onMultiFilterChange"
    >
      <el-option v-for="opt in parsedOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
    </el-select>
    <el-date-picker
      v-else-if="props.filterType === 'date'"
      v-model="selectedValue"
      type="date"
      :placeholder="props.placeholder"
      value-format="YYYY-MM-DD"
      style="width: 100%"
      @change="onFilterChange"
    />
    <el-date-picker
      v-else-if="props.filterType === 'date-range'"
      v-model="dateRange"
      type="daterange"
      range-separator="至"
      start-placeholder="开始"
      end-placeholder="结束"
      value-format="YYYY-MM-DD"
      style="width: 100%"
      @change="onDateRangeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useLinkageStore } from '@/stores/linkage';

const props = defineProps<{
  comp: any;
  title?: string;
  filterKey?: string;
  filterType?: string;
  placeholder?: string;
  options?: string;
}>();

const linkageStore = useLinkageStore();

const selectedValue = ref<string | null>(null);
const selectedValues = ref<string[]>([]);
const dateRange = ref<[string, string] | null>(null);

const parsedOptions = computed(() => {
  const text = props.options || '';
  return text.split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        return { label: line.substring(0, idx).trim(), value: line.substring(idx + 1).trim() };
      }
      return { label: line, value: line };
    });
});

function onFilterChange(val: string | null) {
  const key = props.filterKey || 'default';
  linkageStore.setFilter(key, val);
}

function onMultiFilterChange(vals: string[]) {
  const key = props.filterKey || 'default';
  // 多选: 取第一个值或拼接
  linkageStore.setFilter(key, vals.length > 0 ? vals.join(',') : null);
}

function onDateRangeChange(val: [string, string] | null) {
  const key = props.filterKey || 'default';
  if (val) {
    linkageStore.setFilter(`${key}_start`, val[0]);
    linkageStore.setFilter(`${key}_end`, val[1]);
  } else {
    linkageStore.setFilter(`${key}_start`, null);
    linkageStore.setFilter(`${key}_end`, null);
  }
}

// 初始化默认值
watch(() => props.filterKey, (key) => {
  if (key) {
    // 注册组件到联动 store
    const compId = props.comp?.id || 'unknown';
    linkageStore.subscribe(compId, [key]);
  }
}, { immediate: true });
</script>

<style scoped lang="less">
.filter-widget {
  &__title {
    font-size: 13px;
    color: #606266;
    margin-bottom: 6px;
    font-weight: 500;
  }
}
</style>
