/**
 * SNMP Alerts Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const snmpAlertsSearchContent = {
  // Main description for header search
  description:
    'Configure SNMP alert settings, manage SNMP trap destinations, and set up network monitoring notifications. Set Simple Network Management Protocol (SNMP) traps with IP address and port.',

  // Feature descriptions for header search
  features: [
    'SNMP alert configuration',
    'SNMP trap destination management',
    'Alert notification settings',
    'IP address configuration',
    'Port configuration',
    'FQDN support',
    'Network monitoring setup',
    'Alert destination management',
    'Add and remove destinations',
  ],

  // Searchable keywords for header search
  keywords: [
    'SNMP',
    'alerts',
    'trap',
    'notification',
    'monitoring',
    'destination',
    'IP address',
    'port',
    'FQDN',
    'SNMP alerts',
    'SNMP trap',
    'trap destination',
    'alert notification',
    'SNMP configuration',
    'network monitoring',
    'alert settings',
    'add destination',
    'Simple Network Management Protocol',
  ],

  // Related terms for header search
  relatedTerms: [
    'network management',
    'monitoring configuration',
    'alert management',
    'notification management',
    'SNMP protocol',
    'network alerts',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'SNMP Alerts Help',
    overview:
      'The SNMP Alerts page allows you to set Simple Network Management Protocol (SNMP) traps with an IP address and a port. Configure alert destinations to receive SNMP notifications for system events and monitoring.',

    sections: [
      {
        id: 'viewing-destinations',
        title: 'Viewing SNMP Alert Destinations',
        content:
          'View the list of configured SNMP alert destinations showing IP Address and Port information.',
        keywords: ['view', 'display', 'list', 'destinations'],
        steps: [
          'Navigate to the SNMP Alerts page',
          'View the table displaying IP Address and Port information',
          'Each row represents a configured alert destination',
        ],
      },
      {
        id: 'adding-destination',
        title: 'Adding SNMP Alert Destination',
        content:
          'Add a new SNMP alert destination by specifying an IP address or FQDN and an optional port number.',
        keywords: ['add', 'create', 'new', 'destination', 'IP', 'FQDN', 'port'],
        steps: [
          'Click "Add destination" button',
          'Enter the IP Address or FQDN in the respective field',
          'Optionally, enter the Port number in the "Port - optional" field',
          'Click "Add destination" to save the configuration',
          'Click "Cancel" to exit without saving',
        ],
        note: 'Port number is optional. If not specified, the default SNMP port will be used.',
      },
      {
        id: 'using-fqdn',
        title: 'Using FQDN for Destinations',
        content:
          'You can use either an IP address or a Fully Qualified Domain Name (FQDN) when adding alert destinations.',
        keywords: ['FQDN', 'domain name', 'hostname', 'IP address'],
        steps: [
          'Click "Add destination"',
          'Enter a Fully Qualified Domain Name (FQDN) instead of an IP address',
          'For example: monitor.example.com',
          'Optionally specify a port',
          'Click "Add destination" to save',
        ],
      },
      {
        id: 'port-configuration',
        title: 'Configuring Port Numbers',
        content:
          'Specify custom port numbers for SNMP trap destinations. Port configuration is optional.',
        keywords: ['port', 'port number', 'custom port', 'optional'],
        steps: [
          'When adding a destination, locate the "Port - optional" field',
          'Enter the desired port number',
          'If left empty, the default SNMP port will be used',
          'Click "Add destination" to save',
        ],
        note: 'Port configuration is optional. Default SNMP port is used if not specified.',
      },
      {
        id: 'removing-destination',
        title: 'Removing SNMP Alert Destination',
        content:
          'Remove an existing SNMP alert destination when it is no longer needed.',
        keywords: ['remove', 'delete', 'remove destination'],
        steps: [
          'Locate the destination you want to remove in the list',
          'Click the delete/remove icon for that destination',
          'Confirm the removal if prompted',
          'The destination will be removed from the list',
        ],
      },
    ],

    faqs: [
      {
        question: 'What is SNMP?',
        answer:
          'SNMP (Simple Network Management Protocol) is a protocol used for network monitoring and management. SNMP alerts send notifications about system events to monitoring systems.',
        keywords: ['what is', 'SNMP', 'definition'],
      },
      {
        question: 'How do I add an SNMP alert destination?',
        answer:
          'Click "Add destination", enter the IP Address or FQDN, optionally specify a port, and click "Add destination" to save.',
        keywords: ['add', 'how to', 'destination'],
      },
      {
        question: 'Can I use a domain name instead of an IP address?',
        answer:
          'Yes, you can use either an IP address or a Fully Qualified Domain Name (FQDN) when configuring alert destinations.',
        keywords: ['domain name', 'FQDN', 'IP address', 'can I'],
      },
      {
        question: 'Is the port number required?',
        answer:
          'No, the port number is optional. If not specified, the default SNMP port will be used.',
        keywords: ['port', 'required', 'optional', 'default'],
      },
      {
        question: 'What is the default SNMP port?',
        answer:
          "The default SNMP trap port is typically 162. If you don't specify a port, this default will be used.",
        keywords: ['default', 'port', 'SNMP port', '162'],
      },
      {
        question: 'How do I remove an alert destination?',
        answer:
          'Click the delete/remove icon next to the destination you want to remove and confirm if prompted.',
        keywords: ['remove', 'delete', 'how to'],
      },
      {
        question: 'How many destinations can I add?',
        answer:
          'You can add multiple SNMP alert destinations to send notifications to different monitoring systems.',
        keywords: ['how many', 'multiple', 'limit'],
      },
    ],

    quickActions: [
      {
        label: 'Add destination',
        description: 'Add new SNMP alert destination',
        action: 'add-destination',
      },
    ],

    tips: [
      'You can use either IP addresses or FQDNs for alert destinations',
      'Port number is optional - default SNMP port is used if not specified',
      'Add multiple destinations to send alerts to different monitoring systems',
      'Use FQDNs for easier management when IP addresses change',
      'Verify destination connectivity after adding new alert targets',
    ],
  },
};

export const searchContent = snmpAlertsSearchContent;
export default snmpAlertsSearchContent;

// Made with Bob
