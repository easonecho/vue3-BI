import { describe, expect, it } from 'vitest'
import {
  buildChinaMapNameMap,
  chinaMapRegionName,
  isEnglishLocale,
  toGeoProvinceName,
} from './province-names'

describe('china-map 省份名称工具', () => {
  it('简称/英文名统一换算成 GeoJSON 全称', () => {
    expect(toGeoProvinceName('北京')).toBe('北京市')
    expect(toGeoProvinceName('内蒙古')).toBe('内蒙古自治区')
    expect(toGeoProvinceName('新疆')).toBe('新疆维吾尔自治区')
    expect(toGeoProvinceName('北京市')).toBe('北京市')
    expect(toGeoProvinceName('Beijing')).toBe('北京市')
    expect(toGeoProvinceName(' 上海 ')).toBe('上海市')
  })

  it('未知名称原样返回', () => {
    expect(toGeoProvinceName('南海诸岛')).toBe('南海诸岛')
  })

  it('中文环境保持 GeoJSON 全称，英文环境输出英文名', () => {
    expect(chinaMapRegionName('北京', 'zh-CN')).toBe('北京市')
    expect(chinaMapRegionName('北京', 'en-US')).toBe('Beijing')
    expect(chinaMapRegionName('内蒙古自治区', 'en-US')).toBe('Inner Mongolia')
  })

  it('仅英文环境生成 nameMap', () => {
    expect(buildChinaMapNameMap('zh-CN')).toBeUndefined()
    expect(buildChinaMapNameMap('en-US')?.['北京市']).toBe('Beijing')
    expect(buildChinaMapNameMap('en-US')?.['澳门特别行政区']).toBe('Macao')
  })

  it('识别英文语言变体', () => {
    expect(isEnglishLocale('en')).toBe(true)
    expect(isEnglishLocale('en-GB')).toBe(true)
    expect(isEnglishLocale('zh-CN')).toBe(false)
  })
})
