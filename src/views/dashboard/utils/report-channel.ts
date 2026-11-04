/** 定时报表投递渠道展示配置：中文名、标签色、表单项提示 */

import type { ReportChannel } from '@/api/report'

export type ReportChannelTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

export interface ReportChannelOption {
  value: ReportChannel
  label: string
  hint: string
}

export const REPORT_CHANNEL_LABELS: Record<ReportChannel, string> = {
  inbox: '站内',
  webhook: 'Webhook',
  email: '邮件',
  wecom: '企业微信',
  dingtalk: '钉钉',
}

export const REPORT_CHANNEL_TAG_TYPES: Record<ReportChannel, ReportChannelTagType> = {
  inbox: 'primary',
  webhook: 'warning',
  email: 'success',
  wecom: 'success',
  dingtalk: 'info',
}

export const REPORT_CHANNEL_HINTS: Record<ReportChannel, string> = {
  inbox: '生成快照后落库，可在「投递记录」中查看',
  webhook: '推送 JSON 摘要到自定义回调地址（带 HMAC 签名）',
  email: '通过 SMTP 发送 HTML 摘要邮件，需在服务端配置 SMTP',
  wecom: '推送 markdown 摘要到企业微信群机器人',
  dingtalk: '推送 markdown 摘要到钉钉群机器人，支持加签校验',
}

/** 新增/编辑订阅时的渠道选项 */
export const REPORT_CHANNEL_OPTIONS: ReportChannelOption[] = (
  ['inbox', 'webhook', 'email', 'wecom', 'dingtalk'] as ReportChannel[]
).map((value) => ({
  value,
  label: REPORT_CHANNEL_LABELS[value],
  hint: REPORT_CHANNEL_HINTS[value],
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
