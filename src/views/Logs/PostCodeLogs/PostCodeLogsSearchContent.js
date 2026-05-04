/**
 * Post Code Logs (Progress Logs) Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const postCodeLogsSearchContent = {
  // Main description for header search
  description:
    'View progress logs, post codes, boot progress information, and system initialization codes. Displays Created, Time stamp offset, Boot count, and Code information.',

  // Feature descriptions for header search
  features: [
    'Progress log viewing with Created, Time stamp offset, Boot count, and Code',
    'Post code monitoring',
    'Boot progress tracking',
    'System initialization logs',
    'POST code history',
    'Boot sequence information',
    'Real-time progress code viewing',
    'SRC Details viewing',
    'Date range filtering',
    'Progress log search',
  ],

  // Searchable keywords for header search
  keywords: [
    'progress',
    'logs',
    'post',
    'code',
    'boot',
    'initialization',
    'POST',
    'progress logs',
    'post code',
    'post codes',
    'boot progress',
    'system initialization',
    'boot sequence',
    'POST logs',
    'boot logs',
    'created',
    'timestamp',
    'boot count',
    'SRC',
    'SRC details',
    'real time',
    'search',
    'date',
    'filter',
  ],

  // Related terms for header search
  relatedTerms: [
    'system boot',
    'boot process',
    'initialization process',
    'startup logs',
    'boot diagnostics',
    'system startup',
    'Power-On Self-Test',
    'POST',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Progress Logs Help',
    overview:
      'The Progress Logs page displays Created, Time stamp offset, Boot count, and Code information. Use this page to monitor system Power-On Self-Test progress codes, track boot sequences, and view detailed SRC information.',

    sections: [
      {
        id: 'viewing-real-time',
        title: 'Viewing Progress Codes in Real Time',
        content:
          'View the system Power-On Self-Test progress codes in real time by opening a dedicated console window.',
        keywords: [
          'real time',
          'live',
          'console',
          'Power-On Self-Test',
          'POST',
          'view codes',
        ],
        steps: [
          'Click the "View progress codes in real time" button',
          'A new console window will open displaying live progress codes',
          'Monitor the boot sequence as it happens',
        ],
        note: 'The console window opens in a separate browser window for continuous monitoring.',
      },
      {
        id: 'searching-logs',
        title: 'Searching Progress Logs',
        content:
          'Search for specific progress logs by entering keywords in the Search logs field. The search filters logs based on created date, timestamp offset, boot count, or code.',
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
          'Filter progress logs by selecting a specific date range using the From date and To date fields to display logs for the selected date range.',
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
        id: 'viewing-src-details',
        title: 'Viewing SRC Details',
        content:
          'Expand individual log entries to view detailed System Reference Code (SRC) information for troubleshooting and diagnostics.',
        keywords: [
          'SRC',
          'details',
          'expand',
          'view details',
          'arrow',
          'System Reference Code',
        ],
        steps: [
          'Locate the log entry you want to view',
          'Click the arrow next to the date',
          'View the SRC Details information',
        ],
        note: 'SRC Details provide additional diagnostic information for troubleshooting boot issues.',
      },
    ],

    faqs: [
      {
        question: 'How do I view progress codes in real time?',
        answer:
          'Click "View progress codes in real time" to open a console window that displays live Power-On Self-Test progress codes.',
        keywords: ['real time', 'live', 'console', 'how to view'],
      },
      {
        question: 'How do I search for specific progress logs?',
        answer:
          'Enter the log to be searched in the Search logs field at the top of the page. You can search by created date, timestamp offset, boot count, or code.',
        keywords: ['search', 'find', 'how to search'],
      },
      {
        question: 'How do I filter logs by date?',
        answer:
          'Enter the From date and To date in the respective fields to display logs for the selected date range.',
        keywords: ['date', 'filter', 'date range', 'from date', 'to date'],
      },
      {
        question: 'How do I view SRC details?',
        answer:
          'Click the arrow next to the date to expand the log entry and view the SRC Details.',
        keywords: ['SRC', 'details', 'view', 'expand', 'arrow'],
      },
      {
        question: 'What information is shown in progress logs?',
        answer:
          'Progress logs display Created date, Time stamp offset, Boot count, and Code information. You can expand entries to see SRC Details.',
        keywords: ['information', 'columns', 'fields', 'data', 'what'],
      },
      {
        question: 'What are SRC Details?',
        answer:
          'SRC (System Reference Code) Details provide additional diagnostic information about boot progress and system initialization for troubleshooting purposes.',
        keywords: ['SRC', 'System Reference Code', 'what is', 'meaning'],
      },
      {
        question: 'What is the Time stamp offset?',
        answer:
          'The Time stamp offset indicates the time elapsed since the boot process started, helping track the sequence of boot events.',
        keywords: ['timestamp', 'offset', 'what is', 'meaning'],
      },
    ],

    quickActions: [
      {
        label: 'View codes in real time',
        description: 'Open console for live progress codes',
        action: 'open-console',
      },
      {
        label: 'Search logs',
        description: 'Find specific progress logs',
        action: 'focus-search',
      },
      {
        label: 'Filter by date',
        description: 'Set date range for logs',
        action: 'focus-date-filter',
      },
    ],

    tips: [
      'Use "View progress codes in real time" to monitor boot sequences as they happen',
      'Use the search field to quickly find specific logs by boot count or code',
      'Filter by date range to focus on boot events from a specific time period',
      'Click the arrow next to the date to expand and view SRC Details',
      'SRC Details provide valuable diagnostic information for troubleshooting boot issues',
    ],
  },
};

export default postCodeLogsSearchContent;

// Made with Bob
