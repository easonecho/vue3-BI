/**
 * 示例插件: 通过 window.BI 插件 SDK 注册一个「公告横幅」组件。
 *
 * 该文件不会被 Vite 打包, 由 plugin-loader 在应用启动时以 <script> 注入。
 * 复制本文件可快速开发自定义组件:
 *   1. 修改 type / meta / propsSchema
 *   2. 用 BI.Vue.h() 编写 widget 渲染逻辑
 *   3. 在 /plugins/manifest.json 中登记脚本地址
 */
;(function () {
  const BI = window.BI
  if (!BI) {
    console.warn('[BI Plugin] window.BI 未初始化, 示例插件已跳过')
    return
  }

  const { h, defineComponent } = BI.Vue

  const NoticeBanner = defineComponent({
    name: 'BiPluginNoticeBanner',
    props: {
      comp: { type: Object, required: true },
    },
    setup(props) {
      return () => {
        const p = props.comp && props.comp.props ? props.comp.props : {}
        return h(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '100%',
              padding: '0 14px',
              borderRadius: '6px',
              boxSizing: 'border-box',
              background: p.bgColor || '#eef2ff',
              color: p.textColor || '#4f46e5',
              fontSize: `${Number(p.fontSize) || 14}px`,
              overflow: 'hidden',
            },
          },
          [
            p.showIcon
              ? h('span', {
                  style: {
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: p.textColor || '#4f46e5',
                    flexShrink: 0,
                  },
                })
              : null,
            h('span', { style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, String(p.text || '')),
          ],
        )
      }
    },
  })

  BI.registerComponent({
    type: 'plugin-notice-banner',
    meta: {
      name: '公告横幅（插件示例）',
      category: 'info',
      icon: 'Bell',
      defaultWidth: 480,
      defaultHeight: 48,
    },
    widget: NoticeBanner,
    propsSchema: [
      {
        key: 'text',
        label: '公告内容',
        type: 'input',
        default: '这是一条通过插件 SDK 注册的自定义组件',
      },
      { key: 'bgColor', label: '背景颜色', type: 'colorpicker', default: '#eef2ff' },
      { key: 'textColor', label: '文字颜色', type: 'colorpicker', default: '#4f46e5' },
      { key: 'fontSize', label: '字号', type: 'number', default: 14, min: 10, max: 32 },
      { key: 'showIcon', label: '显示圆点', type: 'switch', default: true },
    ],
    supportsDataBinding: false,
  })
})()
