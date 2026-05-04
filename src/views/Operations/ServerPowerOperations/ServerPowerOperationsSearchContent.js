/**
 * Server Power Operations Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const serverPowerOperationsSearchContent = {
  // Main description for header search
  description:
    'View and edit server power preferences including current status, power operations (power on, reboot, shutdown), and settings for operating mode, power policy, and firmware start policy. Network settings available for Non-HMC managed systems in PHYP standby with IBM i or Default partition environment.',

  // Feature descriptions for header search
  features: [
    'Server power on',
    'Server shutdown',
    'Server reboot',
    'Orderly shutdown',
    'Immediate shutdown',
    'Orderly reboot',
    'Immediate reboot',
    'Server status monitoring',
    'Last power operation tracking',
    'One-time boot settings',
    'Boot settings configuration',
    'BIOS settings management',
    'PHYP standby mode',
    'OS running state',
    'Server firmware start policy',
    'Default partition environment',
    'AIX/Linux partition boot mode',
    'IBM i partition boot mode',
    'Server operating mode',
    'Server power policy',
    'Auto-start configuration',
    'Standby mode management',
    'Linux KVM configuration',
    'Network settings during boot',
  ],

  // Searchable keywords for header search
  keywords: [
    'power',
    'server',
    'operations',
    'power on',
    'power off',
    'shutdown',
    'reboot',
    'restart',
    'orderly',
    'immediate',
    'boot',
    'BIOS',
    'settings',
    'status',
    'chassis',
    'PHYP',
    'standby',
    'runtime',
    'OS running',
    'operating system',
    'server power',
    'power operations',
    'server shutdown',
    'server reboot',
    'orderly shutdown',
    'immediate shutdown',
    'orderly reboot',
    'immediate reboot',
    'power status',
    'server status',
    'boot settings',
    'BIOS settings',
    'one-time boot',
    'firmware start',
    'partition',
    'AIX',
    'Linux',
    'IBM i',
    'KVM',
    'auto-start',
    'manual mode',
    'normal mode',
    'operating mode',
    'power policy',
    'stay on',
    'automatic',
    'default partition',
    'partition environment',
    'boot mode',
    'network settings',
    'non-HMC managed',
  ],

  // Related terms for header search
  relatedTerms: [
    'chassis power',
    'system power',
    'power management',
    'server management',
    'power control',
    'system control',
    'graceful shutdown',
    'forced shutdown',
    'graceful reboot',
    'forced reboot',
    'system restart',
    'cold boot',
    'warm boot',
    'power cycle',
    'system state',
    'power state',
    'boot configuration',
    'startup settings',
    'firmware configuration',
    'partition management',
    'hypervisor',
    'virtualization',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Server Power Operations Help',
    overview:
      'You can view or edit the following preferences: Current status displays the Server status and Last chassis power operation information. Operations include Power on, Reboot server, and Shutdown server. Settings allow configuration of Server operating mode, Server power policy, and Server firmware start policy.',

    sections: [
      {
        id: 'current-status',
        title: 'Current Status',
        content:
          'View the current server status and last chassis power operation information.',
        keywords: [
          'status',
          'current',
          'server status',
          'chassis',
          'last operation',
        ],
        steps: [
          'View the Current status section',
          'Check the Server status (On/Off)',
          'View the Last chassis power operation timestamp',
        ],
      },
      {
        id: 'power-on',
        title: 'Power On Server',
        content:
          'Click Power on to enable the power option. There are no options to display while a power operation is in progress.',
        keywords: ['power on', 'enable', 'start', 'turn on'],
        steps: [
          'Ensure the server status is Off',
          'Click the "Power on" button',
          'Wait for the power operation to complete',
        ],
        note: 'There are no options to display while a power operation is in progress. When complete, power operations will be displayed here.',
      },
      {
        id: 'reboot-server',
        title: 'Reboot Server',
        content:
          'Reboot the server to restart it. Click Reboot to restart the server, then click Confirm to confirm or Cancel to exit the window.',
        keywords: ['reboot', 'restart', 'orderly reboot'],
        steps: [
          'Locate the Reboot server section',
          'Click the "Reboot" button',
          'Click "Confirm" to proceed or "Cancel" to exit',
          'Wait for the server to restart',
        ],
      },
      {
        id: 'shutdown-server',
        title: 'Shutdown Server',
        content:
          'Select one of the following options to perform a shutdown: Orderly - operating system shuts down, then server shuts down. Immediate - Server shuts down without operating system shutting down; may cause data corruption.',
        keywords: [
          'shutdown',
          'power off',
          'orderly',
          'immediate',
          'shut down',
        ],
        steps: [
          'Locate the Shutdown server section',
          'Select shutdown option:',
          '  - Orderly: OS shuts down first, then server shuts down',
          '  - Immediate: Server shuts down immediately (may cause data corruption)',
          'Click "Shut down" to shutdown the server',
        ],
        warning:
          'Immediate shutdown may cause data corruption as the operating system does not shut down gracefully.',
      },
      {
        id: 'server-operating-mode',
        title: 'Server Operating Mode',
        content:
          'Select one of the following options: Normal - Automatic, or Manual - Service / Maintenance.',
        keywords: [
          'operating mode',
          'normal',
          'manual',
          'automatic',
          'service',
          'maintenance',
        ],
        steps: [
          'Locate the Settings section',
          'Find Server operating mode',
          'Select one of the following:',
          '  - Normal - Automatic',
          '  - Manual - Service / Maintenance',
          'Click "Save" to save your changes',
        ],
      },
      {
        id: 'server-power-policy',
        title: 'Server Power Policy',
        content:
          'Select one of the following options: Power Off - When the last partition powers off, the server will power off. Stay On - When the last partition powers off, the server will stay on. Automatic - With this setting, when the system is not partitioned, the behavior is the same as power off, and when the system is partitioned, the behavior of the system is the same as stay on.',
        keywords: [
          'power policy',
          'power off',
          'stay on',
          'automatic',
          'partition',
        ],
        steps: [
          'Locate the Settings section',
          'Find Server power policy',
          'Select one of the following:',
          '  - Power Off: Server powers off when last partition powers off',
          '  - Stay On: Server stays on when last partition powers off',
          '  - Automatic: Behavior based on partitioning status',
          'Click "Save" to save your changes',
        ],
      },
      {
        id: 'firmware-start-policy',
        title: 'Server Firmware Start Policy',
        content:
          'Select one of the following options from the list: Auto-start always, Standby (User-initiated), or Auto-start only.',
        keywords: [
          'firmware',
          'start policy',
          'auto-start',
          'standby',
          'user-initiated',
        ],
        steps: [
          'Locate the Settings section',
          'Find Server firmware start policy',
          'Select one of the following:',
          '  - Auto-start always',
          '  - Standby (User-initiated)',
          '  - Auto-start only',
          'Click "Save" to save your changes',
        ],
      },
      {
        id: 'view-power-settings',
        title: 'View Power Setting Descriptions',
        content:
          'Click "View power setting descriptions" to see detailed descriptions of each power setting.',
        keywords: ['view', 'descriptions', 'detailed', 'power settings'],
        steps: [
          'Scroll to the Settings section',
          'Click "View power setting descriptions"',
          'Review the detailed descriptions for each setting',
        ],
      },
      {
        id: 'network-settings',
        title: 'Network Settings',
        content:
          'Network settings is available only for Non HMC managed systems, is in PHYP standby and Default partition environment is IBM i or Default.',
        keywords: ['network', 'settings', 'HMC', 'PHYP', 'standby', 'IBM i'],
        steps: [
          'Ensure system is Non-HMC managed',
          'Verify system is in PHYP standby',
          'Confirm Default partition environment is IBM i or Default',
          'Access Network settings option',
        ],
        note: 'Network settings is only available for Non-HMC managed systems in PHYP standby with IBM i or Default partition environment.',
      },
    ],

    faqs: [
      {
        question: 'How do I power on the server?',
        answer:
          'Click the "Power on" button when the server status is Off. Wait for the power operation to complete.',
        keywords: ['power on', 'start', 'turn on'],
      },
      {
        question: 'How do I reboot the server?',
        answer:
          'Click the "Reboot" button, then click "Confirm" to restart the server.',
        keywords: ['reboot', 'restart'],
      },
      {
        question:
          'What is the difference between Orderly and Immediate shutdown?',
        answer:
          'Orderly shutdown allows the operating system to shut down gracefully before the server powers off. Immediate shutdown powers off the server without OS shutdown, which may cause data corruption.',
        keywords: ['orderly', 'immediate', 'shutdown', 'difference'],
      },
      {
        question: 'What does the Server power policy do?',
        answer:
          'Server power policy determines what happens when the last partition powers off. Power Off will shut down the server, Stay On keeps it running, and Automatic adjusts behavior based on partitioning.',
        keywords: ['power policy', 'partition', 'behavior'],
      },
      {
        question: 'When are Network settings available?',
        answer:
          'Network settings are only available for Non-HMC managed systems that are in PHYP standby with IBM i or Default partition environment.',
        keywords: ['network settings', 'available', 'HMC', 'PHYP'],
      },
      {
        question: 'What happens during a power operation?',
        answer:
          'While a power operation is in progress, no other power options are displayed. Once the operation completes, all power operations will be available again.',
        keywords: ['power operation', 'in progress', 'wait'],
      },
    ],

    quickActions: [
      {
        label: 'Power on server',
        description: 'Turn on the server',
        action: 'power-on',
      },
      {
        label: 'Reboot server',
        description: 'Restart the server',
        action: 'reboot-server',
      },
      {
        label: 'Shutdown server',
        description: 'Power off the server',
        action: 'shutdown-server',
      },
    ],

    tips: [
      'Use Orderly shutdown to ensure data integrity',
      'Check the Last chassis power operation to see when the server was last powered on or off',
      'Immediate shutdown should only be used when necessary as it may cause data corruption',
      'Review power setting descriptions before making changes',
      'Server power policy affects behavior when partitions power off',
    ],
  },
};

export default serverPowerOperationsSearchContent;
