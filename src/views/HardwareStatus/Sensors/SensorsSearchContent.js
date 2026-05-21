/**
 * Sensors Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const sensorsSearchContent = {
  // Main description for header search
  description:
    'Display sensor information including Name, Status, and Current value. Filter sensors by status values (OK, Warning, Critical) to monitor system health and performance.',

  // Feature descriptions for header search
  features: [
    'Sensor monitoring and viewing',
    'Temperature sensor readings',
    'Voltage sensor readings',
    'Fan speed monitoring',
    'Power sensor readings',
    'Critical threshold monitoring',
    'Warning threshold monitoring',
    'Sensor status tracking',
    'Real-time sensor data display',
    'Sensor health monitoring',
    'Display sensor Name',
    'Display sensor Status',
    'Display Current value',
    'Filter by status (OK, Warning, Critical)',
    'Status-based filtering',
    'Sensor data filtering',
  ],

  // Searchable keywords for header search
  keywords: [
    'sensors',
    'temperature',
    'voltage',
    'fan',
    'speed',
    'power',
    'reading',
    'threshold',
    'critical',
    'warning',
    'monitoring',
    'sensor status',
    'sensor reading',
    'temperature sensor',
    'voltage sensor',
    'fan sensor',
    'power sensor',
    'upper critical',
    'lower critical',
    'upper warning',
    'lower warning',
    'current value',
    'sensor name',
    'display name',
    'display status',
    'display current value',
    'click filter',
    'apply filter',
    'filter status',
    'status values',
    'OK status',
    'Warning status',
    'Critical status',
    'filter by OK',
    'filter by Warning',
    'filter by Critical',
    'select status',
    'available options',
    'status filter',
    'sensor filter',
    // Natural language variations
    'show sensors',
    'view sensors',
    'display sensors',
    'see sensors',
    'check sensors',
    'monitor sensors',
    'sensor information',
    'sensor data',
    'sensor readings',
    'how to view sensors',
    'how to check sensors',
    'where are sensors',
    'find sensors',
    'locate sensors',
    'what are sensors',
    'what is sensor status',
    'how do i see sensors',
    'how can i view sensors',
    'where can i find sensors',
    'filter sensor data',
    'search sensors',
    'view temperature',
    'check temperature',
    'monitor temperature',
    'see fan speed',
    'check voltage',
    'show me sensors',
    'show me temperature',
    'display temperature readings',
    'thermal monitoring',
    'temp sensors',
    'thermal sensors',
    'heat monitoring',
    'cooling monitoring',
    'fan monitoring',
    'voltage monitoring',
    'power monitoring',
    'sensor health',
    'system sensors',
    'hardware sensors',
    'environmental sensors',
  ],

  // Related terms for header search
  relatedTerms: [
    'hardware monitoring',
    'system monitoring',
    'thermal monitoring',
    'environmental monitoring',
    'sensor data',
    'telemetry',
    'system health',
    'status filtering',
    'filter options',
    'health status',
    'sensor health',
    'status selection',
    'filter application',
    'status display',
    'value display',
    'name display',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Sensors Help',
    overview:
      'The Sensors page displays comprehensive sensor information including Name, Status, and Current value. Use this page to monitor system health by viewing temperature, voltage, fan speed, and power sensor readings. Filter sensors by status (OK, Warning, Critical) to focus on specific conditions.',

    sections: [
      {
        id: 'viewing-sensors',
        title: 'Viewing Sensor Information',
        content:
          'View all sensor information displayed in a table format showing Name, Status, and Current value for each sensor.',
        keywords: ['view', 'display', 'sensor information', 'table'],
        steps: [
          'Navigate to the Sensors page',
          'View the sensor table displaying Name, Status, and Current value',
          'Scroll through the list to see all available sensors',
        ],
      },
      {
        id: 'filtering-by-status',
        title: 'Filtering Sensors by Status',
        content:
          'Filter sensors by their status values (OK, Warning, Critical) to focus on sensors in specific conditions.',
        keywords: [
          'filter',
          'status',
          'OK',
          'warning',
          'critical',
          'filter by status',
        ],
        steps: [
          'Click the Filter button',
          'Select the desired status values from the available options:',
          '  - OK: Sensors operating within normal parameters',
          '  - Warning: Sensors approaching threshold limits',
          '  - Critical: Sensors exceeding threshold limits',
          'Click Apply to filter the sensor list',
          'The table will display only sensors matching the selected status values',
        ],
      },
      {
        id: 'understanding-status',
        title: 'Understanding Sensor Status',
        content:
          'Sensor status indicates the current health and operational state of each sensor relative to its threshold values.',
        keywords: [
          'status',
          'OK',
          'warning',
          'critical',
          'threshold',
          'health',
        ],
        steps: [
          'OK status: Sensor is operating within normal parameters',
          'Warning status: Sensor reading is approaching threshold limits (upper or lower warning)',
          'Critical status: Sensor reading has exceeded threshold limits (upper or lower critical)',
        ],
        note: 'Monitor Critical and Warning status sensors closely to prevent system issues.',
      },
      {
        id: 'sensor-types',
        title: 'Sensor Types',
        content:
          'The system monitors various sensor types including temperature, voltage, fan speed, and power sensors.',
        keywords: [
          'sensor types',
          'temperature',
          'voltage',
          'fan',
          'power',
          'types',
        ],
        steps: [
          'Temperature sensors: Monitor thermal conditions in various system components',
          'Voltage sensors: Track voltage levels for power rails and components',
          'Fan sensors: Display fan speed in RPM for cooling systems',
          'Power sensors: Show power consumption and wattage readings',
        ],
      },
      {
        id: 'current-values',
        title: 'Understanding Current Values',
        content:
          'Current value displays the real-time reading from each sensor with appropriate units (°C, V, RPM, W, etc.).',
        keywords: ['current value', 'reading', 'units', 'real-time'],
        steps: [
          'View the Current value column for sensor readings',
          'Values are displayed with appropriate units:',
          '  - Temperature: Degrees Celsius (°C)',
          '  - Voltage: Volts (V)',
          '  - Fan speed: Revolutions per minute (RPM)',
          '  - Power: Watts (W)',
        ],
        note: 'Current values update in real-time to reflect the latest sensor readings.',
      },
      {
        id: 'clearing-filters',
        title: 'Clearing Status Filters',
        content:
          'Remove applied filters to view all sensors regardless of their status.',
        keywords: ['clear', 'remove', 'filter', 'all sensors'],
        steps: [
          'Click the Filter button',
          'Deselect all status options or click Clear',
          'Click Apply to show all sensors',
        ],
      },
    ],

    faqs: [
      {
        question: 'How do I filter sensors by status?',
        answer:
          'Click the Filter button, select status values (OK, Warning, or Critical) from the available options, and click Apply.',
        keywords: ['filter', 'status', 'how to'],
      },
      {
        question: 'What does OK status mean?',
        answer:
          'OK status indicates the sensor is operating within normal parameters and all readings are within acceptable thresholds.',
        keywords: ['OK', 'status', 'meaning', 'what does'],
      },
      {
        question: 'What does Warning status mean?',
        answer:
          'Warning status indicates the sensor reading is approaching threshold limits (upper or lower warning) and should be monitored.',
        keywords: ['warning', 'status', 'meaning', 'what does'],
      },
      {
        question: 'What does Critical status mean?',
        answer:
          'Critical status indicates the sensor reading has exceeded threshold limits (upper or lower critical) and requires immediate attention.',
        keywords: ['critical', 'status', 'meaning', 'what does'],
      },
      {
        question: 'What types of sensors are monitored?',
        answer:
          'The system monitors temperature sensors (°C), voltage sensors (V), fan speed sensors (RPM), and power sensors (W).',
        keywords: ['sensor types', 'what types', 'monitored'],
      },
      {
        question: 'How often do sensor values update?',
        answer:
          'Sensor values update in real-time to reflect the latest readings from the hardware.',
        keywords: ['update', 'refresh', 'real-time', 'how often'],
      },
      {
        question: 'Can I view all sensors at once?',
        answer:
          'Yes, by default all sensors are displayed. If filters are applied, clear them to view all sensors.',
        keywords: ['all sensors', 'view all', 'can I'],
      },
      {
        question: 'How do I identify problem sensors?',
        answer:
          'Filter by Warning or Critical status to quickly identify sensors that require attention.',
        keywords: ['problem', 'identify', 'issues', 'how to'],
      },
      {
        question: 'What should I do if a sensor shows Critical status?',
        answer:
          'Critical status requires immediate attention. Check the sensor reading, verify system cooling, and investigate potential hardware issues.',
        keywords: ['critical', 'what to do', 'action', 'should I'],
      },
      {
        question: 'Can I export sensor data?',
        answer:
          'Sensor data can be viewed on the page. For historical data or exports, check the Event Logs or system monitoring tools.',
        keywords: ['export', 'save', 'data', 'can I'],
      },
    ],

    quickActions: [
      {
        label: 'Filter by Critical',
        description: 'Show only critical sensors',
        action: 'filter-critical',
      },
      {
        label: 'Filter by Warning',
        description: 'Show warning sensors',
        action: 'filter-warning',
      },
      {
        label: 'View all sensors',
        description: 'Clear filters and show all',
        action: 'clear-filters',
      },
    ],

    tips: [
      'Use status filtering to quickly identify sensors requiring attention',
      'Monitor Critical status sensors immediately to prevent system issues',
      'Warning status sensors indicate potential problems that should be investigated',
      'OK status indicates normal operation within acceptable thresholds',
      'Temperature sensors help monitor system thermal conditions',
      'Voltage sensors track power rail stability',
      'Fan sensors ensure adequate cooling system operation',
      'Power sensors monitor system power consumption',
      'Current values update in real-time for accurate monitoring',
      'Filter by multiple status values to customize your view',
    ],
  },
};

export default sensorsSearchContent;

// Made with Bob

export const searchContent = sensorsSearchContent;
