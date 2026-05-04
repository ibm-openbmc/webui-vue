/**
 * Audit Logs Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const auditLogsSearchContent = {
  // Main description for header search
  description:
    'View audit logs, track user activities, monitor system operations, and export audit records. Displays Date, Operation, Account, and Address information.',

  // Feature descriptions for header search
  features: [
    'Audit log viewing with Date, Operation, Account, and Address',
    'User activity tracking',
    'Operation monitoring',
    'Audit log export and download',
    'Account activity tracking',
    'IP address logging',
    'Response code tracking',
    'Audit record management',
    'Date range filtering',
    'Audit log search',
  ],

  // Searchable keywords for header search
  keywords: [
    'audit',
    'logs',
    'activity',
    'tracking',
    'user',
    'operation',
    'account',
    'IP address',
    'address',
    'response',
    'audit logs',
    'user activity',
    'system operations',
    'audit records',
    'activity logs',
    'audit trail',
    'security logs',
    'access logs',
    'date',
    'search',
    'download',
    'export',
  ],

  // Related terms for header search
  relatedTerms: [
    'security monitoring',
    'compliance logging',
    'activity monitoring',
    'access tracking',
    'security audit',
    'user monitoring',
    'system audit',
    'log management',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Audit Logs Help',
    overview:
      'The Audit Logs page displays Date, Operation, Account, and Address information. Use this page to monitor user activities, track system operations, and export audit records for compliance and security purposes.',

    sections: [
      {
        id: 'searching-logs',
        title: 'Searching Audit Logs',
        content:
          'Search for specific audit logs by entering keywords in the Search logs field. The search filters logs based on date, operation, account, or address.',
        keywords: ['search', 'find', 'filter', 'locate', 'search logs'],
        steps: [
          'Locate the Search logs field at the top of the page',
          'Enter the log to be searched in the Search logs field',
          'Results will filter automatically as you type',
        ],
      },
      {
        id: 'date-filtering',
        title: 'Filtering by Date Range',
        content:
          'Filter audit logs by selecting a specific date range using the From date and To date fields to display logs for the selected date range.',
        keywords: [
          'date',
          'date range',
          'from date',
          'to date',
          'filter by date',
          'date filter',
        ],
        steps: [
          'Enter the From date in the respective field',
          'Enter the To date in the respective field',
          'Logs will be filtered to display only events within the selected date range',
        ],
      },
      {
        id: 'downloading-all-logs',
        title: 'Downloading All Audit Logs',
        content:
          'Download all audit logs for backup, analysis, or compliance purposes. Click Download all to download all event logs.',
        keywords: [
          'download all',
          'export all',
          'bulk download',
          'save',
          'download',
        ],
        steps: [
          'Click the "Download all" button',
          'Wait for the download to complete',
          'The file will be saved to your default downloads location',
        ],
        note: 'The download might take several minutes to complete.',
      },
      {
        id: 'viewing-log-details',
        title: 'Viewing Audit Log Details',
        content:
          'Expand individual log entries to view detailed audit information including ID and Message.',
        keywords: [
          'details',
          'expand',
          'view details',
          'arrow',
          'audit ID',
          'message',
          'ID',
        ],
        steps: [
          'Locate the log entry you want to view',
          'Click the arrow next to the date',
          'View the ID and Message information',
        ],
      },
    ],

    faqs: [
      {
        question: 'How do I search for specific audit logs?',
        answer:
          'Enter the log to be searched in the Search logs field at the top of the page. You can search by date, operation, account, or address.',
        keywords: ['search', 'find', 'how to search'],
      },
      {
        question: 'How do I filter logs by date?',
        answer:
          'Enter the From date and To date in the respective fields to display logs for the selected date range.',
        keywords: ['date', 'filter', 'date range', 'from date', 'to date'],
      },
      {
        question: 'How do I download all audit logs?',
        answer:
          'Click "Download all" to download all event logs. The download might take several minutes to complete.',
        keywords: ['download', 'export', 'download all'],
      },
      {
        question: 'How do I view detailed information about a log?',
        answer:
          'Click the arrow next to the date to view the ID and Message information.',
        keywords: ['details', 'view', 'expand', 'arrow'],
      },
      {
        question: 'What information is shown in audit logs?',
        answer:
          'Audit logs display Date, Operation, Account, and Address information for each activity. You can expand entries to see ID and Message details.',
        keywords: ['information', 'columns', 'fields', 'data', 'what'],
      },
      {
        question: 'How long does it take to download audit logs?',
        answer:
          'The download might take several minutes to complete, depending on the number of logs.',
        keywords: ['download', 'time', 'how long', 'duration'],
      },
    ],

    quickActions: [
      {
        label: 'Search logs',
        description: 'Find specific audit logs',
        action: 'focus-search',
      },
      {
        label: 'Filter by date',
        description: 'Set date range for logs',
        action: 'focus-date-filter',
      },
      {
        label: 'Download all logs',
        description: 'Export all audit logs',
        action: 'download-all',
      },
    ],

    tips: [
      'Use the search field to quickly find specific logs by operation, account, or address',
      'Filter by date range to focus on activities from a specific time period',
      'Download logs regularly for compliance and record-keeping',
      'Click the arrow next to the date to expand and view ID and Message details',
      'Monitor IP addresses to track access patterns and security',
    ],
  },
};

export default auditLogsSearchContent;

// Made with Bob
