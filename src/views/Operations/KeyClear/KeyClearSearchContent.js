export const keyClearSearchContent = {
  // Main description
  description:
    'Securely clear sensitive data and encryption keys on the system. This operation requires physical presence and a system reboot.',

  // Feature descriptions
  features: [
    'Clear all encryption keys',
    'Clear hypervisor system key',
    'Clear all and set genesis IPL',
    'Set factory default settings',
    'Physical presence requirement',
    'System reboot requirement',
  ],

  // Searchable keywords
  keywords: [
    'key',
    'clear',
    'security',
    'encryption',
    'credentials',
    'reset',
    'key clear',
    'clear keys',
    'security keys',
    'encryption keys',
    'hypervisor key',
    'system key',
    'genesis ipl',
    'factory default',
    'factory reset',
    'physical presence',
    'secure clear',
    'data clear',
  ],

  // Related terms
  relatedTerms: [
    'security management',
    'key management',
    'encryption management',
    'factory reset',
    'system reset',
    'security operations',
  ],

  // Help content
  help: {
    title: 'Key Clear',
    overview:
      'The Key Clear page allows you to securely clear sensitive data and encryption keys on the system. This is a critical security operation that requires physical presence verification and will trigger a system reboot. Use this feature when decommissioning hardware, transferring ownership, or resetting security credentials.',
    sections: [
      {
        title: 'Physical Presence Requirement',
        content:
          'Key clear operations require physical presence verification to prevent unauthorized remote clearing of encryption keys. This security measure ensures that only someone with physical access to the system can perform these sensitive operations. You must be physically present at the system to complete the key clear process.',
      },
      {
        title: 'System Reboot Requirement',
        content:
          'All key clear operations require a system reboot to take effect. The system will automatically reboot after the key clear operation is initiated. Ensure all critical workloads are stopped and data is saved before proceeding with a key clear operation.',
      },
      {
        title: 'None (No Key Clear)',
        content:
          'Select this option if you do not want to perform a key clear operation. This is the default setting and indicates that no key clearing is requested. The system will maintain all existing encryption keys and security credentials.',
      },
      {
        title: 'Clear All',
        content:
          "This option clears all encryption keys and sensitive data on the system. This includes:\n\n• All system encryption keys\n• Security credentials\n• Trusted Platform Module (TPM) data\n• All stored sensitive information\n\nUse this option when completely resetting the system's security state or preparing the system for transfer to another organization.",
      },
      {
        title: 'Clear Hypervisor System Key',
        content:
          'This option clears only the hypervisor system key while preserving other encryption keys and security data. The hypervisor system key is used to encrypt and protect hypervisor-specific data and configurations.\n\nUse this option when you need to reset hypervisor security without affecting other system keys.',
      },
      {
        title: 'Clear All and Set Genesis IPL',
        content:
          'This option is available only for service users. It clears all encryption keys and sets the system to Genesis IPL (Initial Program Load) mode. Genesis IPL is a special boot mode used for system recovery and low-level diagnostics.\n\nThis option is typically used during:\n• System recovery procedures\n• Low-level troubleshooting\n• Factory restoration processes',
      },
      {
        title: 'Set Factory Default',
        content:
          'This option is available only for service users. It resets the system to factory default settings, including:\n\n• All configuration settings\n• Encryption keys\n• Security policies\n• User data (in some cases)\n\nThis is the most comprehensive reset option and should only be used when returning the system to factory state or during major system recovery operations.',
      },
    ],
    faqs: [
      {
        question: 'Why is physical presence required for key clear operations?',
        answer:
          'Physical presence is a security requirement to prevent unauthorized remote clearing of encryption keys. This ensures that only someone with physical access to the system can perform these sensitive operations, protecting against remote attacks.',
      },
      {
        question: 'Will I lose all my data when I clear keys?',
        answer:
          'Clearing encryption keys will make encrypted data inaccessible. If data was encrypted with the keys being cleared, it cannot be recovered after the operation. Always backup important data before performing key clear operations.',
      },
      {
        question:
          'What is the difference between "Clear All" and "Set Factory Default"?',
        answer:
          '"Clear All" removes all encryption keys and sensitive data but maintains system configuration. "Set Factory Default" (service user only) resets the entire system to factory state, including configuration settings, policies, and keys.',
      },
      {
        question: 'Can I cancel a key clear operation after starting it?',
        answer:
          'Once confirmed, a key clear operation cannot be cancelled. The system will proceed with the operation and reboot. Always verify your selection before confirming the operation.',
      },
      {
        question: 'How long does a key clear operation take?',
        answer:
          'The key clear operation itself is quick, but the system reboot required afterward may take several minutes. Total time depends on system configuration and hardware, typically 5-15 minutes.',
      },
      {
        question: 'Why are some options only available to service users?',
        answer:
          'Options like "Clear All and Set Genesis IPL" and "Set Factory Default" are restricted to service users because they perform low-level system operations that could render the system inoperable if used incorrectly. These are intended for trained service personnel.',
      },
      {
        question: 'What should I do before performing a key clear?',
        answer:
          'Before performing a key clear: 1) Backup all important data, 2) Stop all critical workloads, 3) Document current system configuration, 4) Ensure you have physical access to the system, 5) Verify you have the correct recovery credentials for after the reboot.',
      },
    ],
    quickActions: [
      {
        id: 'select-clear-all',
        label: 'Select Clear All',
        description: 'Select the Clear All option',
      },
      {
        id: 'select-hypervisor-key',
        label: 'Select Clear Hypervisor Key',
        description: 'Select the Clear Hypervisor System Key option',
      },
    ],
    tips: [
      'Always backup important data before performing any key clear operation',
      'Ensure you have physical access to the system before starting',
      'Document your current system configuration for reference after the reset',
      'Key clear operations require a system reboot and cannot be cancelled once started',
      'Service-only options (Genesis IPL, Factory Default) should only be used by trained personnel',
    ],
  },
};

export default keyClearSearchContent;
