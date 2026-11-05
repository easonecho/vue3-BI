import { afterEach, describe, expect, it } from 'vitest'
import {
  buildPdfHtml,
  formatExportStamp,
  resolveExportTarget,
  sanitizeExportName,
} from './dashboard-export'

describe('sanitizeExportName', () => {
  it('替换文件名非法字符', () => {
    expect(sanitizeExportName('销售/看板:2026*?"<>|')).toBe('销售_看板_2026______')
  })

  it('空名称回退为「看板」', () => {
    expect(sanitizeExportName('')).toBe('看板')
    expect(sanitizeExportName('   ')).toBe('看板')
  })
})

describe('formatExportStamp', () => {
  it('格式化为 YYYYMMDD_HHmmss', () => {
    expect(formatExportStamp(new Date(2026, 10, 5, 9, 8, 7))).toBe('20261105_090807')
  })
})

describe('buildPdfHtml', () => {
  it('包含图片、标题并转义特殊字符', () => {
    const html = buildPdfHtml('data:image/png;base64,abc', '看板 <A&B>')
    expect(html).toContain('data:image/png;base64,abc')
    expect(html).toContain('<title>看板 &lt;A&amp;B&gt;</title>')
    expect(html).toContain('window.print()')
  })
})

describe('resolveExportTarget', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('优先匹配预览页画布 .dashboard-canvas', () => {
    const canvas = document.createElement('div')
    canvas.className = 'dashboard-canvas'
    document.body.appendChild(canvas)
    expect(resolveExportTarget()).toBe(canvas)
  })

  it('兼容分享页画布 .canvas-sheet', () => {
    const sheet = document.createElement('div')
    sheet.className = 'canvas-sheet'
    document.body.appendChild(sheet)
    expect(resolveExportTarget()).toBe(sheet)
  })

  it('画布不存在时返回 null', () => {
    expect(resolveExportTarget()).toBeNull()
  })
})
