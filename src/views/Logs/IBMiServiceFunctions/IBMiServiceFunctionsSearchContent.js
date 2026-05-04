/**
 * IBM i Service Functions Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const ibmiServiceFunctionsSearchContent = {
  // Main description for header search
  description:
    'Access and manage IBM i service functions for system diagnostics, maintenance, and troubleshooting operations. Execute various service functions including DST activation, console recovery, IOP operations, and power domain management.',

  // Feature descriptions for header search
  features: [
    'Execute IBM i service functions and utilities',
    'Activate Dedicated Service Tools (Function 21)',
    'Console Service Function (Function 65)',
    'Disk Unit IOP Reset/Reload (Function 67)',
    'Concurrent Maintenance Power Off Domain (Function 68)',
    'Concurrent Maintenance Power On Domain (Function 69)',
    'IOP Control Storage Dump (Function 70)',
    'Access system service tools',
    'Perform diagnostic operations',
    'Run maintenance procedures',
    'Execute service commands',
    'View service function logs',
    'Access troubleshooting utilities',
    'Manage system service operations',
  ],

  // Searchable keywords for header search
  keywords: [
    'IBMi',
    'IBM i',
    'service functions',
    'service tools',
    'diagnostics',
    'maintenance',
    'troubleshooting',
    'service utilities',
    'system service',
    'service commands',
    'service operations',
    'AS/400',
    'iSeries',
    'Power Systems',
    'DST',
    'Dedicated Service Tools',
    'console recovery',
    'IOP',
    'disk unit',
    'power domain',
    'function 21',
    'function 65',
    'function 67',
    'function 68',
    'function 69',
    'function 70',
    'execute',
    'refresh',
  ],

  // Related terms for header search
  relatedTerms: [
    'IBM i utilities',
    'service procedures',
    'diagnostic tools',
    'maintenance functions',
    'system diagnostics',
    'service mode',
    'troubleshooting tools',
    'service console',
    'system utilities',
    'service operations',
    'I/O processor',
    'concurrent maintenance',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'IBM i Service Functions Help',
    overview:
      'The IBM i Service Functions page allows you to execute various service functions for system diagnostics, maintenance, and troubleshooting. Functions are only available when the OS is running and when the IBM i OS enables them.',

    sections: [
      {
        id: 'function-availability',
        title: 'Function Availability',
        content:
          'Service functions are only available when the OS is running and when the IBM i OS enables them. If functions are not available, press the refresh button to see the latest status.',
        keywords: ['availability', 'enabled', 'refresh', 'status', 'OS'],
        steps: [
          'Check if functions are available on the page',
          'If functions are not available, click the refresh button',
          'Wait for the status to update',
          'Functions will become available when the OS enables them',
        ],
        note: 'Functions are only available when the OS is running and only when the IBM i OS enables them.',
      },
      {
        id: 'function-21-dst',
        title: 'Activate Dedicated Service Tools (Function 21)',
        content:
          'This function makes dedicated service tools (DST) available on the system console display for advanced system diagnostics and maintenance.',
        keywords: [
          'function 21',
          'DST',
          'Dedicated Service Tools',
          'activate',
          'console',
        ],
        steps: [
          'Select "Activate Dedicated Service Tools (Function 21)" from the function list',
          'Click "Execute" to execute the function',
          'DST will become available on the system console display',
        ],
      },
      {
        id: 'function-65-console',
        title: 'Console Service Function (Function 65)',
        content:
          'Use this function to initiate console recovery for IBM i 7.5 or later systems.',
        keywords: [
          'function 65',
          'console',
          'recovery',
          'console recovery',
          'IBM i 7.5',
        ],
        steps: [
          'Select "Console Service Function (Function 65)" from the function list',
          'Click "Execute" to execute the function',
          'Console recovery will be initiated',
        ],
        note: 'This function is available for IBM i 7.5 or later.',
      },
      {
        id: 'function-67-iop-reset',
        title: 'Disk Unit IOP Reset/Reload (Function 67)',
        content:
          'Use this function to initiate an I/O processor dump and reset/reload of an IOP that controls resources currently in a disk unit attention state.',
        keywords: [
          'function 67',
          'IOP',
          'disk unit',
          'reset',
          'reload',
          'I/O processor',
        ],
        steps: [
          'Select "Disk Unit IOP Reset/Reload (Function 67)" from the function list',
          'Click "Execute" to execute the function',
          'The IOP dump and reset/reload will be initiated',
        ],
      },
      {
        id: 'function-68-power-off',
        title: 'Concurrent Maintenance Power Off Domain (Function 68)',
        content:
          'Use this function to power off the power domain that includes resources currently in a disk unit attention state.',
        keywords: [
          'function 68',
          'power off',
          'power domain',
          'concurrent maintenance',
        ],
        steps: [
          'Select "Concurrent Maintenance Power Off Domain (Function 68)" from the function list',
          'Click "Execute" to execute the function',
          'The power domain will be powered off',
        ],
        warning:
          'This will power off the power domain. Ensure this is the intended action.',
      },
      {
        id: 'function-69-power-on',
        title: 'Concurrent Maintenance Power On Domain (Function 69)',
        content:
          'Use this function to power on the power domain that was powered off using function 68.',
        keywords: [
          'function 69',
          'power on',
          'power domain',
          'concurrent maintenance',
        ],
        steps: [
          'Select "Concurrent Maintenance Power On Domain (Function 69)" from the function list',
          'Click "Execute" to execute the function',
          'The power domain will be powered on',
        ],
        note: 'Use this function to power on a domain that was powered off by function 68.',
      },
      {
        id: 'function-70-iop-dump',
        title: 'IOP Control Storage Dump (Function 70)',
        content:
          'Use this function to initiate an I/O processor dump and reset/reload of the IOP that was designated to control the load source device when the logical partition was activated.',
        keywords: [
          'function 70',
          'IOP',
          'control storage',
          'dump',
          'I/O processor',
          'load source',
        ],
        steps: [
          'Select "IOP Control Storage Dump (Function 70)" from the function list',
          'Click "Execute" to execute the function',
          'The IOP dump and reset/reload will be initiated',
        ],
      },
      {
        id: 'executing-function',
        title: 'Executing a Service Function',
        content:
          'Choose a function from the available options and execute it to perform the desired service operation.',
        keywords: ['execute', 'run', 'perform', 'start'],
        steps: [
          'Review the available service functions',
          'Select the function you want to execute',
          'Click "Execute" to execute that function',
          'Wait for the function to complete',
        ],
        note: 'Functions are only available when the OS is running and when the IBM i OS enables them.',
      },
    ],

    faqs: [
      {
        question: 'Why are service functions not available?',
        answer:
          'Functions are only available when the OS is running and when the IBM i OS enables them. Press the refresh button to see the latest status.',
        keywords: ['not available', 'unavailable', 'disabled', 'why'],
      },
      {
        question: 'How do I execute a service function?',
        answer:
          'Choose a function from the available options and click "Execute" to execute that function.',
        keywords: ['execute', 'run', 'how to', 'perform'],
      },
      {
        question: 'What is Function 21?',
        answer:
          'Function 21 activates Dedicated Service Tools (DST) on the system console display for advanced diagnostics and maintenance.',
        keywords: ['function 21', 'DST', 'what is'],
      },
      {
        question: 'What is Function 65?',
        answer:
          'Function 65 is the Console Service Function used to initiate console recovery for IBM i 7.5 or later.',
        keywords: ['function 65', 'console', 'what is'],
      },
      {
        question: 'What is Function 67?',
        answer:
          'Function 67 initiates an I/O processor dump and reset/reload of an IOP controlling resources in a disk unit attention state.',
        keywords: ['function 67', 'IOP', 'what is'],
      },
      {
        question: 'What are Functions 68 and 69?',
        answer:
          'Function 68 powers off a power domain for concurrent maintenance. Function 69 powers it back on.',
        keywords: ['function 68', 'function 69', 'power', 'what is'],
      },
      {
        question: 'What is Function 70?',
        answer:
          'Function 70 initiates an I/O processor dump and reset/reload of the IOP controlling the load source device.',
        keywords: ['function 70', 'IOP', 'what is'],
      },
      {
        question: 'How do I refresh the function status?',
        answer:
          'Press the refresh button to see the latest status of available functions.',
        keywords: ['refresh', 'update', 'status', 'how to'],
      },
      {
        question: 'Can I execute functions when the OS is not running?',
        answer:
          'No, functions are only available when the OS is running and when the IBM i OS enables them.',
        keywords: ['OS', 'running', 'not running', 'requirements'],
      },
    ],

    quickActions: [
      {
        label: 'Refresh status',
        description: 'Check latest function availability',
        action: 'refresh-status',
      },
      {
        label: 'Execute Function 21',
        description: 'Activate Dedicated Service Tools',
        action: 'execute-function-21',
      },
    ],

    tips: [
      'Press the refresh button if functions are not available',
      'Functions are only available when the OS is running',
      'Function 21 activates DST for advanced diagnostics',
      'Function 65 is for console recovery (IBM i 7.5+)',
      'Functions 68 and 69 work together for power domain management',
      'Always verify the function description before executing',
    ],
  },
};

export default ibmiServiceFunctionsSearchContent;

// Made with Bob
