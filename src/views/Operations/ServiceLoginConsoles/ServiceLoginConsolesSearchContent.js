/**
 * Service Login Consoles Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const serviceLoginConsolesSearchContent = {
  // Main description for header search
  description:
    'Access BMC and hypervisor service consoles for system administration and troubleshooting. View the server login interface and select console type.',

  // Feature descriptions for header search
  features: [
    'BMC console access',
    'Hypervisor console access',
    'Service console selection',
    'Terminal emulation',
    'Console status monitoring',
    'Connection status display',
    'Open console in new tab',
    'Service login interface',
    'System administration console',
    'Troubleshooting console',
    'Remote console access',
  ],

  // Searchable keywords for header search
  keywords: [
    'service',
    'login',
    'console',
    'consoles',
    'BMC',
    'hypervisor',
    'terminal',
    'access',
    'status',
    'connection',
    'service console',
    'login console',
    'BMC console',
    'hypervisor console',
    'service login',
    'console access',
    'terminal access',
    'console status',
    'connection status',
    'select console',
    'console type',
    'new tab',
    'service access',
  ],

  // Related terms for header search
  relatedTerms: [
    'system administration',
    'remote management',
    'console management',
    'service mode',
    'maintenance console',
    'diagnostic console',
    'troubleshooting',
    'system troubleshooting',
    'remote access',
    'secure console',
    'terminal session',
    'console session',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Service Login Consoles Help',
    overview:
      'You can view the server login interface. Click Service login consoles to view the server login interface. Select BMC console or Hypervisor console from the Select console list. You can view the Status of the server console and click Open in new tab to display the Status of the server console in a new window.',

    sections: [
      {
        id: 'accessing-service-consoles',
        title: 'Accessing Service Login Consoles',
        content:
          'Click Service login consoles to view the server login interface for system administration and troubleshooting.',
        keywords: [
          'access',
          'service login',
          'consoles',
          'server login',
          'interface',
        ],
        steps: [
          'Navigate to the Service login consoles page',
          'The console selection interface will be displayed',
          'Choose the console type you need to access',
        ],
      },
      {
        id: 'selecting-console-type',
        title: 'Selecting Console Type',
        content:
          'Select BMC console or Hypervisor console from the Select console list to access the appropriate service interface.',
        keywords: [
          'select',
          'console type',
          'BMC',
          'hypervisor',
          'select console',
          'console list',
        ],
        steps: [
          'Locate the "Select console" dropdown list',
          'Choose one of the following options:',
          '  - BMC console: For BMC management and configuration',
          '  - Hypervisor console: For hypervisor access and management',
          'The selected console will load automatically',
        ],
      },
      {
        id: 'bmc-console',
        title: 'BMC Console',
        content:
          'The BMC console provides access to the Baseboard Management Controller for system management, configuration, and troubleshooting.',
        keywords: [
          'BMC',
          'BMC console',
          'baseboard',
          'management controller',
          'BMC access',
        ],
        steps: [
          'Select "BMC console" from the console type dropdown',
          'Wait for the console to connect',
          'View the Status indicator to confirm connection',
          'Use the console for BMC management tasks',
        ],
        note: 'The BMC console provides low-level system management capabilities.',
      },
      {
        id: 'hypervisor-console',
        title: 'Hypervisor Console',
        content:
          'The Hypervisor console provides access to the hypervisor layer for virtualization management and troubleshooting.',
        keywords: [
          'hypervisor',
          'hypervisor console',
          'virtualization',
          'hypervisor access',
        ],
        steps: [
          'Select "Hypervisor console" from the console type dropdown',
          'Wait for the console to connect',
          'View the Status indicator to confirm connection',
          'Use the console for hypervisor management tasks',
        ],
        note: 'The hypervisor console is useful for managing virtualization and guest systems.',
      },
      {
        id: 'console-status',
        title: 'Viewing Console Status',
        content:
          'You can view the Status of the server console to check the connection state.',
        keywords: ['status', 'console status', 'connection', 'view status'],
        steps: [
          'Look at the Status indicator at the top of the console',
          'Check if the status shows "Connected" or "Disconnected"',
          'A green indicator means the console is connected',
          'A red indicator means the console is disconnected',
        ],
      },
      {
        id: 'open-new-tab',
        title: 'Opening Console in New Tab',
        content:
          'Click "Open in new tab" to display the Status of the server console in a new window for better accessibility.',
        keywords: [
          'open',
          'new tab',
          'new window',
          'separate window',
          'open in new tab',
        ],
        steps: [
          'Locate the "Open in new tab" button',
          'Click the button to open the console in a new browser tab',
          'The new tab will display the full console interface',
          'You can now work with the console in a separate window',
        ],
        note: 'Opening in a new tab allows you to keep the console open while navigating other parts of the interface.',
      },
    ],

    faqs: [
      {
        question: 'How do I access the service login consoles?',
        answer:
          'Navigate to the Service login consoles page. The console selection interface will be displayed where you can choose the console type.',
        keywords: ['access', 'how to access', 'open'],
      },
      {
        question: 'What is the difference between BMC and Hypervisor console?',
        answer:
          'BMC console provides access to the Baseboard Management Controller for system management, while Hypervisor console provides access to the hypervisor layer for virtualization management.',
        keywords: ['difference', 'BMC', 'hypervisor', 'what is'],
      },
      {
        question: 'How do I select a console type?',
        answer:
          'Use the "Select console" dropdown list to choose between BMC console or Hypervisor console. The selected console will load automatically.',
        keywords: ['select', 'choose', 'console type', 'how to select'],
      },
      {
        question: 'How do I check if the console is connected?',
        answer:
          'Look at the Status indicator at the top of the console. A green indicator with "Connected" means the console is active, while a red indicator with "Disconnected" means it is not connected.',
        keywords: ['status', 'connected', 'disconnected', 'check'],
      },
      {
        question: 'How do I open the console in a new tab?',
        answer:
          'Click the "Open in new tab" button to display the console in a separate browser tab. This allows you to work with the console while navigating other parts of the interface.',
        keywords: ['new tab', 'open', 'separate window'],
      },
      {
        question: 'When should I use the BMC console?',
        answer:
          'Use the BMC console for system management, configuration, and low-level troubleshooting tasks that require direct access to the Baseboard Management Controller.',
        keywords: ['when', 'use', 'BMC', 'use case'],
      },
      {
        question: 'When should I use the Hypervisor console?',
        answer:
          'Use the Hypervisor console for virtualization management, guest system administration, and hypervisor-level troubleshooting.',
        keywords: ['when', 'use', 'hypervisor', 'use case'],
      },
    ],

    quickActions: [
      {
        label: 'Select BMC console',
        description: 'Access BMC management interface',
        action: 'select-bmc',
      },
      {
        label: 'Select Hypervisor console',
        description: 'Access hypervisor management interface',
        action: 'select-hypervisor',
      },
      {
        label: 'Open in new tab',
        description: 'Open console in separate window',
        action: 'open-new-tab',
      },
    ],

    tips: [
      'Select the appropriate console type based on your management needs',
      'Use BMC console for low-level system management',
      'Use Hypervisor console for virtualization management',
      'Open the console in a new tab to keep it accessible while navigating',
      'Check the Status indicator to verify the console connection',
    ],
  },
};

export default serviceLoginConsolesSearchContent;
