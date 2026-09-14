import type { ComponentDefinition } from '../types'
import Widget from './Widget.vue'

export const carouselDefinition: ComponentDefinition = {
  type: 'carousel',
  meta: {
    name: '轮播图',
    category: 'basic',
    icon: 'PictureFilled',
    defaultWidth: 480,
    defaultHeight: 270,
  },
  widget: Widget,
  propsSchema: [
    {
      key: 'images',
      label: '图片素材',
      type: 'asset',
      assetType: 'image',
      multiple: true,
      default: [
        'https://images.pexels.com/photos/3573555/pexels-photo-3573555.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2901208/pexels-photo-2901208.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/902290/pexels-photo-902290.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      group: '源',
      tip: '从素材库选择多张图片作为轮播图',
    },
    {
      key: 'interval',
      label: '切换间隔(ms)',
      type: 'slider',
      min: 1000,
      max: 10000,
      step: 500,
      default: 3000,
      group: '轮播',
      tip: '切换间隔(ms)',
    },
    {
      key: 'autoplay',
      label: '自动播放',
      type: 'switch',
      default: true,
      group: '轮播',
      tip: '自动播放',
    },
    {
      key: 'showArrow',
      label: '显示左右箭头',
      type: 'switch',
      default: true,
      group: '导航',
      tip: '显示左右箭头',
    },
    {
      key: 'showIndicator',
      label: '底部指示点',
      type: 'switch',
      default: true,
      group: '导航',
      tip: '底部指示点',
    },
    {
      key: 'effect',
      label: '切换效果',
      type: 'select',
      options: [
        { label: '淡入淡出', value: 'fade' },
        { label: '滑动', value: 'slide' },
      ],
      default: 'slide',
      group: '样式',
    },
    {
      key: 'arrowColor',
      label: '箭头颜色',
      type: 'colorpicker',
      default: '#ffffff',
      group: '颜色',
    },
    {
      key: 'indicatorColor',
      label: '指示点颜色',
      type: 'colorpicker',
      default: '#22d3ee',
      group: '颜色',
    },
    {
      key: 'borderRadius',
      label: '圆角',
      type: 'slider',
      min: 0,
      max: 20,
      default: 4,
      group: '样式',
    },
  ],
  defaultStyle: {},
}

export default carouselDefinition
