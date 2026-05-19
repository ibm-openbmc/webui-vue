export const policiesSearchContent = {
  // Main description
  description:
    'Configure security policies including BMC shell, Network IPMI, TPM, USB firmware update, and authentication settings',

  // Feature descriptions
  features: [
    'BMC shell (SSH) policy configuration',
    'Network IPMI (out-of-band) settings',
    'Host TPM and Virtual TPM management',
    'RTAD (Runtime Attestation) configuration',
    'USB firmware update policy',
    'Secure version lock-in settings',
    'Host USB enablement control',
    'Unauthenticated ACF upload policy',
    'Basic Authentication settings',
  ],

  // Searchable keywords
  keywords: [
    'policies',
    'security',
    'bmc shell',
    'ssh',
    'ipmi',
    'network ipmi',
    'tpm',
    'host tpm',
    'vtpm',
    'virtual tpm',
    'rtad',
    'runtime attestation',
    'usb firmware',
    'firmware update',
    'secure version',
    'svle',
    'host usb',
    'acf upload',
    'unauthenticated',
    'basic auth',
    'basic authentication',
    'security policies',
    'policy configuration',
    'access control',
  ],

  // Related terms
  relatedTerms: [
    'security configuration',
    'access policies',
    'authentication policies',
    'firmware policies',
    'system security',
    'policy management',
  ],

  // Help content
  help: {
    title: 'Policies',
    overview:
      'The Policies page allows you to enable or disable various security and system policies for your BMC and server. These policies control access methods, firmware update options, TPM settings, and authentication mechanisms. Configure these settings to meet your security requirements and operational needs.',
    sections: [
      {
        title: 'BMC Shell (via SSH)',
        content:
          'Enable or disable SSH access to the BMC shell. When enabled, administrators can connect to the BMC using SSH for command-line management. Disable this policy if SSH access is not required for your security posture.',
      },
      {
        title: 'Network IPMI (Out-of-Band IPMI)',
        content:
          'Control whether IPMI protocol is enabled for out-of-band management. IPMI provides remote management capabilities independent of the operating system. Note: Changes to this setting may take up to 30 seconds to apply.',
      },
      {
        title: 'TPM Policies',
        content:
          'Configure Trusted Platform Module settings:\n\n• Host TPM: Enable or disable the physical TPM on the host system for hardware-based security.\n\n• Virtual TPM (vTPM): Enable or disable virtual TPM functionality. This setting takes effect after the next system reboot.\n\nTPM provides hardware-based security features including secure key storage and cryptographic operations.',
      },
      {
        title: 'RTAD (Runtime Attestation)',
        content:
          'Enable or disable Runtime Attestation for system integrity verification. RTAD provides continuous monitoring and verification of system components during runtime. This setting takes effect after the next system reboot.',
      },
      {
        title: 'USB Firmware Update Policy',
        content:
          'Control whether firmware updates can be performed via USB devices. Enable this policy to allow firmware updates from USB media. Disable it to prevent USB-based firmware updates for enhanced security.',
      },
      {
        title: 'Secure Version Lock-In (SVLE)',
        content:
          'Enable or disable secure version lock-in to prevent firmware downgrades. When enabled, the system will only accept firmware versions equal to or newer than the current version, protecting against rollback attacks.',
      },
      {
        title: 'Host USB Enablement',
        content:
          'Control USB port functionality on the host system. Enable to allow USB devices to be used with the host. Disable to prevent USB device access for security purposes. This setting takes effect after the next system reboot.',
      },
      {
        title: 'Unauthenticated ACF Upload Enablement',
        content:
          'Control whether ACF (Access Control File) uploads are allowed without authentication. This setting is only visible to admin and service users.\n\nWarning: Enabling this policy reduces security by allowing unauthenticated file uploads. A confirmation dialog will appear when enabling this setting. Only enable if required for specific operational needs.',
      },
      {
        title: 'Basic Authentication',
        content:
          'Enable or disable Basic Authentication for API access. Basic Authentication uses username and password credentials encoded in HTTP headers. While convenient, it is less secure than token-based authentication. Consider your security requirements before enabling.',
      },
    ],
    faqs: [
      {
        question: 'What happens when I disable BMC Shell (SSH)?',
        answer:
          'When disabled, SSH access to the BMC will be blocked. Users will not be able to connect to the BMC command-line interface via SSH. Web interface and other management methods will remain available.',
      },
      {
        question: 'Why does Network IPMI take 30 seconds to apply?',
        answer:
          'Network IPMI changes require the network service to restart, which takes approximately 30 seconds. During this time, the BMC may be temporarily unresponsive to network requests.',
      },
      {
        question: 'What is the difference between Host TPM and Virtual TPM?',
        answer:
          'Host TPM is a physical hardware security module on the host system, while Virtual TPM (vTPM) is a software-based TPM implementation. Host TPM provides hardware-level security, while vTPM offers TPM functionality in virtualized environments.',
      },
      {
        question: 'When do vTPM, RTAD, and Host USB settings take effect?',
        answer:
          'These settings require a system reboot to take effect. The changes are saved immediately but will only be applied after the next system restart. An information icon indicates this requirement.',
      },
      {
        question: 'Should I enable Unauthenticated ACF Upload?',
        answer:
          'Generally, no. This setting should only be enabled for specific operational requirements. It reduces security by allowing file uploads without authentication. Always consider the security implications before enabling.',
      },
      {
        question: 'Can I enable multiple policies at once?',
        answer:
          'Yes, each policy can be enabled or disabled independently. Changes are applied immediately when you toggle each switch (except for settings requiring a reboot).',
      },
      {
        question: 'What is Secure Version Lock-In (SVLE)?',
        answer:
          'SVLE prevents firmware downgrades by only accepting firmware versions equal to or newer than the current version. This protects against rollback attacks where an attacker tries to install older, vulnerable firmware.',
      },
    ],
    quickActions: [
      {
        id: 'toggle-ssh',
        label: 'Toggle BMC Shell (SSH)',
        description: 'Enable or disable SSH access to BMC',
      },
      {
        id: 'toggle-ipmi',
        label: 'Toggle Network IPMI',
        description: 'Enable or disable IPMI protocol',
      },
      {
        id: 'toggle-basic-auth',
        label: 'Toggle Basic Authentication',
        description: 'Enable or disable Basic Auth for API access',
      },
    ],
    tips: [
      'Disable unused protocols and services to reduce the attack surface',
      'Settings with a clock icon require a system reboot to take effect',
      'Network IPMI changes may cause temporary network interruption (30 seconds)',
      'Only enable Unauthenticated ACF Upload if absolutely necessary for operations',
      'Use Secure Version Lock-In (SVLE) to prevent firmware rollback attacks',
    ],
  },
};

export default policiesSearchContent;
