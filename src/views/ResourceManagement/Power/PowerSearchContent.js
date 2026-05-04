export const powerSearchContent = {
  // Main description
  description:
    'Manage power consumption, power cap settings, power and performance modes (Maximum performance, Energy efficient, Maximum energy saver), and idle power saver configurations with delay time and utilization thresholds',

  // Feature descriptions
  features: [
    'Current power consumption monitoring',
    'Power cap setting configuration',
    'Apply power cap option',
    'Power cap value in watts (0-4294967295)',
    'Power and performance mode selection',
    'Maximum performance mode',
    'Energy efficient mode',
    'Maximum energy saver mode',
    'Power saver mode updates',
    'Mode effects detailed information',
    'Idle power saver enable/disable',
    'Idle power saver delay time (seconds)',
    'Idle power saver utilization threshold (%)',
    'Enter idle power saver settings',
    'Exit idle power saver settings',
    'Reset idle power settings to default',
    'Power cap management',
    'Power consumption tracking',
    'Energy management modes',
    'Power optimization settings',
  ],

  // Searchable keywords
  keywords: [
    'power',
    'power cap',
    'power consumption',
    'current power consumption',
    'power cap setting',
    'apply power cap',
    'power cap value',
    'watts',
    'power limit',
    'power management',
    'performance mode',
    'power and performance mode',
    'maximum performance',
    'energy efficient',
    'maximum energy saver',
    'energy saver',
    'power saver',
    'power saver mode',
    'select mode',
    'update power saver mode',
    'enable maximum energy saver',
    'idle power saver',
    'enable idle power saver',
    'idle saver',
    'delay time',
    'delay time seconds',
    'utilization threshold',
    'threshold percentage',
    'enter delay time',
    'exit delay time',
    'enter utilization',
    'exit utilization',
    'update idle power saver',
    'reset to default',
    'reset idle power',
    'save power',
    'save changes',
    'successfully saved',
    'successfully updated',
    'successfully reset',
    'power settings',
    'power configuration',
    'energy',
    'power efficiency',
    'power policy',
    'power optimization',
    'dynamic power',
    'wattage',
    'power usage',
    'mode selection',
    'confirm selection',
    'cancel',
    'view detailed information',
    'arrow',
    'effects of mode',
  ],

  // Related terms
  relatedTerms: [
    'energy efficiency',
    'power control',
    'thermal management',
    'performance tuning',
    'power throttling',
    'energy savings',
    'power budget',
    'system performance',
    'power modes',
    'energy consumption',
    'power monitoring',
    'power limits',
    'idle management',
    'power thresholds',
    'system efficiency',
    'resource management',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Power Help',
    overview:
      'The Power page allows you to manage power consumption, set power cap limits, configure power and performance modes (Maximum performance, Energy efficient, Maximum energy saver), and manage idle power saver settings with delay time and utilization thresholds.',

    sections: [
      {
        id: 'power-cap-settings',
        title: 'Power Cap Settings',
        content:
          'Set a power cap to keep power consumption at or below the specified value in watts. View current power consumption and configure power cap limits.',
        keywords: ['power cap', 'watts', 'consumption', 'limit', 'apply'],
        steps: [
          'View the Current power consumption and Power cap setting',
          'Select "Apply power cap" to enable power cap settings',
          'Enter the power cap value in the "Power cap value (in watts)" field',
          'The value must be between 0 and 4294967295',
          'Click "Save" to save your changes',
        ],
        note: 'The power cap value must be between 0 and 4294967295 watts.',
      },
      {
        id: 'power-performance-modes',
        title: 'Power and Performance Mode',
        content:
          'Select from three power and performance modes to balance system performance and energy consumption.',
        keywords: [
          'performance mode',
          'maximum performance',
          'energy efficient',
          'energy saver',
        ],
        steps: [
          'Click the arrow to view detailed information about the effects of each mode',
          'Select one of the following options in "Select mode":',
          '  - Maximum performance: Prioritizes system performance',
          '  - Energy efficient: Balances performance and energy consumption',
          '  - Maximum energy saver: Prioritizes energy savings',
          'Click "Update power saver mode" to save your changes',
          'Confirm your selection and click "Enable maximum energy saver mode" or "Cancel" to exit',
          'The message "Successfully saved power saver mode" will be displayed',
        ],
        note: 'By default, the Maximum energy saver mode is selected.',
      },
      {
        id: 'idle-power-saver',
        title: 'Idle Power Saver',
        content:
          'Configure idle power saver settings to reduce power consumption when the system is idle, with customizable delay time and utilization thresholds for entering and exiting idle mode.',
        keywords: [
          'idle power saver',
          'delay time',
          'utilization threshold',
          'enable',
          'reset',
        ],
        steps: [
          'Click "Enable idle power saver" to enable the idle power saver mode',
          'To enter idle mode:',
          '  - Enter the Delay time (in seconds)',
          '  - Enter the Utilization threshold (in %)',
          'To exit idle mode:',
          '  - Enter the Delay time (in seconds)',
          '  - Enter the Utilization threshold (in %)',
          'Click "Update idle power saver" to update the settings',
          'The message "Successfully saved idle power settings" will be displayed',
          'Click "Reset to default" to reset the idle power saver settings',
          'The message "Successfully reset idle power settings" will be displayed',
        ],
      },
      {
        id: 'viewing-power-consumption',
        title: 'Viewing Current Power Consumption',
        content:
          'Monitor the current power consumption of the system in watts.',
        keywords: ['current', 'power consumption', 'view', 'monitor', 'watts'],
        steps: [
          'View the "Current power consumption" value displayed on the page',
          'The value is shown in watts',
          'This value updates to reflect real-time power usage',
        ],
      },
    ],

    faqs: [
      {
        question: 'How do I set a power cap?',
        answer:
          'Select "Apply power cap", enter a value between 0 and 4294967295 watts in the "Power cap value" field, and click "Save".',
        keywords: ['power cap', 'how to', 'set', 'apply'],
      },
      {
        question: 'What is the valid range for power cap values?',
        answer: 'The power cap value must be between 0 and 4294967295 watts.',
        keywords: ['power cap', 'range', 'valid', 'value'],
      },
      {
        question: 'What are the available power and performance modes?',
        answer:
          'There are three modes: Maximum performance (prioritizes performance), Energy efficient (balances performance and energy), and Maximum energy saver (prioritizes energy savings).',
        keywords: ['modes', 'performance', 'energy', 'available'],
      },
      {
        question: 'Which power mode is selected by default?',
        answer: 'By default, the Maximum energy saver mode is selected.',
        keywords: ['default', 'mode', 'selected'],
      },
      {
        question: 'How do I enable idle power saver?',
        answer:
          'Click "Enable idle power saver", configure the delay time and utilization threshold for entering and exiting idle mode, then click "Update idle power saver".',
        keywords: ['idle power saver', 'enable', 'how to'],
      },
      {
        question: 'What is delay time in idle power saver?',
        answer:
          'Delay time (in seconds) determines how long the system waits before entering or exiting idle power saver mode based on utilization.',
        keywords: ['delay time', 'what is', 'idle', 'seconds'],
      },
      {
        question: 'What is utilization threshold?',
        answer:
          'Utilization threshold (in %) determines the system utilization level that triggers entering or exiting idle power saver mode.',
        keywords: ['utilization threshold', 'what is', 'percentage'],
      },
      {
        question: 'How do I reset idle power saver settings?',
        answer:
          'Click "Reset to default" to restore the idle power saver settings to their default values.',
        keywords: ['reset', 'default', 'idle power saver', 'how to'],
      },
      {
        question: 'Can I view detailed information about each power mode?',
        answer:
          'Yes, click the arrow next to the power mode options to view detailed information about the effects of each mode.',
        keywords: ['view', 'details', 'information', 'modes'],
      },
      {
        question: 'What happens when I change the power mode?',
        answer:
          'You will be asked to confirm your selection. Click "Enable maximum energy saver mode" to confirm or "Cancel" to exit without changing.',
        keywords: ['change', 'mode', 'confirm', 'what happens'],
      },
    ],

    quickActions: [
      {
        label: 'Set power cap',
        description: 'Configure power consumption limit',
        action: 'set-power-cap',
      },
      {
        label: 'Change power mode',
        description: 'Select performance or energy mode',
        action: 'change-power-mode',
      },
      {
        label: 'Enable idle power saver',
        description: 'Configure idle power settings',
        action: 'enable-idle-saver',
      },
      {
        label: 'Reset idle settings',
        description: 'Restore default idle power settings',
        action: 'reset-idle-settings',
      },
    ],

    tips: [
      'Power cap value must be between 0 and 4294967295 watts',
      'Maximum energy saver mode is selected by default',
      'Click the arrow to view detailed effects of each power mode',
      'Idle power saver reduces consumption when system is idle',
      'Configure separate delay time and utilization threshold for entering and exiting idle mode',
      'Reset to default restores idle power saver settings',
      'Current power consumption is displayed in real-time',
      'Confirm your selection when changing power modes',
      'Energy efficient mode balances performance and power consumption',
      'Maximum performance mode prioritizes system performance over energy savings',
    ],
  },
};

export const searchContent = powerSearchContent;
export default powerSearchContent;
