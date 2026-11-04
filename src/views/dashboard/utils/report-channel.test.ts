import { describe, it, expect } from 'vitest'
import {
  REPORT_CHANNEL_HINTS,
  REPORT_CHANNEL_LABELS,
  REPORT_CHANNEL_OPTIONS,
  REPORT_CHANNEL_TAG_TYPES,
  isRobotChannel,
  reportChannelHint,
  reportChannelLabel,
  reportChannelTagType,
  showRecipients,
} from './report-channel'

describe('report-channel 渠道展示', () => {
  it('覆盖全部渠道的中文名与标签色', () => {
    expect(REPORT_CHANNEL_LABELS).toEqual({
      inbox: '站内',
      webhook: 'Webhook',
      email: '邮件',
      wecom: '企业微信',
      dingtalk: '钉钉',
    })
    expect(Object.keys(REPORT_CHANNEL_TAG_TYPES)).toEqual(Object.keys(REPORT_CHANNEL_LABELS))
  })

  it('渠道选项按表单顺序排列并带提示', () => {
    expect(REPORT_CHANNEL_OPTIONS.map((item) => item.value)).toEqual([
      'inbox',
      'webhook',
      'email',
      'wecom',
      'dingtalk',
    ])
    for (const option of REPORT_CHANNEL_OPTIONS) {
      expect(option.label).toBe(REPORT_CHANNEL_LABELS[option.value])
      expect(option.hint).toBe(REPORT_CHANNEL_HINTS[option.value])
    }
  })

  it('未知或空渠道有回退值', () => {
    expect(reportChannelLabel('unknown')).toBe('unknown')
    expect(reportChannelLabel(null)).toBe('-')
    expect(reportChannelTagType('unknown')).toBe('info')
    expect(reportChannelTagType(undefined)).toBe('info')
  })

  it('机器人渠道与收件人渠道判定一致', () => {
    expect(isRobotChannel('webhook')).toBe(true)
    expect(isRobotChannel('wecom')).toBe(true)
    expect(isRobotChannel('dingtalk')).toBe(true)
    expect(isRobotChannel('inbox')).toBe(false)
    expect(isRobotChannel('email')).toBe(false)

    expect(showRecipients('inbox')).toBe(true)
    expect(showRecipients('email')).toBe(true)
    expect(showRecipients('wecom')).toBe(false)
  })

  it('每种渠道都有提示文案', () => {
    expect(reportChannelHint('email')).toContain('SMTP')
    expect(reportChannelHint('dingtalk')).toContain('加签')
  })
})
