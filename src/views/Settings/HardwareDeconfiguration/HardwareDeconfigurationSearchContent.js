/**
 * Hardware Deconfiguration Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const hardwareDeconfigurationSearchContent = {
  // Main description for header search
  description:
    'View and manage hardware deconfiguration settings for memory DIMMs and processor cores. Filter by deconfiguration type and view functional state, event ID, and settings. Memory DIMMs and processor cores can only be configured or deconfigured when the server is powered off.',

  // Feature descriptions for header search
  features: [
    'Hardware deconfiguration viewing',
    'Memory DIMM deconfiguration management',
    'Processor core deconfiguration management',
    'Component deactivation tracking',
    'Hardware resource management',
    'Deconfiguration type filtering',
    'Component isolation monitoring',
    'Hardware fault management',
    'Functional state viewing',
    'Event ID tracking',
    'Deconfiguration settings management',
    'Filter by deconfiguration type',
    'Memory DIMM information display',
    'Processor core information display',
  ],

  // Searchable keywords for header search
  keywords: [
    'hardware',
    'deconfiguration',
    'deactivation',
    'isolation',
    'component',
    'resource',
    'fault',
    'hardware deconfiguration',
    'component deactivation',
    'hardware isolation',
    'fault management',
    'resource allocation',
    'deconfiguration policy',
    'memory',
    'DIMM',
    'DIMMs',
    'memory DIMMs',
    'processor',
    'cores',
    'processor cores',
    'functional state',
    'event ID',
    'deconfiguration type',
    'filter',
    'by association',
    'error',
    'fatal',
    'FCO-Deconfigured',
    'invalid',
    'manual',
    'none',
    'predictive',
    'recovered',
    'unknown',
    'clear all',
    'location code',
    'size',
    'mebibytes',
    'power off',
    'powered off',
    'runtime',
    'reboot',
    'memory event',
  ],

  // Related terms for header search
  relatedTerms: [
    'hardware management',
    'component management',
    'fault isolation',
    'resource management',
    'hardware configuration',
    'component configuration',
    'memory management',
    'processor management',
    'deconfiguration status',
    'component status',
    'hardware status',
    'filter options',
    'deconfiguration filtering',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Hardware Deconfiguration Help',
    overview:
      'The Hardware Deconfiguration page allows you to view and manage deconfiguration settings for memory DIMMs and processor cores. Memory DIMMs and processor cores can only be configured or deconfigured when the server is powered off. If a memory event occurs during runtime and the server has not been rebooted, the memory resource remains in use. After a reboot, it becomes deconfigured and is no longer in use.',

    sections: [
      {
        id: 'important-notes',
        title: 'Important Information',
        content:
          'Memory DIMMs and processor cores can only be configured or deconfigured when the server is powered off. Runtime memory events require a reboot to take effect.',
        keywords: [
          'important',
          'power off',
          'powered off',
          'runtime',
          'reboot',
        ],
        warning:
          'Memory DIMMs and processor cores can be configured or deconfigured only when the server is powered off.',
        note: 'If a memory event occurs during runtime and the server has not been rebooted, the memory resource remains in use. After a reboot, it becomes deconfigured and is no longer in use.',
      },
      {
        id: 'viewing-memory-dimms',
        title: 'Viewing Memory DIMMs',
        content:
          'View memory DIMM information including Name, Size in mebibytes, Location Code, Functional State, Event ID, Deconfiguration Type, and Settings.',
        keywords: [
          'memory',
          'DIMMs',
          'view',
          'size',
          'location',
          'functional state',
        ],
        steps: [
          'Click Memory DIMMS to view the memory DIMM table',
          'View the following information for each DIMM:',
          '  - Name: DIMM identifier',
          '  - Size in mebibytes: Memory capacity',
          '  - Location Code: Physical location',
          '  - Functional State: Current operational state',
          '  - Event ID: Associated event identifier',
          '  - Deconfiguration Type: Reason for deconfiguration',
          '  - Settings: Configuration options',
        ],
      },
      {
        id: 'filtering-memory-dimms',
        title: 'Filtering Memory DIMMs by Deconfiguration Type',
        content:
          'Filter memory DIMMs by deconfiguration type to focus on specific conditions.',
        keywords: [
          'filter',
          'memory',
          'DIMMs',
          'deconfiguration type',
          'filter by type',
        ],
        steps: [
          'Click the Filter button in the Memory DIMMS section',
          'Select the desired deconfiguration type values:',
          '  - By Association: Deconfigured due to association with another component',
          '  - Error: Deconfigured due to an error',
          '  - Fatal: Deconfigured due to a fatal error',
          '  - FCO-Deconfigured: Field Core Override deconfiguration',
          '  - Invalid: Invalid configuration',
          '  - Manual: Manually deconfigured',
          '  - None: No deconfiguration',
          '  - Predictive: Deconfigured based on predictive analysis',
          '  - Recovered: Previously deconfigured but now recovered',
          '  - Unknown: Unknown deconfiguration reason',
          'Click Apply to filter the list',
          'Click "Clear all" to remove all selected options',
        ],
      },
      {
        id: 'viewing-processor-cores',
        title: 'Viewing Processor Cores',
        content:
          'View processor core information including Id, Name, Location Code, Functional State, Event ID, Deconfiguration Type, and Settings.',
        keywords: [
          'processor',
          'cores',
          'view',
          'location',
          'functional state',
          'event ID',
        ],
        steps: [
          'Click Processor cores to view the processor core table',
          'View the following information for each core:',
          '  - Id: Core identifier',
          '  - Name: Core name',
          '  - Location Code: Physical location',
          '  - Functional State: Current operational state',
          '  - Event ID: Associated event identifier',
          '  - Deconfiguration Type: Reason for deconfiguration',
          '  - Settings: Configuration options',
        ],
      },
      {
        id: 'filtering-processor-cores',
        title: 'Filtering Processor Cores by Deconfiguration Type',
        content:
          'Filter processor cores by deconfiguration type to focus on specific conditions.',
        keywords: [
          'filter',
          'processor',
          'cores',
          'deconfiguration type',
          'filter by type',
        ],
        steps: [
          'Click the Filter button in the Processor cores section',
          'Select the desired deconfiguration type values:',
          '  - By Association: Deconfigured due to association with another component',
          '  - Error: Deconfigured due to an error',
          '  - Fatal: Deconfigured due to a fatal error',
          '  - FCO-Deconfigured: Field Core Override deconfiguration',
          '  - Invalid: Invalid configuration',
          '  - Manual: Manually deconfigured',
          '  - None: No deconfiguration',
          '  - Predictive: Deconfigured based on predictive analysis',
          '  - Recovered: Previously deconfigured but now recovered',
          '  - Unknown: Unknown deconfiguration reason',
          'Click Apply to filter the list',
          'Click "Clear all" to remove all selected options',
        ],
      },
      {
        id: 'clearing-filters',
        title: 'Clearing Filters',
        content:
          'Remove all selected filter options to view all memory DIMMs or processor cores.',
        keywords: ['clear', 'clear all', 'remove filters', 'reset filters'],
        steps: [
          'Click the Filter button',
          'Click "Clear all" to remove all selected options',
          'Click Apply to show all items',
        ],
      },
      {
        id: 'deconfiguration-types',
        title: 'Understanding Deconfiguration Types',
        content:
          'Deconfiguration types indicate the reason why a component has been deconfigured.',
        keywords: [
          'deconfiguration types',
          'types',
          'meaning',
          'understanding',
        ],
        steps: [
          'By Association: Component deconfigured due to association with another failed component',
          'Error: Component deconfigured due to an error condition',
          'Fatal: Component deconfigured due to a fatal error requiring immediate action',
          'FCO-Deconfigured: Component deconfigured by Field Core Override',
          'Invalid: Component has an invalid configuration',
          'Manual: Component manually deconfigured by administrator',
          'None: Component is not deconfigured',
          'Predictive: Component deconfigured based on predictive failure analysis',
          'Recovered: Component was previously deconfigured but has recovered',
          'Unknown: Deconfiguration reason is unknown',
        ],
      },
    ],

    faqs: [
      {
        question: 'When can I configure or deconfigure memory DIMMs?',
        answer:
          'Memory DIMMs can only be configured or deconfigured when the server is powered off.',
        keywords: ['when', 'configure', 'memory', 'DIMMs', 'power off'],
      },
      {
        question: 'When can I configure or deconfigure processor cores?',
        answer:
          'Processor cores can only be configured or deconfigured when the server is powered off.',
        keywords: ['when', 'configure', 'processor', 'cores', 'power off'],
      },
      {
        question: 'What happens if a memory event occurs during runtime?',
        answer:
          'If a memory event occurs during runtime and the server has not been rebooted, the memory resource remains in use. After a reboot, it becomes deconfigured and is no longer in use.',
        keywords: ['memory event', 'runtime', 'reboot', 'what happens'],
      },
      {
        question: 'How do I filter by deconfiguration type?',
        answer:
          'Click the Filter button, select the desired deconfiguration type values from the available options, and click Apply.',
        keywords: ['filter', 'deconfiguration type', 'how to'],
      },
      {
        question: 'What does "By Association" mean?',
        answer:
          'By Association means the component was deconfigured due to its association with another failed or deconfigured component.',
        keywords: ['by association', 'meaning', 'what does'],
      },
      {
        question: 'What does "FCO-Deconfigured" mean?',
        answer:
          'FCO-Deconfigured means the component was deconfigured by Field Core Override, typically for testing or maintenance purposes.',
        keywords: ['FCO', 'FCO-Deconfigured', 'meaning', 'what does'],
      },
      {
        question: 'What does "Predictive" deconfiguration mean?',
        answer:
          'Predictive deconfiguration means the component was deconfigured based on predictive failure analysis to prevent future issues.',
        keywords: ['predictive', 'meaning', 'what does'],
      },
      {
        question: 'How do I clear all filters?',
        answer:
          'Click the Filter button, then click "Clear all" to remove all selected options, and click Apply.',
        keywords: ['clear', 'clear all', 'remove filters', 'how to'],
      },
      {
        question: 'Can I reconfigure a deconfigured component?',
        answer:
          'Reconfiguration depends on the deconfiguration type and reason. The server must be powered off to make configuration changes.',
        keywords: ['reconfigure', 'can I', 'deconfigured component'],
      },
      {
        question: 'What is Functional State?',
        answer:
          'Functional State indicates the current operational state of the component, showing whether it is active, deconfigured, or in another state.',
        keywords: ['functional state', 'what is', 'meaning'],
      },
    ],

    quickActions: [
      {
        label: 'View Memory DIMMs',
        description: 'Display memory DIMM information',
        action: 'view-memory-dimms',
      },
      {
        label: 'View Processor Cores',
        description: 'Display processor core information',
        action: 'view-processor-cores',
      },
      {
        label: 'Filter Memory DIMMs',
        description: 'Filter by deconfiguration type',
        action: 'filter-memory-dimms',
      },
      {
        label: 'Filter Processor Cores',
        description: 'Filter by deconfiguration type',
        action: 'filter-processor-cores',
      },
    ],

    tips: [
      'Memory DIMMs and processor cores can only be configured or deconfigured when the server is powered off',
      'Runtime memory events require a reboot to take effect',
      'Use filters to focus on specific deconfiguration types',
      'Click "Clear all" to remove all filter selections',
      'Monitor Fatal and Error deconfiguration types for critical issues',
      'Predictive deconfiguration helps prevent future failures',
      'By Association indicates cascading deconfiguration from related components',
      'FCO-Deconfigured is typically used for testing or maintenance',
      'Check Event ID for more details about deconfiguration events',
      'Location Code helps identify the physical location of components',
    ],
  },
};

export default hardwareDeconfigurationSearchContent;

// Made with Bob

export const searchContent = hardwareDeconfigurationSearchContent;
