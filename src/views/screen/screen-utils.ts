/** 数字补零（时钟格式化） */
export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

/** 排行数值缩写：万为单位 */
export function formatK(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : n.toLocaleString()
}
