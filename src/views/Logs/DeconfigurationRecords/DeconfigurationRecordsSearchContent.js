/**
 * Deconfiguration Records Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const deconfigurationRecordsSearchContent = {
  // Main description for header search
  description:
    'View hardware deconfiguration records, track component deactivation history, and monitor hardware changes. Displays Id, Event ID, Date, Severity, Resource, and Status information. Note: Deconfiguration records can be deleted only when the system is powered off.',

  // Feature descriptions for header search
  features: [
    'Deconfiguration record viewing with Id, Event ID, Date, Severity, Resource, and Status',
    'Component deactivation history',
    'Hardware change tracking',
    'Status filtering (Resolved/Unresolved)',
    'Record export',
    'Record deletion (system powered off only)',
    'SRC Details viewing',
    'Location Code viewing',
    'Additional data download',
    'Deconfiguration log management',
    'Component status history',
  ],

  // Searchable keywords for header search
  keywords: [
    'deconfiguration',
    'records',
    'deactivation',
    'history',
    'hardware',
    'component',
    'changes',
    'deconfiguration records',
    'deactivation history',
    'hardware changes',
    'component history',
    'deconfiguration log',
    'hardware log',
    'status',
    'resolved',
    'unresolved',
    'filter',
    'export',
    'delete',
    'SRC',
    'location code',
    'severity',
    'resource',
    // Natural language variations
    'show deconfiguration records',
    'view deconfiguration records',
    'display deconfiguration records',
    'see deconfiguration records',
    'list deconfiguration records',
    'show deactivation history',
    'view hardware changes',
    'display component history',
    'check deconfiguration log',
    'monitor hardware changes',
    'track component changes',
    'hardware deactivation',
    'component deactivation',
    'deconfig records',
    'deconfig history',
    'deconfig log',
    'how to view deconfiguration records',
    'how to filter deconfiguration records',
    'how to export deconfiguration records',
    'how to delete deconfiguration records',
    'where are deconfiguration records',
    'where to find deactivation history',
    'find hardware changes',
    'find component history',
    'filter by status',
    'filter by resolved',
    'filter by unresolved',
    'filter deconfig records',
    'export all records',
    'export deconfig records',
    'download deconfiguration records',
    'save deconfiguration records',
    'delete records',
    'remove records',
    'delete deconfig records',
    'view SRC details',
    'show SRC details',
    'display SRC details',
    'view location code',
    'show location code',
    'download additional data',
    'get additional data',
    'bulk operations',
    'multiple records',
    'select multiple records',
    'clear filters',
    'clear all filters',
    'reset filters',
    'remove filters',
    'expand record',
    'view record details',
    'show record details',
    'record information',
    'deactivated components',
    'disabled hardware',
    'inactive components',
    'hardware status history',
    'component status history',
    'system changes log',
    'configuration changes',
    'hardware modifications',
    'component modifications',
  ],

  // Related terms for header search
  relatedTerms: [
    'hardware history',
    'component tracking',
    'configuration changes',
    'hardware modifications',
    'component changes',
    'system changes',
    'hardware status',
    'component status',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Deconfiguration Records Help',
    overview:
      'The Deconfiguration Records page displays Id, Event ID, Date, Severity, Resource, and Status information for hardware components that have been deconfigured. Use this page to track hardware changes and manage deconfiguration records. Note: Deconfiguration records can be deleted only when the system is powered off.',

    sections: [
      {
        id: 'filtering-by-status',
        title: 'Filtering by Status',
        content:
          'Filter deconfiguration records by resolution status to view resolved or unresolved records.',
        keywords: ['filter', 'status', 'resolved', 'unresolved'],
        steps: [
          'Click the "Filter" button',
          'Select Status options from the list:',
          '  - Resolved',
          '  - Unresolved',
          'Click Apply to filter records by selected status',
        ],
      },
      {
        id: 'clearing-filters',
        title: 'Clearing Filter Selection',
        content:
          'Clear all applied filters to view all deconfiguration records.',
        keywords: ['clear', 'clear all', 'reset', 'remove filter'],
        steps: [
          'Click the "Clear all" button',
          'All filter selections will be cleared',
          'All records will be displayed',
        ],
      },
      {
        id: 'exporting-all-records',
        title: 'Exporting All Records',
        content:
          'Export all deconfiguration records to save them for analysis or record-keeping.',
        keywords: ['export', 'export all', 'save', 'download all'],
        steps: [
          'Click the "Export all" button',
          'All deconfiguration records will be exported',
          'The file will be saved to your device',
        ],
      },
      {
        id: 'viewing-details',
        title: 'Viewing SRC Details and Location Code',
        content:
          'Expand individual records to view detailed System Reference Code (SRC) information and Location Code.',
        keywords: [
          'SRC',
          'details',
          'location code',
          'expand',
          'view details',
          'arrow',
        ],
        steps: [
          'Locate the record you want to view',
          'Click the arrow next to the record id',
          'View the SRC Details and Location Code information',
        ],
      },
      {
        id: 'downloading-additional-data',
        title: 'Downloading Additional Data',
        content:
          'Download additional diagnostic data associated with a deconfiguration record.',
        keywords: [
          'download',
          'additional data',
          'diagnostic data',
          'download additional data',
        ],
        steps: [
          'Expand the record to view details',
          'Click "Download additional data"',
          'The additional data will be downloaded to your device',
        ],
      },
      {
        id: 'deleting-record',
        title: 'Deleting a Deconfiguration Record',
        content:
          'Delete a specific deconfiguration record. Note: Records can only be deleted when the system is powered off.',
        keywords: ['delete', 'remove', 'delete icon'],
        steps: [
          'Ensure the system is powered off',
          'Locate the record you want to delete',
          'Click the Delete icon for that record',
          'Confirm the deletion',
          'The record will be permanently removed',
        ],
        warning:
          'Deconfiguration records can be deleted only when the system is powered off. This action cannot be undone.',
      },
      {
        id: 'bulk-operations',
        title: 'Performing Bulk Operations',
        content:
          'Select multiple records to export, delete, or cancel operations on multiple records at once.',
        keywords: ['bulk', 'multiple', 'select', 'export', 'delete', 'cancel'],
        steps: [
          'Select one or more records using the checkboxes',
          'Choose an operation:',
          '  - Export: Export selected records',
          '  - Delete: Delete selected records (system must be powered off)',
          '  - Cancel: Cancel the selection',
          'Confirm the operation',
        ],
        note: 'Delete operations require the system to be powered off.',
      },
    ],

    faqs: [
      {
        question: 'What information is shown in deconfiguration records?',
        answer:
          'Deconfiguration records display Id, Event ID, Date, Severity, Resource, and Status information. You can expand records to see SRC Details and Location Code.',
        keywords: ['information', 'columns', 'fields', 'data', 'what'],
      },
      {
        question: 'How do I filter records by status?',
        answer:
          'Click Filter and select Status options (Resolved or Unresolved) from the list, then click Apply.',
        keywords: ['filter', 'status', 'how to filter'],
      },
      {
        question: 'How do I clear all filters?',
        answer:
          'Click the "Clear all" button to clear all filter selections and view all records.',
        keywords: ['clear', 'clear all', 'reset', 'how to clear'],
      },
      {
        question: 'How do I export all records?',
        answer:
          'Click "Export all" to save all deconfiguration records to your device.',
        keywords: ['export', 'export all', 'save', 'how to export'],
      },
      {
        question: 'How do I view SRC Details and Location Code?',
        answer:
          'Click the arrow next to the record id to expand the record and view SRC Details and Location Code.',
        keywords: ['SRC', 'details', 'location code', 'how to view'],
      },
      {
        question: 'How do I download additional data?',
        answer:
          'Expand the record and click "Download additional data" to download diagnostic data.',
        keywords: ['download', 'additional data', 'how to download'],
      },
      {
        question: 'How do I delete a record?',
        answer:
          'Ensure the system is powered off, then click the Delete icon for the record and confirm the deletion.',
        keywords: ['delete', 'remove', 'how to delete'],
      },
      {
        question: "Why can't I delete records?",
        answer:
          'Deconfiguration records can only be deleted when the system is powered off. Power off the system to enable deletion.',
        keywords: ['delete', 'cannot delete', 'powered off', 'why'],
      },
      {
        question: 'How do I perform bulk operations?',
        answer:
          'Select multiple records using checkboxes, then choose Export, Delete, or Cancel to perform the operation on all selected records.',
        keywords: ['bulk', 'multiple', 'select', 'how to'],
      },
      {
        question: 'What is the difference between Resolved and Unresolved?',
        answer:
          'Resolved records indicate that the deconfiguration issue has been addressed. Unresolved records indicate ongoing or unaddressed issues.',
        keywords: ['resolved', 'unresolved', 'status', 'difference'],
      },
    ],

    quickActions: [
      {
        label: 'Filter by status',
        description: 'Filter records by Resolved/Unresolved',
        action: 'open-filter',
      },
      {
        label: 'Export all records',
        description: 'Save all deconfiguration records',
        action: 'export-all',
      },
      {
        label: 'Clear filters',
        description: 'Clear all filter selections',
        action: 'clear-filters',
      },
    ],

    tips: [
      'Records can only be deleted when the system is powered off',
      'Use status filtering to focus on resolved or unresolved issues',
      'Export records regularly for historical tracking and analysis',
      'Expand records to view detailed SRC information and Location Code',
      'Download additional data for comprehensive diagnostics',
      'Use bulk operations to manage multiple records efficiently',
    ],
  },
};

export default deconfigurationRecordsSearchContent;

// Made with Bob
