import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const videoPlayerDefinition: ComponentDefinition = {
  type: 'video-player',
  meta: {
    name: '视频播放器',
    category: 'basic',
    icon: 'VideoPlay',
    defaultWidth: 480,
    defaultHeight: 270,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'src',
      label: '视频素材',
      type: 'asset',
      assetType: 'video',
      default: 'https://www.w3schools.com/html/mov_bbb.mp4',
      group: '源',
      tip: '从素材库选择视频，或保留默认演示地址',
    },
    {
      key: 'poster',
      label: '封面图素材',
      type: 'asset',
      assetType: 'image',
      default: '',
      group: '源',
      tip: '可选：从素材库选择封面图',
    },
    {
      key: 'autoplay',
      label: '自动播放',
      type: 'switch',
      default: false,
      group: '播放',
      tip: '自动播放（浏览器限制需静音）',
    },
    {
      key: 'loop',
      label: '循环播放',
      type: 'switch',
      default: true,
      group: '播放',
      tip: '循环播放',
    },
    {
      key: 'muted',
      label: '静音',
      type: 'switch',
      default: true,
      group: '播放',
      tip: '静音（autoplay=true 时必须）',
    },
    {
      key: 'controls',
      label: '显示控制条',
      type: 'switch',
      default: true,
      group: '播放',
      tip: '显示控制条',
    },
    {
      key: 'objectFit',
      label: '填充模式',
      type: 'select',
      options: [
        { label: '填充', value: 'fill' },
        { label: '包含', value: 'contain' },
        { label: '覆盖', value: 'cover' },
        { label: '缩放', value: 'scale-down' },
      ],
      default: 'contain',
      group: '样式',
      placeholder: '填充模式',
    },
  ],
  defaultStyle: {},
}

export default videoPlayerDefinition
