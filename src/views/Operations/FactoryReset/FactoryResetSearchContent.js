/**
 * Factory Reset Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const factoryResetSearchContent = {
  // Main description for header search
  description:
    'Perform factory reset to restore BMC and server settings to default. Reset BIOS settings or reset both BMC and server settings. System must be powered off to perform reset operations.',

  // Feature descriptions for header search
  features: [
    'Factory reset operation',
    'BMC reset to defaults',
    'BIOS settings reset',
    'Server settings reset',
    'Configuration data clearing',
    'System restore to factory settings',
    'Default settings restoration',
    'Reset server settings only',
    'Reset BMC and server settings',
  ],

  // Searchable keywords for header search
  keywords: [
    'factory',
    'reset',
    'restore',
    'default',
    'clear',
    'BMC',
    'BIOS',
    'server',
    'factory reset',
    'factory restore',
    'reset to defaults',
    'default settings',
    'restore defaults',
    'clear configuration',
    'BMC reset',
    'system reset',
    'BIOS reset',
    'server reset',
    'power off',
    // Natural language variations
    'how to factory reset',
    'how to reset to defaults',
    'how to restore defaults',
    'where is factory reset',
    'show factory reset',
    'view factory reset',
    'display factory reset',
    'perform factory reset',
    'do factory reset',
    'reset BMC to defaults',
    'reset BIOS to defaults',
    'reset server to defaults',
    'restore BMC defaults',
    'restore BIOS defaults',
    'restore server defaults',
    'clear BMC settings',
    'clear BIOS settings',
    'clear server settings',
    'reset all settings',
    'restore all settings',
    'default configuration',
    'factory defaults',
    'factory settings',
    'reset configuration',
    'restore configuration',
    'reset BMC settings',
    'reset server settings',
    'reset BIOS settings',
    'wipe settings',
    'erase settings',
    'clear all settings',
  ],

  // Related terms for header search
  relatedTerms: [
    'system restore',
    'configuration reset',
    'default configuration',
    'BMC restore',
    'system initialization',
    'configuration clearing',
    'BIOS restore',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Factory Reset Help',
    overview:
      'The Factory Reset page allows you to restore BMC and server settings to their default values. You can reset server settings only or reset both BMC and server settings. The system must be powered off to perform reset operations.',

    sections: [
      {
        id: 'reset-requirements',
        title: 'Reset Requirements',
        content:
          'Before performing a factory reset, ensure the system is powered off. Reset operations are only available when the server status is "off".',
        keywords: ['requirements', 'power off', 'prerequisites'],
        warning:
          'The system must be powered off to perform reset operations. Reset buttons will be disabled if the server is not powered off.',
      },
      {
        id: 'reset-bios-only',
        title: 'Reset Server Settings Only',
        content:
          'Reset only the BIOS settings to their default values. This option resets server settings without affecting BMC configuration.',
        keywords: ['BIOS', 'server settings', 'reset BIOS', 'server only'],
        steps: [
          'Ensure the system is powered off',
          'Select "Reset server settings only" option',
          'Click the "Reset" button',
          'Confirm the reset operation in the modal dialog',
          'Wait for the reset operation to complete',
        ],
        note: 'This option only resets server (BIOS) settings. BMC settings remain unchanged.',
      },
      {
        id: 'reset-to-defaults',
        title: 'Reset BMC and Server Settings',
        content:
          'Reset both BMC and server settings to their default values. This performs a complete factory reset of all configuration.',
        keywords: [
          'BMC and server',
          'reset all',
          'complete reset',
          'factory defaults',
        ],
        steps: [
          'Ensure the system is powered off',
          'Select "Reset BMC and server settings" option',
          'Click the "Reset" button',
          'Confirm the reset operation in the modal dialog',
          'Wait for the reset operation to complete',
          'You will be automatically logged out after 3 seconds',
          'Log back in with default credentials if BMC settings were reset',
        ],
        warning:
          'This option resets both BMC and server settings. You will be logged out and may need to use default credentials to log back in.',
      },
      {
        id: 'secure-delete-note',
        title: 'Important Security Note',
        content:
          'Factory reset functions do not perform a secure delete of data. If secure data deletion is required, additional steps must be taken.',
        keywords: ['security', 'secure delete', 'data deletion'],
        warning:
          'These functions do not perform a secure delete. Sensitive data may still be recoverable after a factory reset.',
      },
    ],

    faqs: [
      {
        question: 'Why are the reset buttons disabled?',
        answer:
          'Reset buttons are disabled when the server is not powered off. You must power off the system before performing a factory reset.',
        keywords: ['disabled', 'buttons', 'why', 'power off'],
      },
      {
        question: 'What is the difference between the two reset options?',
        answer:
          '"Reset server settings only" resets only BIOS settings. "Reset BMC and server settings" resets both BMC and server settings to factory defaults.',
        keywords: ['difference', 'options', 'what is'],
      },
      {
        question: 'Will I be logged out after a reset?',
        answer:
          'You will be automatically logged out after performing "Reset BMC and server settings". You may need to use default credentials to log back in.',
        keywords: ['logout', 'logged out', 'will I'],
      },
      {
        question: 'Does factory reset securely delete data?',
        answer:
          'No, factory reset functions do not perform a secure delete. Sensitive data may still be recoverable. Additional steps are required for secure data deletion.',
        keywords: ['secure delete', 'data deletion', 'does it'],
      },
      {
        question: 'Can I reset while the server is running?',
        answer:
          'No, the system must be powered off to perform reset operations. Reset buttons will be disabled if the server is running.',
        keywords: ['running', 'powered on', 'can I'],
      },
      {
        question: 'What happens to my BMC settings?',
        answer:
          'If you select "Reset server settings only", BMC settings remain unchanged. If you select "Reset BMC and server settings", all BMC settings are reset to defaults.',
        keywords: ['BMC settings', 'what happens', 'settings'],
      },
      {
        question: 'How long does a factory reset take?',
        answer:
          'The reset operation typically completes within a few seconds. You will see a success message when the operation is complete.',
        keywords: ['how long', 'time', 'duration'],
      },
    ],

    quickActions: [
      {
        label: 'Reset BIOS only',
        description: 'Reset server settings only',
        action: 'reset-bios',
      },
      {
        label: 'Reset all settings',
        description: 'Reset BMC and server settings',
        action: 'reset-all',
      },
    ],

    tips: [
      'System must be powered off before performing reset operations',
      'Reset buttons are disabled when server is running',
      '"Reset server settings only" preserves BMC configuration',
      '"Reset BMC and server settings" resets everything to factory defaults',
      'You will be logged out after resetting BMC and server settings',
      'Factory reset does not perform secure data deletion',
      'Default credentials may be required after BMC reset',
    ],
  },
};

export const searchContent = factoryResetSearchContent;
export default factoryResetSearchContent;
