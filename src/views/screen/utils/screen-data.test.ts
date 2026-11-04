import { describe, it, expect } from 'vitest'
import {
  buildCategorySeries,
  buildLegacyCategorySeries,
  buildLegacyPieData,
  buildPieData,
  buildRankingFromDashboards,
  buildRankingFromSeries,
  buildRatesFromSystem,
  detectNameValueFields,
  extractLayoutDatasetId,
  findBarConfig,
  findLineConfig,
  findPieConfig,
  parseLayoutChartConfigs,
  readString,
  readStringArray,
} from './screen-data'

describe('parseLayoutChartConfigs', () => {
  const layout = {
    datasetId: 99,
    components: [
      {
        id: 'c1',
        type: 'pie-chart',
        visible: true,
        dataSource: { datasetId: 3 },
        props: { titleText: '渠道构成' },
        dataConfig: { nameField: 'channel', valueField: 'amount' },
      },
      {
        id: 'c2',
        type: 'bar-chart',
        dataSource: { datasetId: 5 },
        props: { titleText: '区域销售' },
        dataConfig: { categoryField: 'region', valueFields: ['sales'] },
      },
      { id: 'c3', type: 'text', dataSource: { datasetId: null } },
      { id: 'c4', type: 'line-chart', visible: false, dataSource: { datasetId: 7 } },
    ],
  }

  it('收窄已绑定数据集且可见的图表组件', () => {
    const configs = parseLayoutChartConfigs(layout)
    expect(configs).toHaveLength(2)
    expect(configs[0]).toMatchObject({ id: 'c1', type: 'pie-chart', datasetId: 3 })
    expect(configs[0].dataConfig).toEqual({ nameField: 'channel', valueField: 'amount' })
    expect(configs[1].props.titleText).toBe('区域销售')
    expect(configs.map((config) => config.type)).toEqual(['pie-chart', 'bar-chart'])
  })

  it('非法布局返回空数组', () => {
    expect(parseLayoutChartConfigs(null)).toEqual([])
    expect(parseLayoutChartConfigs({})).toEqual([])
    expect(parseLayoutChartConfigs({ components: 'bad' })).toEqual([])
  })

  it('按类型优先级查找饼图/柱状图/折线图', () => {
    const configs = parseLayoutChartConfigs(layout)
    expect(findPieConfig(configs)?.id).toBe('c1')
    expect(findBarConfig(configs)?.id).toBe('c2')
    expect(findLineConfig(configs)).toBeNull()
    expect(findLineConfig([...configs, { id: 'l1', type: 'area-chart', datasetId: 8, props: {}, dataConfig: {} }])?.id).toBe('l1')
  })

  it('旧布局顶层 datasetId 兜底', () => {
    expect(extractLayoutDatasetId(layout)).toBe(99)
    expect(extractLayoutDatasetId({ dataSource: { datasetId: 12 } })).toBe(12)
    expect(extractLayoutDatasetId(null)).toBeNull()
    expect(extractLayoutDatasetId({ datasetId: 'abc' })).toBeNull()
  })
})

describe('字段读取', () => {
  it('readString 去空格并忽略空串', () => {
    expect(readString('  sales ')).toBe('sales')
    expect(readString('   ')).toBeNull()
    expect(readString(123)).toBeNull()
  })

  it('readStringArray 过滤非字符串与空项', () => {
    expect(readStringArray(['a', ' b ', '', 3, null])).toEqual(['a', 'b'])
    expect(readStringArray('a')).toEqual([])
  })
})

