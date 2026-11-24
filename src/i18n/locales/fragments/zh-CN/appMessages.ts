/**
 * 通用应用提示文案（stores / utils 中的用户可见提示）
 */
export default {
  appMessages: {
    versionUpdated: '检测到页面版本更新，正在刷新加载最新资源…',
    request: {
      failed: '请求失败',
      statusError: '请求错误 ({status})',
      timeout: '请求超时，请检查网络',
      network: '网络异常，请检查网络连接',
      forbidden: '没有权限访问该资源',
      notFound: '请求的资源不存在',
      serverError: '服务器内部错误',
    },
    editor: {
      untitledDashboard: '未命名报表',
      untitledTemplate: '未命名模板',
      saveConflictTitle: '保存冲突',
      saveConflictMessage: '该看板刚刚被其他人修改过，覆盖保存会丢失对方的改动。是否覆盖？',
      overwrite: '覆盖保存',
      saveSuccess: '保存成功',
      templateSaveSuccess: '模板保存成功',
      copySuffix: '{name} (副本)',
      defaultName: '看板',
    },
    recent: {
      justNow: '刚刚',
      minutesAgo: '{n}分钟前',
      hoursAgo: '{n}小时前',
      daysAgo: '{n}天前',
    },
  },
}
