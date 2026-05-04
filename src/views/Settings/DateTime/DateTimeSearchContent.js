/**
 * Date and Time Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const dateTimeSearchContent = {
  // Main description for header search
  description:
    'Configure system date and time settings, manage time zone, and set up NTP servers. Displays Date and 24-hour time information with UTC or browser offset options.',

  // Feature descriptions for header search
  features: [
    'Date and time configuration',
    'Time zone settings',
    'NTP server configuration',
    'Manual time setting',
    'Static NTP servers',
    'Automatic time synchronization',
    'System clock management',
    'UTC time display',
    'Browser offset display',
  ],

  // Searchable keywords for header search
  keywords: [
    'date',
    'time',
    'timezone',
    'time zone',
    'NTP',
    'clock',
    'synchronization',
    'date time',
    'date and time',
    'time settings',
    'NTP server',
    'time synchronization',
    'system time',
    'system clock',
    'manual time',
    'automatic time',
    'UTC',
    '24-hour',
    'static NTP',
    'configure',
    'save',
  ],

  // Related terms for header search
  relatedTerms: [
    'time configuration',
    'clock settings',
    'time management',
    'network time protocol',
    'time server',
    'clock synchronization',
    'profile settings',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Date and Time Help',
    overview:
      'The Date and Time page allows you to configure system date and time settings. You can set time manually or use NTP servers for automatic synchronization. Time can be displayed in UTC or browser offset throughout the application (see Profile Settings).',

    sections: [
      {
        id: 'manual-configuration',
        title: 'Manual Time Configuration',
        content:
          'Set the system date and time manually by entering the values directly.',
        keywords: ['manual', 'configure', 'set', 'date', 'time'],
        steps: [
          'Select "Manual" from the configuration settings',
          'Enter the date in the Date field',
          'Enter the time in the 24-hour time (UTC) field',
          'Click "Save" to save the changes',
        ],
        note: 'Time is entered in 24-hour UTC format.',
      },
      {
        id: 'ntp-configuration',
        title: 'Static NTP Servers Configuration',
        content:
          'Configure static NTP servers for automatic time synchronization. If no server is provided or the server is unreachable, time.google.com will be used as fallback.',
        keywords: ['NTP', 'static', 'servers', 'automatic', 'synchronization'],
        steps: [
          'Select "Static NTP servers" from the configuration settings',
          'Enter the NTP server address in the Server 1 field',
          'Optionally, enter additional servers in Server 2 and Server 3 fields',
          'Click "Save" to save the changes',
        ],
        note: 'If NTP is selected but no server is given or the server is unreachable, time.google.com will be used.',
      },
      {
        id: 'viewing-time',
        title: 'Viewing Date and Time',
        content:
          'The page displays the current Date and 24-hour time information. Time can be shown in UTC or browser offset.',
        keywords: ['view', 'display', 'UTC', 'browser offset', '24-hour'],
        steps: [
          'View the current date and time on the page',
          'To change how time is displayed (UTC or browser offset), go to Profile Settings',
        ],
        note: 'To know more about how date and time are displayed throughout the application, see Profile Settings.',
      },
      {
        id: 'saving-changes',
        title: 'Saving Configuration Changes',
        content:
          'After making changes to date, time, or NTP settings, save them to apply the configuration.',
        keywords: ['save', 'apply', 'changes', 'configuration'],
        steps: [
          'Make your desired changes to date, time, or NTP settings',
          'Click "Save" to save the changes',
          'The new configuration will be applied immediately',
        ],
      },
    ],

    faqs: [
      {
        question: 'How do I set the time manually?',
        answer:
          'Select "Manual" from configuration settings, enter the date and 24-hour time (UTC), then click "Save".',
        keywords: ['manual', 'set time', 'how to'],
      },
      {
        question: 'How do I configure NTP servers?',
        answer:
          'Select "Static NTP servers", enter server addresses in Server 1, 2, and 3 fields, then click "Save".',
        keywords: ['NTP', 'configure', 'servers', 'how to'],
      },
      {
        question: 'What happens if my NTP server is unreachable?',
        answer:
          'If no NTP server is provided or the server is unreachable, time.google.com will be used as a fallback.',
        keywords: ['NTP', 'unreachable', 'fallback', 'time.google.com'],
      },
      {
        question: 'What time format is used?',
        answer:
          'The system uses 24-hour time format in UTC. You can change how time is displayed (UTC or browser offset) in Profile Settings.',
        keywords: ['format', '24-hour', 'UTC', 'time format'],
      },
      {
        question: 'How do I change between UTC and browser offset?',
        answer:
          'Go to Profile Settings to configure how date and time are displayed throughout the application.',
        keywords: ['UTC', 'browser offset', 'display', 'profile settings'],
      },
      {
        question: 'Can I use multiple NTP servers?',
        answer:
          'Yes, you can configure up to 3 NTP servers (Server 1, Server 2, and Server 3) for redundancy.',
        keywords: ['multiple', 'NTP', 'servers', 'redundancy'],
      },
    ],

    quickActions: [
      {
        label: 'Configure manual time',
        description: 'Set date and time manually',
        action: 'configure-manual',
      },
      {
        label: 'Configure NTP servers',
        description: 'Set up automatic time synchronization',
        action: 'configure-ntp',
      },
    ],

    tips: [
      'Use NTP servers for automatic time synchronization to ensure accuracy',
      'Configure multiple NTP servers for redundancy',
      'If NTP server is unreachable, time.google.com is used as fallback',
      'Time is always entered in 24-hour UTC format',
      'Change time display format (UTC/browser offset) in Profile Settings',
      'Save changes after modifying any settings',
    ],
  },
};

export const searchContent = dateTimeSearchContent;
export default dateTimeSearchContent;

// Made with Bob
