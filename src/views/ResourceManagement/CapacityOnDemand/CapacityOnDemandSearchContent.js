export const capacityOnDemandSearchContent = {
  // Main description
  description:
    'Manage capacity on demand activation with 34-character activation codes, view order information for on-demand utilities including system, processor, memory, and access key information, and manage VET capabilities with setting and bit capability status',

  // Feature descriptions
  features: [
    'Capacity on demand activation',
    'Activation code entry (34 characters)',
    'System power on requirement',
    'PHYP standby or running requirement',
    'Activate activation code',
    'Order information for on-demand utilities',
    'System information display',
    'System type and serial number',
    'System anchor and COD unique ID',
    'System COD public key',
    'Processor information display',
    'Processor resource ID',
    'Processor sequence number',
    'Processors licensed count',
    'Memory information display',
    'Memory resource ID',
    'Memory sequence number',
    'Memory licensed amount',
    'Access key information',
    'Firmware access key expiration',
    'AIX access key expiration',
    'VET capabilities management',
    'Setting and Bit capability status',
    'Resource dump creation',
    'Resource selector for dumps',
    'Access key from www.ibm.com/servers/eserver/ess',
  ],

  // Searchable keywords
  keywords: [
    'capacity',
    'on demand',
    'COD',
    'activation',
    'activation code',
    'enter activation code',
    '34 characters',
    'activate',
    'system powered on',
    'power on',
    'PHYP',
    'standby',
    'running',
    'license',
    'VET',
    'VET capabilities',
    'processor',
    'memory',
    'access key',
    'order information',
    'on-demand utilities',
    'system information',
    'system type',
    'system serial number',
    'serial number',
    'system anchor',
    'COD unique ID',
    'unique ID',
    'COD public key',
    'public key',
    'processor information',
    'processor resource ID',
    'resource ID',
    'processor sequence number',
    'sequence number',
    'processors licensed',
    'licensed processors',
    'memory information',
    'memory resource ID',
    'memory sequence number',
    'memory licensed',
    'licensed memory',
    'access key information',
    'firmware access key',
    'AIX access key',
    'access key expiration',
    'expiration',
    'setting',
    'bit capability',
    'capability status',
    'resource dump',
    'dumps',
    'resource selector',
    'www.ibm.com',
    'ibm.com/servers/eserver/ess',
    'obtain access key',
    'new access key',
    'capacity on demand',
    'processor license',
    'memory license',
    'trial license',
    'permanent license',
    'system COD',
    'resource activation',
    'COD activation',
    'applying changes',
    'more information',
    'not available',
    // Natural language variations
    'show capacity on demand',
    'view capacity on demand',
    'display capacity on demand',
    'configure COD',
    'setup COD',
    'how to activate COD',
    'how to enter activation code',
    'where is capacity on demand',
    'activate capacity',
    'activate license',
    'enter code',
    'activation key',
    'license key',
    'show order information',
    'view order information',
    'display order information',
    'show system information',
    'view system information',
    'show processor information',
    'view processor information',
    'show memory information',
    'view memory information',
    'licensed resources',
    'resource licensing',
    'check license',
    'view license',
    'show VET capabilities',
    'view VET capabilities',
    'virtualization capabilities',
    'access key expiry',
    'key expiration date',
    'renew access key',
    'get new key',
  ],

  // Related terms
  relatedTerms: [
    'resource licensing',
    'system licensing',
    'feature activation',
    'capacity upgrade',
    'license management',
    'resource management',
    'system resources',
    'hardware activation',
    'system configuration',
    'processor allocation',
    'memory allocation',
    'key management',
    'expiration management',
    'system utilities',
    'resource information',
    'system details',
    'hardware licensing',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Capacity on Demand Help',
    overview:
      'The Capacity on Demand page allows you to manage capacity on demand activation with 34-character activation codes, view order information for on-demand utilities including system, processor, memory, and access key information, and manage VET capabilities. Note: System needs to be powered on to apply changes.',

    sections: [
      {
        id: 'activation-requirements',
        title: 'Activation Requirements',
        content:
          'Before activating capacity on demand, ensure the system meets the required conditions.',
        keywords: ['requirements', 'power on', 'PHYP', 'standby', 'running'],
        steps: [
          'System must be powered on to apply changes',
          'PHYP must be in standby or running state to activate',
          'Activation code must be exactly 34 characters',
        ],
        warning:
          'System needs to be powered on to apply capacity on demand activation changes.',
        note: 'PHYP must be in standby or running to activate.',
      },
      {
        id: 'activation-code',
        title: 'Entering Activation Code',
        content:
          'Activate capacity on demand features by entering a valid 34-character activation code.',
        keywords: ['activation code', '34 characters', 'enter', 'activate'],
        steps: [
          'Ensure the system is powered on',
          'Verify PHYP is in standby or running state',
          'Enter the 34-character activation code in the "Enter activation code" field',
          'Click "Activate" to activate the activation code',
          'Wait for the activation to complete',
        ],
        note: 'The activation code must be exactly 34 characters. To obtain a new access key, visit www.ibm.com/servers/eserver/ess.',
      },
      {
        id: 'order-information',
        title: 'Order Information for On-Demand Utilities',
        content:
          'View comprehensive order information including system, processor, memory, and access key details. If information is not available or more details are required, create a resource dump using a specific resource selector from the Dumps page.',
        keywords: [
          'order information',
          'system information',
          'processor',
          'memory',
          'access key',
        ],
        steps: [
          'View System information: System type, System serial number, System anchor, System COD unique ID, and System COD public key',
          'View Processor information: Processor resource ID, Processor sequence number, and Processors licensed',
          'View Memory information: Memory resource ID, Memory sequence number, and Memory licensed',
          'View Access key information: Firmware access key expiration and AIX access key expiration',
        ],
        note: 'If this information is not available, or more information is required, create a resource dump (using a specific resource selector) from the Dumps page.',
      },
      {
        id: 'system-information',
        title: 'System Information',
        content:
          'View system-specific information including type, serial number, anchor, COD unique ID, and public key.',
        keywords: [
          'system',
          'type',
          'serial number',
          'anchor',
          'unique ID',
          'public key',
        ],
        steps: [
          'System type: Hardware model type',
          'System serial number: Unique serial identifier',
          'System anchor: System anchor information',
          'System COD unique ID: Capacity on Demand unique identifier',
          'System COD public key: Public key for COD operations',
        ],
      },
      {
        id: 'processor-information',
        title: 'Processor Information',
        content:
          'View processor licensing information including resource ID, sequence number, and licensed processor count.',
        keywords: ['processor', 'resource ID', 'sequence number', 'licensed'],
        steps: [
          'Processor resource ID: Unique processor resource identifier',
          'Processor sequence number: Processor sequence information',
          'Processors licensed: Number of licensed processors',
        ],
      },
      {
        id: 'memory-information',
        title: 'Memory Information',
        content:
          'View memory licensing information including resource ID, sequence number, and licensed memory amount.',
        keywords: ['memory', 'resource ID', 'sequence number', 'licensed'],
        steps: [
          'Memory resource ID: Unique memory resource identifier',
          'Memory sequence number: Memory sequence information',
          'Memory licensed: Amount of licensed memory',
        ],
      },
      {
        id: 'access-key-information',
        title: 'Access Key Information',
        content: 'View access key expiration dates for firmware and AIX.',
        keywords: ['access key', 'expiration', 'firmware', 'AIX'],
        steps: [
          'Firmware access key expiration: Expiration date for firmware access key',
          'AIX access key expiration: Expiration date for AIX access key',
        ],
        note: 'Monitor expiration dates to ensure continued access.',
      },
      {
        id: 'vet-capabilities',
        title: 'VET Capabilities',
        content:
          'View VET (Virtualization Engine Technologies) capabilities with setting and bit capability status information.',
        keywords: [
          'VET',
          'capabilities',
          'setting',
          'bit capability',
          'status',
        ],
        steps: [
          'View the VET Capabilities table',
          'Check Setting column for configuration settings',
          'Check Bit capability status column for capability status',
        ],
      },
    ],

    faqs: [
      {
        question:
          'What are the requirements for capacity on demand activation?',
        answer:
          'System must be powered on, PHYP must be in standby or running state, and the activation code must be exactly 34 characters.',
        keywords: ['requirements', 'activation', 'what are'],
      },
      {
        question: 'How long should the activation code be?',
        answer: 'The activation code must be exactly 34 characters.',
        keywords: ['activation code', 'length', '34 characters', 'how long'],
      },
      {
        question: 'Where can I obtain a new access key?',
        answer:
          'To obtain a new access key, visit www.ibm.com/servers/eserver/ess.',
        keywords: ['access key', 'obtain', 'where', 'ibm.com'],
      },
      {
        question: 'What if order information is not available?',
        answer:
          'If order information is not available or more information is required, create a resource dump using a specific resource selector from the Dumps page.',
        keywords: ['order information', 'not available', 'resource dump'],
      },
      {
        question: 'What system information is displayed?',
        answer:
          'System type, System serial number, System anchor, System COD unique ID, and System COD public key are displayed.',
        keywords: ['system information', 'what is displayed', 'details'],
      },
      {
        question: 'What processor information is displayed?',
        answer:
          'Processor resource ID, Processor sequence number, and Processors licensed count are displayed.',
        keywords: ['processor information', 'what is displayed', 'details'],
      },
      {
        question: 'What memory information is displayed?',
        answer:
          'Memory resource ID, Memory sequence number, and Memory licensed amount are displayed.',
        keywords: ['memory information', 'what is displayed', 'details'],
      },
      {
        question: 'What are VET capabilities?',
        answer:
          'VET (Virtualization Engine Technologies) capabilities display setting and bit capability status for virtualization features.',
        keywords: ['VET', 'capabilities', 'what are', 'virtualization'],
      },
      {
        question: 'Can I activate without powering on the system?',
        answer:
          'No, the system must be powered on to apply capacity on demand activation changes.',
        keywords: ['power on', 'activate', 'can I', 'without'],
      },
      {
        question: 'What does PHYP standby or running mean?',
        answer:
          'PHYP (PowerVM Hypervisor) must be in either standby or running state for activation to proceed.',
        keywords: ['PHYP', 'standby', 'running', 'what does', 'mean'],
      },
    ],

    quickActions: [
      {
        label: 'Enter activation code',
        description: 'Activate capacity on demand',
        action: 'enter-activation-code',
      },
      {
        label: 'View system information',
        description: 'Check system COD details',
        action: 'view-system-info',
      },
      {
        label: 'View processor information',
        description: 'Check licensed processors',
        action: 'view-processor-info',
      },
      {
        label: 'View access key expiration',
        description: 'Check key expiration dates',
        action: 'view-access-keys',
      },
    ],

    tips: [
      'System must be powered on to apply activation changes',
      'PHYP must be in standby or running to activate',
      'Activation code must be exactly 34 characters',
      'Obtain new access keys from www.ibm.com/servers/eserver/ess',
      'Create resource dump if order information is not available',
      'Monitor access key expiration dates',
      'VET capabilities show virtualization feature status',
      'System COD unique ID identifies your capacity on demand configuration',
      'Processor and memory licensing information shows allocated resources',
      'Check both firmware and AIX access key expiration dates',
    ],
  },
};

export const searchContent = capacityOnDemandSearchContent;
export default capacityOnDemandSearchContent;
