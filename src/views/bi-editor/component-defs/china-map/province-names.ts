/**
 * 中国省级行政区名称工具
 *
 * 远端 GeoJSON 中的区域名为全称（北京市 / 内蒙古自治区），而数据集与示例数据
 * 常用简称（北京 / 内蒙古）。这里统一换算，避免因名称不一致导致数值无法绑定；
 * 英文环境下通过 ECharts nameMap 把全称映射为英文显示名。
 */
interface ProvinceName {
  full: string
  short: string
  en: string
}

const PROVINCES: ProvinceName[] = [
  { full: '北京市', short: '北京', en: 'Beijing' },
  { full: '天津市', short: '天津', en: 'Tianjin' },
  { full: '河北省', short: '河北', en: 'Hebei' },
  { full: '山西省', short: '山西', en: 'Shanxi' },
  { full: '内蒙古自治区', short: '内蒙古', en: 'Inner Mongolia' },
  { full: '辽宁省', short: '辽宁', en: 'Liaoning' },
  { full: '吉林省', short: '吉林', en: 'Jilin' },
  { full: '黑龙江省', short: '黑龙江', en: 'Heilongjiang' },
  { full: '上海市', short: '上海', en: 'Shanghai' },
  { full: '江苏省', short: '江苏', en: 'Jiangsu' },
  { full: '浙江省', short: '浙江', en: 'Zhejiang' },
  { full: '安徽省', short: '安徽', en: 'Anhui' },
  { full: '福建省', short: '福建', en: 'Fujian' },
  { full: '江西省', short: '江西', en: 'Jiangxi' },
  { full: '山东省', short: '山东', en: 'Shandong' },
  { full: '河南省', short: '河南', en: 'Henan' },
  { full: '湖北省', short: '湖北', en: 'Hubei' },
  { full: '湖南省', short: '湖南', en: 'Hunan' },
  { full: '广东省', short: '广东', en: 'Guangdong' },
  { full: '广西壮族自治区', short: '广西', en: 'Guangxi' },
  { full: '海南省', short: '海南', en: 'Hainan' },
  { full: '重庆市', short: '重庆', en: 'Chongqing' },
  { full: '四川省', short: '四川', en: 'Sichuan' },
  { full: '贵州省', short: '贵州', en: 'Guizhou' },
  { full: '云南省', short: '云南', en: 'Yunnan' },
  { full: '西藏自治区', short: '西藏', en: 'Tibet' },
  { full: '陕西省', short: '陕西', en: 'Shaanxi' },
  { full: '甘肃省', short: '甘肃', en: 'Gansu' },
  { full: '青海省', short: '青海', en: 'Qinghai' },
  { full: '宁夏回族自治区', short: '宁夏', en: 'Ningxia' },
  { full: '新疆维吾尔自治区', short: '新疆', en: 'Xinjiang' },
  { full: '台湾省', short: '台湾', en: 'Taiwan' },
  { full: '香港特别行政区', short: '香港', en: 'Hong Kong' },
  { full: '澳门特别行政区', short: '澳门', en: 'Macao' },
]

const BY_FULL = new Map(PROVINCES.map((p) => [p.full, p]))
const BY_SHORT = new Map(PROVINCES.map((p) => [p.short, p]))
const BY_EN = new Map(PROVINCES.map((p) => [p.en.toLowerCase(), p]))

/** 是否英文环境 */
export function isEnglishLocale(locale: string): boolean {
  return locale.toLowerCase().startsWith('en')
}

/**
 * 把简称 / 全称 / 英文名统一换算成 GeoJSON 全称。
 * 未知名称（如南海诸岛）原样返回。
 */
export function toGeoProvinceName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return trimmed
  const hit = BY_SHORT.get(trimmed) ?? BY_FULL.get(trimmed) ?? BY_EN.get(trimmed.toLowerCase())
  return hit ? hit.full : trimmed
}

/** 数据项在图表中使用的区域名（英文环境用英文名，中文环境保持 GeoJSON 全称） */
export function chinaMapRegionName(name: string, locale: string): string {
  const full = toGeoProvinceName(name)
  if (!isEnglishLocale(locale)) return full
  return BY_FULL.get(full)?.en ?? full
}

/** ECharts nameMap：中文环境无需映射，英文环境把 GeoJSON 全称映射为英文 */
export function buildChinaMapNameMap(locale: string): Record<string, string> | undefined {
  if (!isEnglishLocale(locale)) return undefined
  const nameMap: Record<string, string> = {}
  for (const p of PROVINCES) nameMap[p.full] = p.en
  return nameMap
}
