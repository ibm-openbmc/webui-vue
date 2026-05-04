export const memorySearchContent = {
  // Main description
  description:
    'View and manage system memory configuration including logical memory block size, system memory page setup with huge pages, I/O adapter enlarged capacity, dynamic I/O drawer attachment, active memory mirroring, and predictive dynamic memory deallocation',

  // Feature descriptions
  features: [
    'Logical memory block size configuration',
    'Memory block size for partitioning',
    'System memory page setup',
    'Huge pages configuration (16GB pages)',
    'Maximum number of huge pages',
    'Requested huge page memory',
    'I/O Adapter enlarged capacity',
    'PCIe memory space allocation',
    'Slot count configuration for Node 0',
    'Dynamic I/O drawer attachment',
    'Platform memory allocation during IPL',
    'Active memory mirroring for hypervisor',
    'Memory mirroring mode enable/disable',
    'Predictive dynamic memory deallocation',
    'Dynamic memory page removal',
    'Predictive memory failure handling',
    'Memory configuration updates',
    'System resource management',
    'Virtual memory page sizes',
    'PCIe slot memory allocation',
  ],

  // Searchable keywords
  keywords: [
    'memory',
    'logical memory block size',
    'memory block size',
    'partitioning',
    'system memory page',
    'huge pages',
    'virtual memory',
    '16GB pages',
    'max huge pages',
    'maximum number huge pages',
    'requested huge page memory',
    'I/O adapter',
    'enlarged capacity',
    'PCIe memory',
    'PCIe slot',
    'slot count',
    'node 0',
    'dynamic I/O',
    'drawer attachment',
    'IPL',
    'platform memory',
    'active memory mirroring',
    'memory mirroring',
    'hypervisor',
    'mirroring mode',
    'predictive deallocation',
    'dynamic deallocation',
    'memory deallocation',
    'predictive failure',
    'memory failure',
    'uncorrectable error',
    'memory page removal',
    'update memory',
    'memory settings',
    'memory configuration',
    'successfully updated',
    'enable mirroring',
    'disable mirroring',
    'memory management',
    'system resources',
    'performance improvement',
    'application performance',
  ],

  // Related terms
  relatedTerms: [
    'system resources',
    'hardware resources',
    'memory hardware',
    'physical memory',
    'memory allocation',
    'resource management',
    'system configuration',
    'memory optimization',
    'performance tuning',
    'PCIe configuration',
    'I/O configuration',
    'hypervisor memory',
    'memory protection',
    'error handling',
    'memory reliability',
    'system memory',
    'memory capacity',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Memory Help',
    overview:
      'The Memory page allows you to view and configure system memory settings including logical memory block size, system memory page setup with huge pages, I/O adapter enlarged capacity, dynamic I/O drawer attachment, active memory mirroring, and predictive dynamic memory deallocation. Note: Changes made will take effect on next reboot.',

    sections: [
      {
        id: 'logical-memory-block-size',
        title: 'Logical Memory Block Size',
        content:
          'Configure the logical memory block size used for partitioning. Changing this setting impacts system resource management.',
        keywords: [
          'logical memory',
          'block size',
          'partitioning',
          'resource management',
        ],
        steps: [
          'Select the desired memory block size from the Memory block size list',
          'Click "Update logical memory block size" to apply the changes',
          'The message "Successfully updated logical memory block size" will be displayed',
        ],
        warning:
          'Changing the logical memory block size impacts system resource management.',
        note: 'Changes made will take effect on next reboot.',
      },
      {
        id: 'system-memory-page-setup',
        title: 'System Memory Page Setup',
        content:
          'Improve application performance by setting large virtual memory page sizes of 16GB each using huge pages configuration.',
        keywords: [
          'huge pages',
          '16GB',
          'virtual memory',
          'performance',
          'page size',
        ],
        steps: [
          'Enter the maximum number of huge pages in the "Max number huge pages" field',
          'Enter the requested huge page memory in the "Requested huge page memory" field',
          'Click "Update system memory page setup" to apply the changes',
          'The message "Successfully updated system memory page setup" will be displayed',
        ],
        note: 'Huge pages are 16GB each and improve application performance.',
      },
      {
        id: 'io-adapter-enlarged-capacity',
        title: 'I/O Adapter Enlarged Capacity',
        content:
          'Control the size of PCIe memory space allocated to each PCIe slot by configuring slot count for Node 0.',
        keywords: [
          'I/O adapter',
          'PCIe',
          'memory space',
          'slot count',
          'Node 0',
        ],
        steps: [
          'Enter the slot count for node 0 in the "Slot Count for Node 0" field',
          'Click "Update I/O Adapter Enlarged Capacity" to apply the changes',
          'The message "Successfully updated I/O adapter enlarged capacity" will be displayed',
        ],
        note: 'This option controls PCIe memory space allocation per slot.',
      },
      {
        id: 'dynamic-io-drawer-attachment',
        title: 'Dynamic I/O Drawer Attachment',
        content:
          'Allocate platform memory during IPL for PCIe slots to enable dynamic I/O drawer attachment.',
        keywords: [
          'dynamic I/O',
          'drawer attachment',
          'IPL',
          'platform memory',
          'PCIe slots',
        ],
        steps: [
          'View the Dynamic I/O drawer attachment setting',
          'This option allocates memory during Initial Program Load (IPL)',
          'Enables dynamic attachment of I/O drawers to PCIe slots',
        ],
      },
      {
        id: 'active-memory-mirroring',
        title: 'Active Memory Mirroring',
        content:
          'Enable Active Memory Mirroring for hypervisor to ensure system operation continues even if an uncorrectable error occurs in main memory used by the system hypervisor.',
        keywords: [
          'memory mirroring',
          'hypervisor',
          'uncorrectable error',
          'enable',
          'disable',
        ],
        steps: [
          'Locate the Active memory mirroring section',
          'Set the option to "Enabled" to enable Active memory mirror mode',
          'The message "Successfully updated active memory mirroring mode" will be displayed',
        ],
        note: 'By default, Active memory mirror mode is disabled.',
      },
      {
        id: 'predictive-dynamic-memory-deallocation',
        title: 'Predictive Dynamic Memory Deallocation',
        content:
          'Enable the Hypervisor to dynamically remove memory pages that detected predictive failures. If disabled, dynamic memory deallocation will not occur for predictive memory failures.',
        keywords: [
          'predictive',
          'deallocation',
          'memory failure',
          'dynamic',
          'hypervisor',
        ],
        steps: [
          'Locate the Predictive dynamic memory deallocation section',
          'Set the option to "Enabled" to enable predictive deallocation',
          'The message "Successfully updated predictive dynamic memory deallocation" will be displayed',
        ],
        note: 'By default, Predictive dynamic memory deallocation is disabled.',
      },
    ],

    faqs: [
      {
        question: 'When do memory configuration changes take effect?',
        answer:
          'All memory configuration changes take effect on the next system reboot.',
        keywords: ['when', 'take effect', 'reboot', 'changes'],
      },
      {
        question: 'What is logical memory block size used for?',
        answer:
          'Logical memory block size is used for partitioning and impacts system resource management.',
        keywords: ['logical memory', 'block size', 'what is', 'partitioning'],
      },
      {
        question: 'What are huge pages?',
        answer:
          'Huge pages are large virtual memory pages of 16GB each that improve application performance.',
        keywords: ['huge pages', 'what are', '16GB', 'performance'],
      },
      {
        question: 'What does I/O Adapter Enlarged Capacity control?',
        answer:
          'It controls the size of PCIe memory space allocated to each PCIe slot.',
        keywords: ['I/O adapter', 'enlarged capacity', 'what does', 'PCIe'],
      },
      {
        question: 'What is Active Memory Mirroring?',
        answer:
          'Active Memory Mirroring for hypervisor ensures system operation continues even if an uncorrectable error occurs in main memory used by the system hypervisor.',
        keywords: ['memory mirroring', 'what is', 'hypervisor', 'error'],
      },
      {
        question: 'Is Active Memory Mirroring enabled by default?',
        answer:
          'No, by default Active memory mirror mode is disabled. You must enable it manually.',
        keywords: ['default', 'enabled', 'disabled', 'mirroring'],
      },
      {
        question: 'What is Predictive Dynamic Memory Deallocation?',
        answer:
          'It allows the Hypervisor to dynamically remove memory pages that detected predictive failures to prevent system issues.',
        keywords: ['predictive', 'deallocation', 'what is', 'memory failure'],
      },
      {
        question:
          'Is Predictive Dynamic Memory Deallocation enabled by default?',
        answer:
          'No, by default Predictive dynamic memory deallocation is disabled.',
        keywords: ['default', 'enabled', 'disabled', 'predictive'],
      },
      {
        question: 'How do huge pages improve performance?',
        answer:
          'Huge pages (16GB each) reduce memory management overhead and improve application performance by using larger virtual memory page sizes.',
        keywords: ['huge pages', 'performance', 'how', 'improve'],
      },
      {
        question: 'What happens during Dynamic I/O Drawer Attachment?',
        answer:
          'Platform memory is allocated during IPL for PCIe slots to enable dynamic attachment of I/O drawers.',
        keywords: ['dynamic I/O', 'drawer', 'what happens', 'IPL'],
      },
    ],

    quickActions: [
      {
        label: 'Update memory block size',
        description: 'Change logical memory block size',
        action: 'update-block-size',
      },
      {
        label: 'Configure huge pages',
        description: 'Set up system memory page setup',
        action: 'configure-huge-pages',
      },
      {
        label: 'Enable memory mirroring',
        description: 'Turn on Active Memory Mirroring',
        action: 'enable-mirroring',
      },
      {
        label: 'Enable predictive deallocation',
        description: 'Turn on predictive memory deallocation',
        action: 'enable-deallocation',
      },
    ],

    tips: [
      'All memory configuration changes require a system reboot to take effect',
      'Logical memory block size impacts system resource management and partitioning',
      'Huge pages (16GB each) improve application performance',
      'I/O Adapter Enlarged Capacity controls PCIe memory space per slot',
      'Active Memory Mirroring protects against uncorrectable memory errors in hypervisor',
      'Active Memory Mirroring is disabled by default',
      'Predictive Dynamic Memory Deallocation prevents issues from predictive memory failures',
      'Predictive deallocation is disabled by default',
      'Dynamic I/O Drawer Attachment allocates memory during IPL',
      'Configure huge pages to optimize virtual memory performance',
    ],
  },
};

export const searchContent = memorySearchContent;
export default memorySearchContent;
