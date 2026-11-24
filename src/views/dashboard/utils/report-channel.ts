/** 定时报表投递渠道展示配置：中文名、标签色、表单项提示 */

import i18n from '@/i18n'
import type { ReportChannel } from '@/api/report'

export type ReportChannelTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

export interface ReportChannelOption {
  value: ReportChannel
  label: string
  hint: string
}

const CHANNELS: ReportChannel[] = ['inbox', 'webhook', 'email', 'wecom', 'dingtalk']

function labelOf(channel: ReportChannel): string {
  return i18n.global.t(`dashboard.channel.${channel}`)
}

function hintOf(channel: ReportChannel): string {
  return i18n.global.t(`dashboard.channel.${channel}Hint`)
}

// 使用 getter 保证语言切换后取值实时更新
export const REPORT_CHANNEL_LABELS: Record<ReportChannel, string> = {
  get inbox() {
    return labelOf('inbox')
  },
  get webhook() {
    return labelOf('webhook')
  },
  get email() {
    return labelOf('email')
  },
  get wecom() {
    return labelOf('wecom')
  },
  get dingtalk() {
    return labelOf('dingtalk')
  },
}

export const REPORT_CHANNEL_TAG_TYPES: Record<ReportChannel, ReportChannelTagType> = {
  inbox: 'primary',
  webhook: 'warning',
  email: 'success',
  wecom: 'success',
  dingtalk: 'info',
}

export const REPORT_CHANNEL_HINTS: Record<ReportChannel, string> = {
  get inbox() {
    return hintOf('inbox')
  },
  get webhook() {
    return hintOf('webhook')
  },
  get email() {
    return hintOf('email')
  },
  get wecom() {
    return hintOf('wecom')
  },
  get dingtalk() {
    return hintOf('dingtalk')
  },
}

/** 新增/编辑订阅时的渠道选项 */
export const REPORT_CHANNEL_OPTIONS: ReportChannelOption[] = CHANNELS.map((value) => ({
  value,
  get label() {
    return labelOf(value)
  },
  get hint() {
    return hintOf(value)
  },
}))

/** 需要填写机器人/回调地址的渠道 */
export const ROBOT_CHANNELS: ReportChannel[] = ['webhook', 'wecom', 'dingtalk']

export function isRobotChannel(channel: ReportChannel | string): boolean {
  return ROBOT_CHANNELS.includes(channel as ReportChannel)
}

/** 收件人字段仅对站内与邮件渠道展示 */
export function showRecipients(channel: ReportChannel | string): boolean {
  return channel === 'inbox' || channel === 'email'
}

export function reportChannelLabel(channel: string | null | undefined): string {
  if (!channel) return '-'
  return REPORT_CHANNEL_LABELS[channel as ReportChannel] ?? channel
}

export function reportChannelTagType(channel: string | null | undefined): ReportChannelTagType {
  if (!channel) return 'info'
  return REPORT_CHANNEL_TAG_TYPES[channel as ReportChannel] ?? 'info'
}

export function reportChannelHint(channel: ReportChannel): string {
  return REPORT_CHANNEL_HINTS[channel] ?? ''
}
