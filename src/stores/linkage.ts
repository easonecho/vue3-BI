/**
 * 仪表板联动 Store
 * 管理全局筛选器值和组件间联动
 *
 * 安全说明:
 *   本 store 不再做 SQL 字符串拼接 (会引入 SQL 注入风险)。
 *   取而代之, 通过 getParamsForComponent 返回参数对象,
 *   由调用方传给后端 executeDataset(id, { params }) 接口,
 *   后端使用参数化查询 (? 占位符 + 值数组) 执行, 避免注入。
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LinkFilter, DrillFilter } from '@/views/bi-editor/composables/linkage-filter';

/** 全局筛选器值: { filterKey: value } */
export type FilterValues = Record<string, string | number | null>;

/** 传给后端的参数对象 (值类型受限于 JSON 可序列化) */
export type SqlParams = Record<string, string | number | boolean | null>;

export type { LinkFilter, DrillFilter };

export const useLinkageStore = defineStore('linkage', () => {
  /** 全局筛选器值 */
  const filterValues = ref<FilterValues>({});

  /** 联动配置: 组件ID -> 订阅的 filterKey 列表 */
  const subscriptions = ref<Record<string, string[]>>({});

  /** 图表点击联动是否启用（预览/分享页开启，编辑器默认关闭避免与选中冲突） */
  const linkageEnabled = ref(false);

  /** 图表点击产生的联动筛选（每个源组件最多一条） */
  const linkFilters = ref<LinkFilter[]>([]);

  /** 钻取状态: 组件ID -> 已下钻的维度值栈 */
  const drillStates = ref<Record<string, DrillFilter[]>>({});

  function setLinkageEnabled(enabled: boolean) {
    linkageEnabled.value = enabled;
    // 切换场景（编辑器 ↔ 预览/分享）时清空联动与钻取状态，避免残留
    linkFilters.value = [];
    drillStates.value = {};
  }

  /**
   * 切换联动筛选:
   *   - 点击同一源组件、同一字段、同一值 → 取消该筛选
   *   - 同一源组件只保留一条筛选（替换旧值）
   */
  function toggleLinkFilter(filter: LinkFilter) {
    const exists = linkFilters.value.find(
      (f) =>
        f.sourceId === filter.sourceId && f.field === filter.field && f.value === filter.value,
    );
    if (exists) {
      linkFilters.value = linkFilters.value.filter((f) => f !== exists);
      return;
    }
    linkFilters.value = [
      ...linkFilters.value.filter((f) => f.sourceId !== filter.sourceId),
      filter,
    ];
  }

  function clearLinkFiltersBySource(sourceId: string) {
    linkFilters.value = linkFilters.value.filter((f) => f.sourceId !== sourceId);
  }

  function clearLinkFilters() {
    linkFilters.value = [];
  }

  /** 压入一层钻取 */
  function pushDrill(componentId: string, field: string, value: string) {
    const stack = drillStates.value[componentId] ?? [];
    drillStates.value = {
      ...drillStates.value,
      [componentId]: [...stack, { field, value }],
    };
  }

  /** 返回上一层钻取 */
  function popDrill(componentId: string) {
    const stack = drillStates.value[componentId] ?? [];
    if (stack.length === 0) return;
    const next = stack.slice(0, -1);
    const rest = { ...drillStates.value };
    if (next.length === 0) delete rest[componentId];
    else rest[componentId] = next;
    drillStates.value = rest;
  }

  /** 清空某组件的钻取栈 */
  function resetDrill(componentId: string) {
    if (!drillStates.value[componentId]) return;
    const rest = { ...drillStates.value };
    delete rest[componentId];
    drillStates.value = rest;
  }

  function getDrillStack(componentId: string): DrillFilter[] {
    return drillStates.value[componentId] ?? [];
  }

  /**
   * 计算组件当前生效的维度字段:
   *   - 无钻取 → fallback（原配置字段）
   *   - 已钻取 N 层 → drillFields[N - 1]（下一层维度）
   */
  function getDrillField(componentId: string, drillFields: string[], fallback: string): string {
    const stack = drillStates.value[componentId] ?? [];
    if (stack.length === 0) return fallback;
    return drillFields[stack.length - 1] || fallback;
  }

  /** 获取某个筛选器的值 */
  function getFilter(key: string): string | number | null {
    return filterValues.value[key] ?? null;
  }

  /** 设置筛选器值并触发联动 */
  function setFilter(key: string, value: string | number | null) {
    filterValues.value[key] = value;
  }

  /** 批量设置筛选器值 */
  function setFilters(values: FilterValues) {
    filterValues.value = { ...filterValues.value, ...values };
  }

  /** 订阅组件到筛选器 */
  function subscribe(componentId: string, filterKeys: string[]) {
    subscriptions.value[componentId] = filterKeys;
  }

  /** 取消订阅 */
  function unsubscribe(componentId: string) {
    delete subscriptions.value[componentId];
  }

  /** 获取组件订阅的筛选器值 (用于参数化SQL) */
  function getFiltersForComponent(componentId: string): FilterValues {
    const keys = subscriptions.value[componentId] || [];
    const result: FilterValues = {};
    for (const key of keys) {
      result[key] = filterValues.value[key] ?? null;
    }
    return result;
  }

  /**
   * 构造传给后端 executeDataset 的参数对象。
   *
   * 安全策略:
   *   - 仅返回原始值 (string/number/boolean/null), 不做 SQL 字符串拼接。
   *   - 由后端使用 prepared statement (? 占位符 + 值数组) 执行, 杜绝 SQL 注入。
   *   - null 值直接传给后端, 由后端 SQL 语法处理 (建议使用 IS NULL 而非 = NULL)。
   *
   * @param componentId 可选, 若提供则合并该组件订阅的筛选器值
   * @returns 参数对象, 可直接传给 executeDataset(id, { params })
   */
  function getParamsForComponent(componentId?: string): SqlParams {
    let params: FilterValues = filterValues.value;
    if (componentId) {
      params = { ...filterValues.value, ...getFiltersForComponent(componentId) };
    }
    // 转换为后端可接受的类型 (string/number/boolean/null)
    const result: SqlParams = {};
    for (const [key, val] of Object.entries(params)) {
      if (val === null || val === undefined) {
        result[key] = null;
      } else if (typeof val === 'number' || typeof val === 'string') {
        result[key] = val;
      } else {
        // 兜底: 转字符串
        result[key] = String(val);
      }
    }
    return result;
  }

  /**
   * @deprecated 已废弃, 请使用 getParamsForComponent + executeDataset(id, { params })。
   *             保留仅为向后兼容, 内部不再做字符串拼接, 而是返回原始 SQL (不替换参数)。
   */
  function applyParams(sql: string, _componentId?: string): string {
    // 不再替换 {{param}} 占位符, 由后端参数化查询处理。
    // 返回原始 SQL, 避免引入 SQL 注入风险。
    return sql;
  }

  /** 重置所有筛选器 / 联动 / 钻取 */
  function reset() {
    filterValues.value = {};
    subscriptions.value = {};
    linkFilters.value = [];
    drillStates.value = {};
  }

  return {
    filterValues,
    subscriptions,
    getFilter,
    setFilter,
    setFilters,
    subscribe,
    unsubscribe,
    getFiltersForComponent,
    getParamsForComponent,
    applyParams,
    reset,
    // 联动 / 钻取
    linkageEnabled,
    linkFilters,
    drillStates,
    setLinkageEnabled,
    toggleLinkFilter,
    clearLinkFiltersBySource,
    clearLinkFilters,
    pushDrill,
    popDrill,
    resetDrill,
    getDrillStack,
    getDrillField,
  };
});
