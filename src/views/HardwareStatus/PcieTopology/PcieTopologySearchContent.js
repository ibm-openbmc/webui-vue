/**
 * PCIe Hardware Topology Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const pcieTopologySearchContent = {
  // Main description for header search
  description:
    'Display PCIe hardware topology information including Id, Parent ID, Link status, Local port location, and Remote port location. Filter PCIe topology data by applying selected filter criteria to view hardware connections and link status.',

  // Feature descriptions for header search
  features: [
    'PCIe topology viewing',
    'PCIe hardware topology visualization',
    'PCIe slot information display',
    'PCIe link status monitoring',
    'Identify LED management',
    'PCIe link reset functionality',
    'Hardware topology visualization',
    'PCIe device information',
    'Slot configuration viewing',
    'Display Id information',
    'Display Parent ID',
    'Display Link status',
    'Display Local port location',
    'Display Remote port location',
    'Filter PCIe topology data',
    'Apply selected filters',
    'Port location tracking',
  ],

  // Searchable keywords for header search
  keywords: [
    'PCIe',
    'PCI',
    'topology',
    'hardware',
    'slot',
    'link',
    'LED',
    'reset',
    'PCIe topology',
    'hardware topology',
    'PCIe slot',
    'PCIe link',
    'identify LED',
    'link reset',
    'PCIe device',
    'slot information',
    'link status',
    'Id',
    'Parent ID',
    'Link status',
    'Local port location',
    'Remote port location',
    'display Id',
    'display Parent ID',
    'display Link status',
    'display Local port',
    'display Remote port',
    'click filter',
    'apply filter',
    'selected filters',
    'filter criteria',
    'filter topology',
    'topology data',
    'port location',
    'local port',
    'remote port',
    'hardware connections',
    'device connections',
    'PCIe hardware',
  ],

  // Related terms for header search
  relatedTerms: [
    'hardware configuration',
    'device topology',
    'expansion slots',
    'PCIe configuration',
    'hardware layout',
    'device connections',
    'topology information',
    'parent identification',
    'port identification',
    'location information',
    'filter application',
    'data filtering',
    'topology filtering',
    'port details',
    'link information',
    'connection status',
    'hardware hierarchy',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'PCIe Hardware Topology Help',
    overview:
      'The PCIe Hardware Topology page displays comprehensive PCIe topology information including Id, Parent ID, Link status, Local port location, and Remote port location. Use this page to visualize hardware connections, monitor link status, and manage PCIe devices.',

    sections: [
      {
        id: 'viewing-topology',
        title: 'Viewing PCIe Topology Information',
        content:
          'View PCIe topology information displayed in a table format showing Id, Parent ID, Link status, Local port location, and Remote port location for each PCIe device.',
        keywords: ['view', 'display', 'topology', 'information', 'table'],
        steps: [
          'Navigate to the PCIe Hardware Topology page',
          'View the topology table displaying:',
          '  - Id: Unique identifier for the PCIe device',
          '  - Parent ID: Identifier of the parent device in the hierarchy',
          '  - Link status: Current status of the PCIe link',
          '  - Local port location: Location of the local port',
          '  - Remote port location: Location of the remote port',
          'Scroll through the list to see all PCIe devices',
        ],
      },
      {
        id: 'understanding-topology',
        title: 'Understanding PCIe Topology',
        content:
          'PCIe topology shows the hierarchical structure of PCIe devices and their connections, including parent-child relationships and port locations.',
        keywords: [
          'understanding',
          'topology',
          'hierarchy',
          'structure',
          'connections',
        ],
        steps: [
          'Id: Unique identifier for each PCIe device or port',
          'Parent ID: Shows which device this component is connected to, establishing the hierarchy',
          'Link status: Indicates whether the PCIe link is active, inactive, or in another state',
          'Local port location: Physical location code of the local port',
          'Remote port location: Physical location code of the remote port (connected device)',
        ],
        note: 'The topology structure helps visualize how PCIe devices are interconnected in the system.',
      },
      {
        id: 'filtering-topology',
        title: 'Filtering PCIe Topology Data',
        content:
          'Apply filters to the PCIe topology data to focus on specific devices or connections.',
        keywords: ['filter', 'filtering', 'apply filter', 'filter criteria'],
        steps: [
          'Click the Filter button',
          'Select the desired filter criteria from the available options',
          'Click Apply to filter the topology data',
          'The table will display only devices matching the selected criteria',
        ],
      },
      {
        id: 'link-status',
        title: 'Understanding Link Status',
        content:
          'Link status indicates the current operational state of the PCIe connection between devices.',
        keywords: ['link status', 'status', 'connection', 'operational state'],
        steps: [
          'View the Link status column for each device',
          'Link status values may include:',
          '  - Active/Up: Link is operational and functioning',
          '  - Inactive/Down: Link is not operational',
          '  - Training: Link is in the process of establishing connection',
          '  - Other states depending on the PCIe specification',
        ],
        note: 'Monitor link status to identify connectivity issues or inactive devices.',
      },
      {
        id: 'port-locations',
        title: 'Understanding Port Locations',
        content:
          'Local and remote port locations identify the physical locations of PCIe connections in the system.',
        keywords: [
          'port location',
          'local port',
          'remote port',
          'location',
          'physical location',
        ],
        steps: [
          'Local port location: Shows the location code of the port on the local device',
          'Remote port location: Shows the location code of the connected remote device',
          'Location codes follow system-specific naming conventions',
          'Use location codes to physically identify devices in the system',
        ],
      },
      {
        id: 'identify-leds',
        title: 'Managing Identify LEDs',
        content:
          'Control identify LEDs for PCIe devices to physically locate them in the system.',
        keywords: [
          'identify LED',
          'LED',
          'locate',
          'physical location',
          'identify',
        ],
        steps: [
          'Locate the device you want to identify',
          'Click the Identify LED option for that device',
          'The physical LED on the device will illuminate',
          'Use this to physically locate the device in the system',
          'Turn off the LED when identification is complete',
        ],
        note: 'Identify LEDs help physically locate devices during maintenance or troubleshooting.',
      },
      {
        id: 'reset-link',
        title: 'Resetting PCIe Links',
        content:
          'Reset PCIe links to re-establish connections or recover from link errors.',
        keywords: [
          'reset',
          'link reset',
          'reset link',
          're-establish',
          'recover',
        ],
        steps: [
          'Locate the device with the link you want to reset',
          'Click the Reset link option for that device',
          'Confirm the reset operation',
          'The PCIe link will be reset and re-established',
          'Monitor the link status to verify successful reset',
        ],
        warning: 'Resetting a link may temporarily interrupt device operation.',
      },
      {
        id: 'clearing-filters',
        title: 'Clearing Filters',
        content: 'Remove applied filters to view all PCIe topology data.',
        keywords: ['clear', 'remove', 'filter', 'all devices'],
        steps: [
          'Click the Filter button',
          'Deselect all filter options or click Clear',
          'Click Apply to show all PCIe devices',
        ],
      },
    ],

    faqs: [
      {
        question: 'What is PCIe topology?',
        answer:
          'PCIe topology is the hierarchical structure showing how PCIe devices are connected in the system, including parent-child relationships and port locations.',
        keywords: ['what is', 'topology', 'PCIe topology'],
      },
      {
        question: 'What does Parent ID mean?',
        answer:
          'Parent ID identifies which device this component is connected to, establishing the hierarchical relationship in the PCIe topology.',
        keywords: ['parent ID', 'what does', 'meaning'],
      },
      {
        question: 'How do I filter the topology data?',
        answer:
          'Click the Filter button, select the desired filter criteria from the available options, and click Apply.',
        keywords: ['filter', 'how to', 'filtering'],
      },
      {
        question: 'What does Link status show?',
        answer:
          'Link status indicates the current operational state of the PCIe connection, such as Active/Up, Inactive/Down, or Training.',
        keywords: ['link status', 'what does', 'status'],
      },
      {
        question: 'What are Local and Remote port locations?',
        answer:
          'Local port location shows the location code of the port on the local device, while Remote port location shows the location code of the connected remote device.',
        keywords: ['port location', 'local', 'remote', 'what are'],
      },
      {
        question: 'How do I identify a physical device?',
        answer:
          'Click the Identify LED option for the device. The physical LED on the device will illuminate to help you locate it.',
        keywords: ['identify', 'physical', 'locate', 'how to'],
      },
      {
        question: 'How do I reset a PCIe link?',
        answer:
          'Click the Reset link option for the device, confirm the operation, and the PCIe link will be reset and re-established.',
        keywords: ['reset', 'link', 'how to'],
      },
      {
        question: 'Will resetting a link affect device operation?',
        answer:
          'Yes, resetting a link may temporarily interrupt device operation while the connection is re-established.',
        keywords: ['reset', 'affect', 'operation', 'will it'],
      },
      {
        question: 'Can I view all devices at once?',
        answer:
          'Yes, by default all devices are displayed. If filters are applied, clear them to view all devices.',
        keywords: ['all devices', 'view all', 'can I'],
      },
      {
        question: 'What does an inactive link status mean?',
        answer:
          'An inactive or down link status means the PCIe connection is not operational. This could indicate a disconnected device, hardware issue, or configuration problem.',
        keywords: ['inactive', 'link status', 'what does', 'meaning'],
      },
    ],

    quickActions: [
      {
        label: 'Filter topology',
        description: 'Apply filters to topology data',
        action: 'open-filter',
      },
      {
        label: 'View all devices',
        description: 'Clear filters and show all',
        action: 'clear-filters',
      },
      {
        label: 'Identify device',
        description: 'Turn on identify LED',
        action: 'identify-device',
      },
      {
        label: 'Reset link',
        description: 'Reset PCIe link connection',
        action: 'reset-link',
      },
    ],

    tips: [
      'Use Parent ID to understand the hierarchical structure of PCIe devices',
      'Monitor Link status to identify connectivity issues',
      'Local and Remote port locations help physically identify devices',
      'Use Identify LED to physically locate devices during maintenance',
      'Reset links to recover from connection errors',
      'Filter topology data to focus on specific devices or connections',
      'Inactive link status may indicate disconnected or faulty devices',
      'The topology structure visualizes how devices are interconnected',
      'Location codes follow system-specific naming conventions',
      'Resetting a link temporarily interrupts device operation',
    ],
  },
};

export default pcieTopologySearchContent;

// Made with Bob

export const searchContent = pcieTopologySearchContent;
