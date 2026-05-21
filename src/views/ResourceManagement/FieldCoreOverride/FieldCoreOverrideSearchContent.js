export const fieldCoreOverrideSearchContent = {
  // Main description
  description:
    'View or change the processor cores that will be configured by the firmware. View current configuration including total installed cores, licensed cores, and configured cores. Enable field core override and set configured cores value (minimum 1). Changes take effect on next server reboot.',

  // Feature descriptions
  features: [
    'View processor core configuration',
    'Change processor cores configured by firmware',
    'Current configuration display',
    'Total installed cores information',
    'Licensed cores information',
    'Configured cores information',
    'Change configuration settings',
    'Enable field core override',
    'Configure cores value entry',
    'Minimum 1 core requirement',
    'Server reboot requirement for changes',
    'Configuration save functionality',
    'Successfully saved confirmation message',
    'Field core override enable/disable',
    'Processor core management',
  ],

  // Searchable keywords
  keywords: [
    'field',
    'core',
    'override',
    'processor',
    'processor cores',
    'field core',
    'core override',
    'field core override',
    'processor core',
    'configured by firmware',
    'firmware',
    'current configuration',
    'total installed cores',
    'installed cores',
    'licensed cores',
    'configured cores',
    'change configuration',
    'enable field core override',
    'enable override',
    'configured cores value',
    'minimum 1',
    'at least 1',
    'core value',
    'enter configured cores',
    'server reboot',
    'next reboot',
    'changes take effect',
    'applying changes',
    'configuration saved',
    'successfully saved',
    'save configuration',
    'core configuration',
    'core settings',
    'core management',
    'view configuration',
    'change cores',
    'core activation',
    'configuration details',
    // Natural language variations
    'show field core override',
    'view field core override',
    'display field core override',
    'configure field core override',
    'setup field core override',
    'how to configure FCO',
    'how to override cores',
    'how to enable cores',
    'how to disable cores',
    'where is field core override',
    'where is FCO',
    'manage processor cores',
    'manage CPU cores',
    'show processor cores',
    'view processor cores',
    'display processor cores',
    'show active cores',
    'view active cores',
    'show inactive cores',
    'view inactive cores',
    'check core count',
    'check processor count',
    'how many cores',
    'how many processors',
    'activate processor cores',
    'deactivate processor cores',
    'turn on cores',
    'turn off cores',
    'change core configuration',
    'modify core settings',
    'update core configuration',
    'show core status',
    'view core status',
    'check core status',
    'show processor status',
    'view processor status',
    'CPU management',
    'processor resource management',
    'core resource management',
    'show installed cores',
    'view installed cores',
    'show licensed cores',
    'view licensed cores',
    'show configured cores',
    'view configured cores',
    'enable field core',
    'disable field core',
    'FCO configuration',
    'FCO settings',
  ],

  // Related terms
  relatedTerms: [
    'processor management',
    'core configuration',
    'CPU configuration',
    'processor settings',
    'core control',
    'processor activation',
    'system reboot',
    'firmware configuration',
    'resource management',
    'processor resources',
    'core allocation',
    'hardware configuration',
    'system configuration',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Field Core Override Help',
    overview:
      'The Field Core Override page allows you to view or change the processor cores that will be configured by the firmware. View current configuration including total installed cores, licensed cores, and configured cores. Enable field core override and set configured cores value (minimum 1). Note: Changes take effect on next server reboot.',

    sections: [
      {
        id: 'current-configuration',
        title: 'Current Configuration',
        content:
          'View the current processor core configuration including total installed cores, licensed cores, and configured cores.',
        keywords: [
          'current',
          'configuration',
          'installed',
          'licensed',
          'configured',
        ],
        steps: [
          'View Total installed cores: Total number of processor cores installed in the system',
          'View Licensed cores: Number of processor cores licensed for use',
          'View Configured cores: Number of processor cores currently configured by firmware',
        ],
      },
      {
        id: 'enable-field-core-override',
        title: 'Enable Field Core Override',
        content:
          'Enable field core override to manually configure the number of processor cores that will be used by the firmware.',
        keywords: ['enable', 'field core override', 'configure', 'manual'],
        steps: [
          'Locate the Change configuration section',
          'Select "Enable field core override" to enable the override feature',
          'The configured cores field will become editable',
        ],
        note: 'Enabling field core override allows manual control of configured processor cores.',
      },
      {
        id: 'configure-cores',
        title: 'Configure Processor Cores',
        content:
          'Set the number of processor cores that will be configured by the firmware.',
        keywords: ['configure', 'cores', 'set', 'number', 'value'],
        steps: [
          'Enable field core override',
          'Enter the desired number of configured cores in the "Configured cores" field',
          'The value must be at least 1',
          'Click Save to apply the configuration',
          'The message "Configuration successfully saved." will be displayed',
        ],
        warning: 'Changes made will take effect on next server reboot.',
        note: 'The configured cores value must be at least 1.',
      },
      {
        id: 'reboot-requirement',
        title: 'Reboot Requirement',
        content:
          'Configuration changes take effect only after the server is rebooted.',
        keywords: ['reboot', 'restart', 'take effect', 'apply changes'],
        steps: [
          'Make your configuration changes',
          'Save the configuration',
          'Reboot the server for changes to take effect',
        ],
        warning:
          'Applying changes: Changes made will take effect on next server reboot.',
      },
    ],

    faqs: [
      {
        question: 'When do field core override changes take effect?',
        answer: 'Changes made will take effect on the next server reboot.',
        keywords: ['when', 'take effect', 'reboot', 'changes'],
      },
      {
        question: 'What is the minimum value for configured cores?',
        answer: 'The configured cores value must be at least 1.',
        keywords: ['minimum', 'value', 'configured cores', 'at least'],
      },
      {
        question: 'What does "Total installed cores" mean?',
        answer:
          'Total installed cores is the total number of processor cores physically installed in the system.',
        keywords: ['total installed', 'what does', 'meaning'],
      },
      {
        question: 'What does "Licensed cores" mean?',
        answer:
          'Licensed cores is the number of processor cores that are licensed for use in the system.',
        keywords: ['licensed', 'what does', 'meaning'],
      },
      {
        question: 'What does "Configured cores" mean?',
        answer:
          'Configured cores is the number of processor cores currently configured by the firmware for use.',
        keywords: ['configured', 'what does', 'meaning'],
      },
      {
        question: 'How do I enable field core override?',
        answer:
          'Select "Enable field core override" in the Change configuration section.',
        keywords: ['enable', 'how to', 'field core override'],
      },
      {
        question: 'Can I configure more cores than licensed?',
        answer:
          'The system will enforce licensing limits. You should configure cores within your licensed allocation.',
        keywords: ['more than', 'licensed', 'can I', 'limits'],
      },
      {
        question: 'Do I need to reboot immediately after saving?',
        answer:
          'Changes are saved but will only take effect after the next server reboot. You can reboot at your convenience.',
        keywords: ['reboot', 'immediately', 'when', 'do I need'],
      },
      {
        question: 'What happens if I disable field core override?',
        answer:
          'Disabling field core override will return control to the firmware for automatic core configuration.',
        keywords: ['disable', 'what happens', 'turn off'],
      },
      {
        question: 'Can I view the configuration without making changes?',
        answer:
          'Yes, the Current configuration section always displays the current core configuration without requiring any changes.',
        keywords: ['view', 'without changes', 'can I', 'read only'],
      },
    ],

    quickActions: [
      {
        label: 'Enable field core override',
        description: 'Turn on manual core configuration',
        action: 'enable-override',
      },
      {
        label: 'Configure cores',
        description: 'Set number of configured cores',
        action: 'configure-cores',
      },
      {
        label: 'View current configuration',
        description: 'Check installed and licensed cores',
        action: 'view-configuration',
      },
    ],

    tips: [
      'Changes take effect on next server reboot',
      'Configured cores value must be at least 1',
      'Enable field core override to manually configure cores',
      'Total installed cores shows physical processor cores',
      'Licensed cores shows your licensed allocation',
      'Configured cores shows currently active cores',
      'Save configuration before rebooting',
      'Configuration successfully saved message confirms changes',
      'Plan reboot timing to minimize disruption',
      'Review current configuration before making changes',
    ],
  },
};

export const searchContent = fieldCoreOverrideSearchContent;
export default fieldCoreOverrideSearchContent;
