/**
 * Network Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const networkSearchContent = {
  // Main description for header search
  description:
    'Configure BMC network settings including hostname, IPv4, IPv6, DNS, NTP, and LLDP. Manage network interfaces eth0 and eth1 with DHCP or static configurations.',

  // Feature descriptions for header search
  features: [
    'Network configuration',
    'Hostname settings',
    'IPv4 configuration with DHCP and static addresses',
    'IPv6 configuration with auto config',
    'IPv6 static default gateways',
    'Static DNS configuration',
    'LLDP settings',
    'MAC address viewing',
    'Domain name settings',
    'DNS servers configuration',
    'NTP servers configuration',
    'Network interface management (eth0, eth1)',
  ],

  // Searchable keywords for header search
  keywords: [
    'network',
    'IP',
    'address',
    'subnet',
    'gateway',
    'DNS',
    'hostname',
    'MAC',
    'DHCP',
    'static',
    'IPv4',
    'IPv6',
    'IP address',
    'subnet mask',
    'default gateway',
    'DNS server',
    'MAC address',
    'network settings',
    'network configuration',
    'eth0',
    'eth1',
    'interface',
    'domain name',
    'NTP',
    'LLDP',
    'auto config',
    'prefix length',
    'FQDN',
  ],

  // Related terms for header search
  relatedTerms: [
    'network interface',
    'network adapter',
    'TCP/IP',
    'network protocol',
    'IP configuration',
    'network management',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Network Settings Help',
    overview:
      'The Network page allows you to configure BMC network settings including hostname, IPv4/IPv6 addresses, DNS, NTP, and LLDP. Manage network interfaces eth0 and eth1 with various configuration options.',

    sections: [
      {
        id: 'editing-hostname',
        title: 'Editing Hostname',
        content:
          'Modify the hostname of the device. Note: You will be logged out when the hostname is changed, and changes take effect at the next login.',
        keywords: ['hostname', 'edit', 'modify', 'change'],
        steps: [
          'Locate the Hostname field in Network settings',
          'Click the Edit icon to modify the hostname',
          'Enter the new hostname in the Hostname field',
          'Click "Save" to save the changes',
          'Click "Cancel" to exit without saving',
        ],
        warning:
          'You will be logged out when the hostname is changed. The changes will take effect at the next login. A browser refresh or closing and reopening the browser is required.',
      },
      {
        id: 'network-interface-settings',
        title: 'Viewing Network Interface Settings',
        content:
          'View and configure settings for eth0 or eth1 network interfaces including MAC address, domain name, DNS servers, and NTP servers.',
        keywords: ['interface', 'eth0', 'eth1', 'MAC', 'settings'],
        steps: [
          'Click the eth0 or eth1 tab to view interface settings',
          'View MAC address, Use domain name, Use DNS servers, and Use NTP servers information',
          'By default, Use domain name, Use DNS servers, and Use NTP servers are enabled',
          'Click "Disabled" to turn off any of these options',
        ],
        note: 'By default, the options Use domain name, Use DNS servers, and Use NTP servers are enabled.',
      },
      {
        id: 'ipv4-dhcp',
        title: 'Configuring IPv4 with DHCP',
        content:
          'Enable or disable DHCP for automatic IPv4 address assignment. View IP address, Gateway, Subnet mask, and Address origin.',
        keywords: ['IPv4', 'DHCP', 'automatic', 'dynamic'],
        steps: [
          'Navigate to the IPv4 section',
          'DHCP is enabled by default',
          'Click "Disabled" to turn off DHCP and use static addresses',
          'View IP address, Gateway, Subnet mask, and Address origin information',
        ],
        note: 'By default, DHCP is enabled for automatic IP address assignment.',
      },
      {
        id: 'ipv4-static',
        title: 'Adding Static IPv4 Address',
        content:
          'Add a static IPv4 address by specifying IP address, Gateway, and Subnet mask.',
        keywords: ['IPv4', 'static', 'add', 'IP address', 'gateway', 'subnet'],
        steps: [
          'Click "Add static IPV4 address"',
          'Enter the IP address in the IP address field',
          'Enter the Gateway address',
          'Enter the Subnet mask',
          'Click "Add" to add the new static address',
          'Click "Cancel" to exit without saving',
        ],
      },
      {
        id: 'ipv4-edit-delete',
        title: 'Editing or Deleting IPv4 Address',
        content:
          'Modify or remove existing IPv4 addresses from the configuration.',
        keywords: ['IPv4', 'edit', 'delete', 'modify', 'remove'],
        steps: [
          'To edit: Click the Edit icon next to the IP address',
          'Modify the IP address, Gateway, or Subnet mask',
          'Click "Add" to save changes or "Cancel" to exit',
          'To delete: Click the Delete icon next to the IP address',
          'Confirm your selection and click "Delete"',
        ],
      },
      {
        id: 'ipv6-configuration',
        title: 'Configuring IPv6 Settings',
        content:
          'Configure IPv6 with DHCP, auto config, and view IPv6 addresses with prefix length and address origin.',
        keywords: ['IPv6', 'DHCP', 'auto config', 'automatic'],
        steps: [
          'Navigate to the IPv6 section',
          'By default, DHCP and IPv6 auto config are enabled',
          'Click "Disabled" to turn off DHCP or IPv6 auto config',
          'View IP address, Prefix length, and Address origin information',
        ],
        note: 'By default, DHCP and IPv6 auto config are enabled. A success message appears when DHCP settings are updated.',
      },
      {
        id: 'ipv6-static',
        title: 'Adding Static IPv6 Address',
        content:
          'Add a static IPv6 address by specifying the IP address and prefix length.',
        keywords: ['IPv6', 'static', 'add', 'prefix length'],
        steps: [
          'Click "Add static IPV6 address"',
          'Enter the IP address in the IP address field',
          'Enter the Prefix length',
          'Click "Add" to add the new static address',
          'Click "Cancel" to exit without saving',
        ],
      },
      {
        id: 'ipv6-gateway',
        title: 'Managing IPv6 Static Default Gateways',
        content:
          'Add IPv6 static default gateway addresses for routing configuration.',
        keywords: ['IPv6', 'gateway', 'default gateway', 'static', 'routing'],
        steps: [
          'Navigate to IPv6 static default gateways section',
          'Click "Add IPv6 static default gateway address"',
          'Enter the IP address in the IP address field',
          'Click "Add" to add the IP address',
          'Click "Cancel" to exit without saving',
        ],
      },
      {
        id: 'static-dns',
        title: 'Configuring Static DNS',
        content: 'Add static DNS server IP addresses for name resolution.',
        keywords: ['DNS', 'static DNS', 'name server', 'add'],
        steps: [
          'Navigate to the Static DNS section',
          'Click "Add IP address"',
          'Enter the static DNS address in the Static DNS field',
          'Click "Add" to add the IP address',
          'Click "Cancel" to exit without saving',
        ],
      },
      {
        id: 'lldp-configuration',
        title: 'Configuring LLDP',
        content:
          'Enable or disable Link Layer Discovery Protocol (LLDP) for network device discovery.',
        keywords: [
          'LLDP',
          'Link Layer Discovery Protocol',
          'enable',
          'disable',
        ],
        steps: [
          'Navigate to the LLDP section',
          'By default, LLDP is Disabled',
          'Click "Enabled" to turn on the LLDP option',
          'A success message appears: "Successfully updated LLDP settings."',
        ],
        note: 'By default, LLDP is Disabled.',
      },
    ],

    faqs: [
      {
        question: 'How do I change the hostname?',
        answer:
          'Click the Edit icon next to the hostname, enter the new hostname, and click "Save". You will be logged out and need to refresh the browser.',
        keywords: ['hostname', 'change', 'how to'],
      },
      {
        question: 'What happens when I change the hostname?',
        answer:
          'You will be logged out when the hostname is changed. Changes take effect at the next login. A browser refresh or closing and reopening the browser is required.',
        keywords: ['hostname', 'logout', 'what happens'],
      },
      {
        question: 'How do I add a static IP address?',
        answer:
          'Click "Add static IPV4 address" or "Add static IPV6 address", enter the required information (IP, gateway/prefix, subnet mask), and click "Add".',
        keywords: ['static IP', 'add', 'how to'],
      },
      {
        question: 'What is DHCP?',
        answer:
          'DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses to devices. It is enabled by default for both IPv4 and IPv6.',
        keywords: ['DHCP', 'what is', 'automatic'],
      },
      {
        question: 'What is IPv6 auto config?',
        answer:
          'IPv6 auto config allows devices to automatically configure IPv6 addresses using router advertisements. It is enabled by default.',
        keywords: ['IPv6', 'auto config', 'what is'],
      },
      {
        question: 'How do I disable DHCP?',
        answer:
          'Navigate to the IPv4 or IPv6 section and click "Disabled" next to the DHCP option to turn it off and use static addresses.',
        keywords: ['DHCP', 'disable', 'turn off', 'how to'],
      },
      {
        question: 'What is LLDP?',
        answer:
          'LLDP (Link Layer Discovery Protocol) is used for network device discovery. It is disabled by default and can be enabled in the LLDP section.',
        keywords: ['LLDP', 'what is', 'Link Layer Discovery Protocol'],
      },
      {
        question: 'Can I have both DHCP and static IP addresses?',
        answer:
          'Yes, you can configure static IP addresses even when DHCP is enabled. Both will be displayed in the interface.',
        keywords: ['DHCP', 'static', 'both', 'can I'],
      },
      {
        question: 'What is the difference between eth0 and eth1?',
        answer:
          'eth0 and eth1 are separate network interfaces. You can configure each independently with different settings.',
        keywords: ['eth0', 'eth1', 'difference', 'interface'],
      },
      {
        question: 'How do I add a DNS server?',
        answer:
          'Navigate to Static DNS section, click "Add IP address", enter the DNS server address, and click "Add".',
        keywords: ['DNS', 'add', 'how to'],
      },
    ],

    quickActions: [
      {
        label: 'Edit hostname',
        description: 'Change device hostname',
        action: 'edit-hostname',
      },
      {
        label: 'Add static IPv4',
        description: 'Add static IPv4 address',
        action: 'add-ipv4',
      },
      {
        label: 'Add static IPv6',
        description: 'Add static IPv6 address',
        action: 'add-ipv6',
      },
    ],

    tips: [
      'Changing hostname requires logout and browser refresh',
      'DHCP is enabled by default for automatic IP assignment',
      'You can configure both DHCP and static addresses simultaneously',
      'Use domain name, DNS servers, and NTP servers are enabled by default',
      'LLDP is disabled by default - enable it for network device discovery',
      'Configure eth0 and eth1 interfaces independently',
      'IPv6 auto config is enabled by default for automatic configuration',
    ],
  },
};

export const searchContent = networkSearchContent;
export default networkSearchContent;

// Made with Bob
