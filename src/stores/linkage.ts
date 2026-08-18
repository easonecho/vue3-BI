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
import { ref, computed } from 'vue';

/** 全局筛选器值: { filterKey: value } */
export type FilterValues = Record<string, string | number | null>;

/** 传给后端的参数对象 (值类型受限于 JSON 可序列化) */
export type SqlParams = Record<string, string | number | boolean | null>;

export const useLinkageStore = defineStore('linkage', () => {
  /** 全局筛选器值 */
  const filterValues = ref<FilterValues>({});

  /** 联动配置: 组件ID -> 订阅的 filterKey 列表 */
  const subscriptions = ref<Record<string, string[]>>({});

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

  /** 重置所有筛选器 */
  function reset() {
    filterValues.value = {};
    subscriptions.value = {};
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
  };
});