describe('数据映射', () => {
  const rows = [
    { channel: '线上', amount: 120 },
    { channel: '门店', amount: '80' },
    { channel: '代理', amount: 0 },
    { channel: '', amount: 30 },
  ]

  it('饼图数据过滤非正数与空名称，最多 8 项', () => {
    expect(buildPieData(rows, 'channel', 'amount')).toEqual([
      { name: '线上', value: 120 },
      { name: '门店', value: 80 },
      { name: '未命名', value: 30 },
    ])
    expect(buildPieData(rows, '', 'amount')).toEqual([])
  })

  it('类目轴数据保留类目顺序并把非法值转 0', () => {
    const data = buildCategorySeries(
      [
        { region: '华东', sales: 10, target: 20 },
        { region: '', sales: 'x', target: 30 },
      ],
      'region',
      ['sales', 'target'],
    )
    expect(data).toEqual({
      categories: ['华东', '未命名'],
      series: [
        { name: 'sales', data: [10, 0] },
        { name: 'target', data: [20, 30] },
      ],
    })
    expect(buildCategorySeries([], 'region', ['sales'])).toBeNull()
  })

  it('榜单按第一个系列倒序并计算相对最大值百分比', () => {
    const ranking = buildRankingFromSeries({
      categories: ['A', 'B', 'C'],
      series: [{ name: 'sales', data: [10, 40, 20] }],
    })
    expect(ranking).toEqual([
      { name: 'B', value: 40, percent: 100 },
      { name: 'C', value: 20, percent: 50 },
      { name: 'A', value: 10, percent: 25 },
    ])
    expect(buildRankingFromSeries(null)).toEqual([])
    expect(buildRankingFromSeries({ categories: ['A'], series: [{ name: 'x', data: [0] }] })).toEqual([])
  })

  it('看板榜单按图表数排序', () => {
    expect(
      buildRankingFromDashboards([
        { name: '看板A', _count: { charts: 2 } },
        { name: '看板B', _count: { charts: 8 } },
        { name: '看板C', _count: { charts: 0 } },
      ]),
    ).toEqual([
      { name: '看板B', value: 8, percent: 100 },
      { name: '看板A', value: 2, percent: 25 },
    ])
  })
})

describe('buildRatesFromSystem', () => {
  it('根据真实接口计算四项运行指标', () => {
    const rates = buildRatesFromSystem({
      metrics: { http: { total: 1000, serverErrors: 12 } },
      stats: { users: 200, onlineUsers: 30 },
      memory: { heapUsed: 80, heapTotal: 200 },
      dashboards: { total: 10, withCharts: 7 },
    })
    expect(rates).toEqual([
      { label: '接口成功率', value: 98.8, color: '#00eaff' },
      { label: '在线用户占比', value: 15, color: '#4ade80' },
      { label: '内存使用率', value: 40, color: '#f7c365' },
      { label: '看板出图率', value: 70, color: '#c084fc' },
    ])
  })

  it('缺少数据源时跳过对应指标，不混入演示数据', () => {
    expect(buildRatesFromSystem({})).toEqual([])
    expect(buildRatesFromSystem({ metrics: { http: { total: 0 } } })).toEqual([])
    expect(buildRatesFromSystem({ stats: { users: 0, onlineUsers: 1 } })).toEqual([])
  })

  it('百分比限制在 0-100', () => {
    const rates = buildRatesFromSystem({
      metrics: { http: { total: 10, serverErrors: 30 } },
      stats: { users: 10, onlineUsers: 200 },
    })
    expect(rates[0].value).toBe(0)
    expect(rates[1].value).toBe(100)
  })
})

describe('旧布局兜底', () => {
  it('优先识别 name/value 常见字段', () => {
    expect(
      detectNameValueFields([
        { name: '线上', value: 100 },
        { name: '门店', value: 50 },
      ]),
    ).toEqual({ nameField: 'name', valueField: 'value' })
  })

  it('无常见字段时按样本类型推断', () => {
    expect(
      detectNameValueFields([
        { region: '华东', amount: '100' },
        { region: '华南', amount: '200' },
      ]),
    ).toEqual({ nameField: 'region', valueField: 'amount' })
  })

  it('无法推断时返回 null', () => {
    expect(detectNameValueFields([])).toBeNull()
    expect(detectNameValueFields([{ a: 1, b: 2 }])).toBeNull()
  })

  it('生成旧布局饼图与单系列数据', () => {
    const rows = [
      { name: '线上', value: 100 },
      { name: '门店', value: 50 },
    ]
    expect(buildLegacyPieData(rows)).toEqual([
      { name: '线上', value: 100 },
      { name: '门店', value: 50 },
    ])
    expect(buildLegacyCategorySeries(rows)).toEqual({
      categories: ['线上', '门店'],
      series: [{ name: 'value', data: [100, 50] }],
    })
  })
})
