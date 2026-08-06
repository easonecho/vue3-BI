import type { EChartsOption } from 'echarts'

/**
 * 🔑 公共默认 option：所有图表组件共享的基础配置。
 *   图表组件通过 `mergeOptions(baseOption, chartSpecificOption)` 叠加特有配置。
 */
export function getBaseOption(): EChartsOption {
  return {
    textStyle: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 12,
      color: '#6b7280',
    },
    color: [
      '#5470c6',
      '#91cc75',
      '#fac858',
      '#ee6666',
      '#73c0de',
      '#3ba272',
      '#fc8452',
      '#9a60b4',
      '#ea7ccc',
    ],
    grid: {
      left: 40,
      right: 20,
      top: 40,
      bottom: 30,
      containLabel: true,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 4px;',
    },
    legend: {
      show: true,
      bottom: 0,
      textStyle: { color: '#6b7280', fontSize: 12 },
      itemGap: 16,
      itemWidth: 14,
      itemHeight: 8,
    },
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
  }
}

/** 🔑 深浅合并：图表特有 option 叠加到 base option 上 */
export function mergeOptions(base: EChartsOption, specific: EChartsOption): EChartsOption {
  return { ...base, ...specific }
}
