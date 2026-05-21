/**
 * Event Logs Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const eventLogsSearchContent = {
  // Main description for header search
  description:
    'View and manage system event logs, filter events by severity, export logs, and monitor system events. Displays ID, Severity, Date, Description, and Status information for comprehensive event tracking and resolution.',

  // Feature descriptions for header search
  features: [
    'Event log viewing with ID, Severity, Date, Description, and Status',
    'Event filtering by severity (OK, Warning, Critical)',
    'Event filtering by status (Resolved, Unresolved)',
    'Date range filtering with From and To dates',
    'Event log export and download',
    'Event log deletion (single and bulk)',
    'Critical event monitoring',
    'Warning event tracking',
    'Informational event viewing',
    'Event timestamp tracking',
    'Event log management',
    'SRC Details and Resolution information viewing',
    'Event status management (Resolve/Unresolve)',
    'Bulk operations (Delete all, Download all)',
    'Individual log operations (Download, Delete, Resolve)',
  ],

  // Searchable keywords for header search
  keywords: [
    'event',
    'logs',
    'events',
    'severity',
    'critical',
    'warning',
    'informational',
    'OK',
    'filter',
    'export',
    'delete',
    'download',
    'resolve',
    'unresolve',
    'resolved',
    'unresolved',
    'status',
    'event logs',
    'system events',
    'event filtering',
    'log export',
    'log management',
    'event monitoring',
    'event history',
    'search logs',
    'date range',
    'from date',
    'to date',
    'delete all',
    'download all',
    'SRC details',
    'resolution',
    'callout',
    'log ID',
    'log description',
    'event ID',
    'event description',
    'event date',
    'log date',
    'filter severity',
    'filter status',
    'bulk delete',
    'bulk download',
    'expand log',
    'view details',
    // Natural language variations
    'show logs',
    'view logs',
    'display logs',
    'see logs',
    'check logs',
    'show events',
    'view events',
    'display events',
    'see events',
    'check events',
    'how to view logs',
    'how to check logs',
    'where are logs',
    'find logs',
    'locate logs',
    'what are event logs',
    'how do i see logs',
    'how can i view logs',
    'where can i find logs',
    'filter logs',
    'search event logs',
    'filter event logs',
    'how to filter logs',
    'how to delete logs',
    'how to download logs',
    'how to export logs',
    'how to resolve logs',
    'delete event logs',
    'remove event logs',
    'clear event logs',
    'export event logs',
    'save event logs',
    'download event logs',
    'filter by severity',
    'filter by critical',
    'filter by warning',
    'show critical events',
    'show warning events',
    'view critical logs',
    'view warning logs',
    'system log',
    'system logging',
    'error logs',
    'system errors',
    'log entries',
    'event entries',
    'log records',
    'event records',
    'show me logs',
    'show me events',
    'display all logs',
    'list all events',
  ],

  // Related terms for header search
  relatedTerms: [
    'system logs',
    'log management',
    'event monitoring',
    'system monitoring',
    'log analysis',
    'event tracking',
    'system alerts',
    'error logs',
    'system errors',
    'event resolution',
    'log filtering',
    'date filtering',
    'severity levels',
    'log status',
    'event status',
    'log operations',
    'event operations',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Event Logs Help',
    overview:
      'The Event Logs page displays comprehensive system event information including ID, Severity, Date, Description, and Status. Use this page to monitor, filter, resolve, and manage system events.',

    sections: [
      {
        id: 'searching-logs',
        title: 'Searching Event Logs',
        content:
          'Search for specific event logs by entering keywords in the Search logs field. The search filters logs based on ID, severity, date, description, or status.',
        keywords: ['search', 'find', 'filter', 'locate'],
        steps: [
          'Locate the Search logs field at the top of the page',
          'Enter your search term (ID, severity, description, etc.)',
          'Results will filter automatically as you type',
        ],
      },
      {
        id: 'date-filtering',
        title: 'Filtering by Date Range',
        content:
          'Filter event logs by selecting a specific date range using the From date and To date fields.',
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
        id: 'severity-filtering',
        title: 'Filtering by Severity',
        content:
          'Filter event logs by severity level (OK, Warning, or Critical) to focus on specific types of events.',
        keywords: ['severity', 'filter', 'OK', 'warning', 'critical'],
        steps: [
          'Click the Filter button',
          'Select severity options: OK, Warning, or Critical',
          'Click Apply to filter logs by selected severity levels',
        ],
      },
      {
        id: 'status-filtering',
        title: 'Filtering by Status',
        content:
          'Filter event logs by resolution status (Resolved or Unresolved) to view specific events.',
        keywords: ['status', 'resolved', 'unresolved', 'filter'],
        steps: [
          'Click the Filter button',
          'Select status options: Resolved or Unresolved',
          'Click Apply to filter logs by selected status',
        ],
      },
      {
        id: 'deleting-all-logs',
        title: 'Deleting All Event Logs',
        content: 'Delete all event logs at once. This action cannot be undone.',
        keywords: ['delete all', 'bulk delete', 'remove all', 'clear'],
        steps: [
          'Click the "Delete all" button',
          'Confirm your selection in the confirmation dialog',
          'Click Delete to permanently remove all logs',
        ],
        warning:
          'This action cannot be undone. All event logs will be permanently deleted.',
      },
      {
        id: 'downloading-all-logs',
        title: 'Downloading All Event Logs',
        content:
          'Download all event logs for backup or analysis. The download may take several minutes.',
        keywords: ['download all', 'export all', 'bulk download', 'save'],
        steps: [
          'Click the "Download all" button',
          'Wait for the download to complete (may take several minutes)',
          'The file will be saved to your default downloads location',
        ],
        note: 'The download might take several minutes depending on the number of logs.',
      },
      {
        id: 'viewing-log-details',
        title: 'Viewing SRC Details and Resolution',
        content:
          'Expand individual log entries to view detailed SRC (System Reference Code) information and resolution callouts.',
        keywords: [
          'details',
          'SRC',
          'resolution',
          'callout',
          'expand',
          'view details',
          'arrow',
        ],
        steps: [
          'Locate the log entry you want to view',
          'Click the arrow next to the log',
          'View the SRC Details and Resolution (callout) information',
        ],
      },
      {
        id: 'resolving-logs',
        title: 'Resolving Event Logs',
        content:
          'Mark event logs as resolved once the issue has been addressed. By default, all logs are set to Unresolved status.',
        keywords: [
          'resolve',
          'mark resolved',
          'set status',
          'resolved',
          'unresolve',
        ],
        steps: [
          'Select the log you want to resolve',
          'Click the Resolve option',
          'The status will be updated to Resolved',
          'To unresolve, select the log and click Unresolve',
        ],
        note: 'By default, the status is set to Unresolved.',
      },
      {
        id: 'downloading-single-log',
        title: 'Downloading Individual Log',
        content: 'Download a specific log entry for detailed analysis.',
        keywords: [
          'download',
          'download log',
          'export log',
          'save log',
          'download icon',
        ],
        steps: [
          'Select the log you want to download',
          'Click the Download icon',
          'The log information will be downloaded to your device',
        ],
      },
      {
        id: 'deleting-single-log',
        title: 'Deleting Individual Log',
        content:
          'Delete a specific log entry. You must confirm the deletion before it is permanently removed.',
        keywords: [
          'delete',
          'remove',
          'delete log',
          'remove log',
          'delete icon',
        ],
        steps: [
          'Select the log you want to delete',
          'Click the Delete icon',
          'Click "Delete log" to confirm the deletion',
          'The log will be permanently removed',
        ],
        warning: 'This action cannot be undone.',
      },
    ],

    faqs: [
      {
        question: 'How do I search for specific event logs?',
        answer:
          'Enter your search term in the "Search logs" field at the top of the page. You can search by ID, severity, date, description, or status.',
        keywords: ['search', 'find', 'how to search'],
      },
      {
        question: 'How do I filter logs by date?',
        answer:
          'Enter the From date and To date in the respective fields to display logs for the selected date range.',
        keywords: ['date', 'filter', 'date range'],
      },
      {
        question: 'How do I filter by severity?',
        answer:
          'Click the Filter button and select severity options (OK, Warning, or Critical) from the list.',
        keywords: ['severity', 'filter', 'critical', 'warning'],
      },
      {
        question: 'How do I delete all event logs?',
        answer:
          'Click "Delete all", confirm your selection, and click Delete. Note: This action cannot be undone.',
        keywords: ['delete all', 'remove all', 'clear'],
      },
      {
        question: 'How do I download all event logs?',
        answer:
          'Click "Download all". The download might take several minutes to complete.',
        keywords: ['download', 'export', 'download all'],
      },
      {
        question: 'How do I view detailed information about a log?',
        answer:
          'Click the arrow next to the log to view the SRC Details and Resolution (callout) information.',
        keywords: ['details', 'view', 'expand', 'SRC'],
      },
      {
        question: 'How do I resolve an event log?',
        answer:
          'Select the log and click Resolve. The status will be updated to Resolved. By default, logs are set to Unresolved.',
        keywords: ['resolve', 'mark resolved', 'status'],
      },
      {
        question: 'How do I download a single log?',
        answer:
          'Select the log and click the Download icon to download the log information.',
        keywords: ['download', 'single', 'one log'],
      },
      {
        question: 'How do I delete a single log?',
        answer:
          'Select the log, click the Delete icon, and click "Delete log" to confirm. This action cannot be undone.',
        keywords: ['delete', 'remove', 'single log'],
      },
      {
        question: 'Can I undo a log deletion?',
        answer:
          'No, log deletion is permanent and cannot be undone. Please confirm carefully before deleting.',
        keywords: ['undo', 'restore', 'recover'],
      },
      {
        question: 'What do the severity levels mean?',
        answer:
          'OK indicates normal operation, Warning indicates potential issues, and Critical indicates serious problems requiring immediate attention.',
        keywords: [
          'severity',
          'levels',
          'meaning',
          'OK',
          'warning',
          'critical',
        ],
      },
      {
        question: 'What is the default status of event logs?',
        answer:
          'By default, all event logs are set to Unresolved status until manually marked as Resolved.',
        keywords: ['default', 'status', 'unresolved'],
      },
    ],

    quickActions: [
      {
        label: 'Search logs',
        description: 'Find specific event logs',
        action: 'focus-search',
      },
      {
        label: 'Filter by severity',
        description: 'Filter logs by OK, Warning, or Critical',
        action: 'open-filter',
      },
      {
        label: 'Filter by date',
        description: 'Set date range for logs',
        action: 'focus-date-filter',
      },
      {
        label: 'Download all logs',
        description: 'Export all event logs',
        action: 'download-all',
      },
      {
        label: 'Delete all logs',
        description: 'Remove all event logs (cannot be undone)',
        action: 'delete-all',
      },
    ],

    tips: [
      'Use the search field to quickly find specific logs by ID, description, or severity',
      'Filter by date range to focus on events from a specific time period',
      'Regularly resolve logs to keep track of addressed issues',
      'Download logs before deleting them for record-keeping',
      'Use severity filtering to prioritize critical events',
      'Expand log entries to view detailed SRC information and resolution steps',
    ],
  },
};

export default eventLogsSearchContent;
