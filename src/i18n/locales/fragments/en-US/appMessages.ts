/**
 * Shared application messages (user-facing prompts in stores / utils)
 */
export default {
  appMessages: {
    request: {
      failed: 'Request failed',
      statusError: 'Request error ({status})',
      timeout: 'Request timed out. Check your network',
      network: 'Network error. Check your network connection',
      forbidden: 'You do not have permission to access this resource',
      notFound: 'The requested resource does not exist',
      serverError: 'Internal server error',
    },
    editor: {
      untitledDashboard: 'Untitled dashboard',
      untitledTemplate: 'Untitled template',
      saveConflictTitle: 'Save conflict',
      saveConflictMessage:
        'This dashboard was just modified by someone else. Overwriting will discard their changes. Overwrite?',
      overwrite: 'Overwrite',
      saveSuccess: 'Saved successfully',
      templateSaveSuccess: 'Template saved successfully',
      copySuffix: '{name} (Copy)',
      defaultName: 'Dashboard',
    },
    recent: {
      justNow: 'Just now',
      minutesAgo: '{n} min ago',
      hoursAgo: '{n} hr ago',
      daysAgo: '{n} days ago',
    },
  },
}
