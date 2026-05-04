/**
 * Power Restore Policy Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const powerRestorePolicySearchContent = {
  // Main description for header search
  description:
    'Configure power restore policy to control system behavior after power loss or restoration. Determine how the system starts after a power disturbance.',

  // Feature descriptions for header search
  features: [
    'Power restore policy configuration',
    'Power loss behavior settings',
    'Automatic power on settings',
    'Power restoration control',
    'System power behavior',
    'Always on policy',
    'Always off policy',
    'Last state policy',
  ],

  // Searchable keywords for header search
  keywords: [
    'power',
    'restore',
    'policy',
    'power loss',
    'power restoration',
    'automatic',
    'power on',
    'power off',
    'power restore policy',
    'restore policy',
    'power behavior',
    'power settings',
    'auto power on',
    'power recovery',
    'always on',
    'always off',
    'last state',
    'power disturbance',
    'configure',
    'save',
  ],

  // Related terms for header search
  relatedTerms: [
    'power management',
    'power configuration',
    'system behavior',
    'power control',
    'automatic restart',
    'power recovery',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Power Restore Policy Help',
    overview:
      'The Power Restore Policy page allows you to configure the power policy to determine how the system starts after a power disturbance. Choose from Always on, Always off, or Last state policies.',

    sections: [
      {
        id: 'always-on-policy',
        title: 'Always On Policy',
        content:
          'Configure the system to always power on when power is applied, regardless of its previous state.',
        keywords: ['always on', 'power on', 'automatic', 'start'],
        steps: [
          'Select "Always on" from the power restore policy options',
          'Click "Save" to save the changes',
          'The system will always power on when power is applied',
        ],
        note: 'The system always powers on when power is applied.',
      },
      {
        id: 'always-off-policy',
        title: 'Always Off Policy',
        content:
          'Configure the system to always remain powered off when power is applied, requiring manual intervention to start.',
        keywords: ['always off', 'power off', 'manual', 'remain off'],
        steps: [
          'Select "Always off" from the power restore policy options',
          'Click "Save" to save the changes',
          'The system will always remain powered off when power is applied',
        ],
        note: 'The system always remains powered off when power is applied and requires manual start.',
      },
      {
        id: 'last-state-policy',
        title: 'Last State Policy',
        content:
          'Configure the system to return to its last power state (on or off) when power is applied.',
        keywords: ['last state', 'previous state', 'restore', 'remember'],
        steps: [
          'Select "Last state" from the power restore policy options',
          'Click "Save" to save the changes',
          'The system will return to its last on or off power state when power is applied',
        ],
        note: 'The system returns to its last on or off power state when power is applied.',
      },
      {
        id: 'saving-policy',
        title: 'Saving Policy Changes',
        content:
          'After selecting a power restore policy, save the changes to apply the configuration.',
        keywords: ['save', 'apply', 'changes', 'configuration'],
        steps: [
          'Select your desired power restore policy',
          'Click "Save" to save the changes',
          'Click "Cancel" to exit without saving',
          'A confirmation message will appear: "Power restore policy updated successfully."',
        ],
      },
    ],

    faqs: [
      {
        question: 'What is power restore policy?',
        answer:
          'Power restore policy determines how the system starts after a power disturbance. You can choose Always on, Always off, or Last state.',
        keywords: ['what is', 'power restore policy', 'definition'],
      },
      {
        question: 'What does "Always on" mean?',
        answer:
          'Always on means the system will always power on automatically when power is applied, regardless of its previous state.',
        keywords: ['always on', 'what does', 'meaning'],
      },
      {
        question: 'What does "Always off" mean?',
        answer:
          'Always off means the system will always remain powered off when power is applied and requires manual intervention to start.',
        keywords: ['always off', 'what does', 'meaning'],
      },
      {
        question: 'What does "Last state" mean?',
        answer:
          'Last state means the system will return to its last power state (on or off) when power is applied.',
        keywords: ['last state', 'what does', 'meaning'],
      },
      {
        question: 'How do I change the power restore policy?',
        answer:
          'Select one of the three policy options (Always on, Always off, or Last state) and click "Save".',
        keywords: ['change', 'how to', 'configure'],
      },
      {
        question: 'Which policy should I choose?',
        answer:
          'Choose Always on for automatic restart after power loss, Always off for manual control, or Last state to maintain the previous power state.',
        keywords: ['which', 'choose', 'recommend', 'best'],
      },
    ],

    quickActions: [
      {
        label: 'Set Always on',
        description: 'Configure automatic power on',
        action: 'set-always-on',
      },
      {
        label: 'Set Last state',
        description: 'Restore previous power state',
        action: 'set-last-state',
      },
    ],

    tips: [
      'Always on is useful for servers that should restart automatically after power loss',
      'Always off provides maximum control over system startup',
      'Last state maintains the system behavior before power loss',
      'Changes take effect immediately after saving',
      'A confirmation message appears when policy is updated successfully',
    ],
  },
};

export const searchContent = powerRestorePolicySearchContent;
export default powerRestorePolicySearchContent;

// Made with Bob
