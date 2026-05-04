/**
 * Dumps Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const dumpsSearchContent = {
  // Main description for header search
  description:
    'Create, view, download, and manage system dumps, BMC dumps, resource dumps, partition dumps, and other diagnostic dumps for troubleshooting. Displays ID, Date and time, Dump type, and Size information.',

  // Feature descriptions for header search
  features: [
    'Dump viewing with ID, Date and time, Dump type, and Size',
    'BMC dump creation (non-disruptive)',
    'Resource dump creation',
    'System dump creation (disruptive)',
    'Partition dump creation (disruptive)',
    'Retry partition dump (disruptive)',
    'Dump download',
    'Dump deletion',
    'Dump filtering by type',
    'Date range filtering',
    'Dump search',
    'Dump management',
    'Troubleshooting dumps',
    'Diagnostic dumps',
  ],

  // Searchable keywords for header search
  keywords: [
    'dumps',
    'dump',
    'system',
    'BMC',
    'resource',
    'partition',
    'download',
    'create',
    'delete',
    'initiate',
    'troubleshooting',
    'diagnostic',
    'system dump',
    'BMC dump',
    'resource dump',
    'partition dump',
    'hardware dump',
    'hostboot dump',
    'SBE dump',
    'OCMB SBE dump',
    'dump creation',
    'dump download',
    'dump management',
    'crash dump',
    'debug dump',
    'dump type',
    'filter',
    'search',
    'date',
    'size',
  ],

  // Related terms for header search
  relatedTerms: [
    'troubleshooting',
    'diagnostics',
    'debug information',
    'system diagnostics',
    'error analysis',
    'crash analysis',
    'system state',
    'memory dump',
    'core dump',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Dumps Help',
    overview:
      'The Dumps page allows you to initiate, view, download, and manage various types of system dumps for troubleshooting and diagnostics. Dumps available on BMC display ID, Date and time, Dump type, and Size information.',

    sections: [
      {
        id: 'initiating-bmc-dump',
        title: 'Initiating BMC Dump (Non-Disruptive)',
        content:
          'Create a BMC dump for troubleshooting without disrupting system operations. The dump will take some time to complete.',
        keywords: ['BMC dump', 'non-disruptive', 'initiate', 'create', 'start'],
        steps: [
          'Select "BMC dump (non disruptive)" from the dump type list',
          'Click "Initiate dump" to start the dump process',
          'Wait for the dump to complete',
          'Refresh the application to see the completed dump in the table',
        ],
        note: 'The dump will take some time to complete. Refresh the application to see the completed dump in the table.',
      },
      {
        id: 'initiating-resource-dump',
        title: 'Initiating Resource Dump',
        content:
          'Create a resource dump for hardware diagnostics. This is a long-running process that may be offloaded to the operating system.',
        keywords: [
          'resource dump',
          'initiate',
          'create',
          'hardware',
          'diagnostics',
        ],
        steps: [
          'Select "Resource dump" from the dump type list',
          'Enter the Resource selector in the relevant field',
          'Enter the Password in the relevant field',
          'Click "Initiate dump" to start the dump process',
          'Wait for the dump to complete',
          'Refresh the application to see the completed dump in the table',
        ],
        note: 'The Resource dump is a long running process. If the Dump is not listed in the Dumps table and there are no Resource dump error logs, it has been offloaded to the operating system.',
      },
      {
        id: 'initiating-system-dump',
        title: 'Initiating System Dump (Disruptive)',
        content:
          'Create a system dump for comprehensive system diagnostics. This is a disruptive operation that will be offloaded to the operating system.',
        keywords: [
          'system dump',
          'disruptive',
          'initiate',
          'create',
          'comprehensive',
        ],
        steps: [
          'Select "System dump (disruptive)" from the dump type list',
          'Click "Initiate dump" to start the dump process',
          'Wait for the dump to complete',
          'Refresh the application to see the completed dump in the table',
        ],
        warning:
          'This is a disruptive operation. System dumps will be offloaded to the operating system and will be deleted by the operating system when the dump is deleted from the host memory.',
      },
      {
        id: 'initiating-partition-dump',
        title: 'Initiating Partition Dump (Disruptive)',
        content:
          'Initiate a dump of the operating system data in a logical partition. Only available when the OS is running and IBM i OS enables them.',
        keywords: [
          'partition dump',
          'disruptive',
          'initiate',
          'IBM i',
          'logical partition',
        ],
        steps: [
          'Select "Partition dump (disruptive)" from the dump type list',
          'Click "Initiate dump" to start the dump process',
          'Wait for the dump to complete',
        ],
        note: 'This function is only available when the OS is running and only when the IBM i OS enables them. If the function is not available, press the refresh button to see the latest status.',
        warning: 'This is a disruptive operation.',
      },
      {
        id: 'retry-partition-dump',
        title: 'Retry Partition Dump (Disruptive)',
        content:
          'Retry a dump of the operating system data in a logical partition. Only available when the OS is running and IBM i OS enables them.',
        keywords: [
          'retry',
          'partition dump',
          'disruptive',
          'IBM i',
          'logical partition',
        ],
        steps: [
          'Select "Retry partition dump (disruptive)" from the dump type list',
          'Click "Initiate dump" to retry the dump process',
          'Wait for the dump to complete',
        ],
        note: 'This function is only available when the OS is running and only when the IBM i OS enables them. If the function is not available, press the refresh button to see the latest status.',
        warning: 'This is a disruptive operation.',
      },
      {
        id: 'searching-dumps',
        title: 'Searching Dumps',
        content:
          'Search for specific dumps by entering keywords in the Search dumps field.',
        keywords: ['search', 'find', 'filter', 'locate'],
        steps: [
          'Locate the Search dumps field',
          'Enter the dump to be searched',
          'Results will filter automatically as you type',
        ],
      },
      {
        id: 'filtering-by-date',
        title: 'Filtering Dumps by Date Range',
        content:
          'Filter dumps by selecting a specific date range using the From date and To date fields.',
        keywords: ['date', 'filter', 'date range', 'from date', 'to date'],
        steps: [
          'Enter the From date in the respective field',
          'Enter the To date in the respective field',
          'Dumps will be filtered to display only entries within the selected date range',
        ],
      },
      {
        id: 'filtering-by-type',
        title: 'Filtering Dumps by Type',
        content: 'Filter dumps by type to view specific categories of dumps.',
        keywords: ['filter', 'type', 'dump type', 'category'],
        steps: [
          'Click the "Filter" button',
          'Select Dump type options from the list:',
          '  - BMC Dump Entry',
          '  - Hardware Dump Entry',
          '  - Hostboot Dump Entry',
          '  - SBE Dump Entry',
          '  - OCMB SBE Dump Entry',
          '  - Resource Dump Entry',
          '  - System Dump Entry',
          'Click Apply to filter dumps by selected types',
        ],
      },
      {
        id: 'downloading-dump',
        title: 'Downloading a Dump',
        content: 'Download a specific dump for offline analysis.',
        keywords: ['download', 'save', 'export', 'download icon'],
        steps: [
          'Locate the dump you want to download',
          'Click the Download icon for that dump',
          'The dump file will be downloaded to your device',
        ],
      },
      {
        id: 'deleting-dump',
        title: 'Deleting a Dump',
        content:
          'Delete a specific dump to free up storage space. You must confirm the deletion.',
        keywords: ['delete', 'remove', 'delete icon'],
        steps: [
          'Locate the dump you want to delete',
          'Click the Delete icon for that dump',
          'Click "Delete dump" to confirm the deletion',
          'The dump will be permanently removed',
        ],
        warning: 'This action cannot be undone.',
      },
    ],

    faqs: [
      {
        question: 'What is the difference between dump types?',
        answer:
          'BMC dumps are non-disruptive and capture BMC state. Resource dumps capture hardware diagnostics. System dumps are disruptive and capture comprehensive system state. Partition dumps capture OS data in logical partitions.',
        keywords: ['dump types', 'difference', 'BMC', 'resource', 'system'],
      },
      {
        question: 'How do I initiate a BMC dump?',
        answer:
          'Select "BMC dump (non disruptive)" from the dump type list and click "Initiate dump". Refresh the application to see the completed dump.',
        keywords: ['BMC dump', 'initiate', 'how to', 'create'],
      },
      {
        question: 'How long does a dump take to complete?',
        answer:
          'Dump completion time varies by type. BMC dumps take some time, while Resource and System dumps are long-running processes. Refresh the application to check completion status.',
        keywords: ['time', 'duration', 'how long', 'complete'],
      },
      {
        question: 'How do I search for specific dumps?',
        answer:
          'Enter the dump to be searched in the Search dumps field. You can search by ID, date, type, or size.',
        keywords: ['search', 'find', 'how to search'],
      },
      {
        question: 'How do I filter dumps by type?',
        answer:
          'Click Filter and select dump type options like BMC Dump Entry, Hardware Dump Entry, Hostboot Dump Entry, SBE Dump Entry, OCMB SBE Dump Entry, Resource Dump Entry, or System Dump Entry.',
        keywords: ['filter', 'type', 'how to filter'],
      },
      {
        question: 'How do I download a dump?',
        answer:
          'Click the Download icon next to the dump you want to download. The file will be saved to your device.',
        keywords: ['download', 'save', 'how to download'],
      },
      {
        question: 'How do I delete a dump?',
        answer:
          'Click the Delete icon next to the dump, then click "Delete dump" to confirm. This action cannot be undone.',
        keywords: ['delete', 'remove', 'how to delete'],
      },
      {
        question: 'What happens to system dumps?',
        answer:
          'System dumps are offloaded to the operating system and will be deleted by the OS when the dump is deleted from the host memory.',
        keywords: ['system dump', 'offload', 'operating system'],
      },
      {
        question: 'Why is partition dump not available?',
        answer:
          'Partition dump functions are only available when the OS is running and when the IBM i OS enables them. Press the refresh button to see the latest status.',
        keywords: ['partition dump', 'not available', 'unavailable'],
      },
      {
        question: 'What if my resource dump is not in the table?',
        answer:
          'If the dump is not listed and there are no Resource dump error logs, it has been offloaded to the operating system.',
        keywords: ['resource dump', 'missing', 'not listed', 'offloaded'],
      },
    ],

    quickActions: [
      {
        label: 'Initiate BMC dump',
        description: 'Create a non-disruptive BMC dump',
        action: 'initiate-bmc-dump',
      },
      {
        label: 'Search dumps',
        description: 'Find specific dumps',
        action: 'focus-search',
      },
      {
        label: 'Filter by type',
        description: 'Filter dumps by dump type',
        action: 'open-filter',
      },
    ],

    tips: [
      'BMC dumps are non-disruptive and safe to create during normal operations',
      'Refresh the application after initiating a dump to see completion status',
      'System and partition dumps are disruptive operations - plan accordingly',
      'Use date range filtering to find dumps from specific time periods',
      'Download important dumps before deleting them for record-keeping',
      'Resource dumps may be offloaded to the operating system',
    ],
  },
};

export default dumpsSearchContent;

// Made with Bob
