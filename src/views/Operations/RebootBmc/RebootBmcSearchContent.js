export const rebootBmcSearchContent = {
  // Main description
  description:
    'Reboot the Baseboard Management Controller (BMC) on a server. The Reboot BMC window displays the Last BMC reboot information. When you reboot the BMC, your web browser loses contact with the BMC for several minutes. When the BMC is back online, you may need to log in again.',

  // Help content
  help: {
    title: 'Reboot BMC',
    overview:
      'The Reboot BMC page allows you to restart the Baseboard Management Controller (BMC) on your server. This operation is useful for applying certain configuration changes, recovering from issues, or performing maintenance. The page displays information about the last BMC reboot and provides a safe way to restart the BMC with proper warnings about the temporary loss of connectivity.',
    sections: [
      {
        title: 'Last BMC Reboot Information',
        content:
          'The page displays the timestamp of the last BMC reboot. This information helps you track when the BMC was last restarted, which is useful for troubleshooting, maintenance records, and understanding system uptime. The last reboot time is shown in your local timezone for easy reference.',
      },
      {
        title: 'Rebooting the BMC',
        content:
          "To reboot the BMC, click the 'Reboot BMC' button. This will open a confirmation dialog to ensure you want to proceed with the reboot. Important: When you reboot the BMC, your web browser will lose contact with the BMC for several minutes while it restarts. The BMC controls the management interface, so all web UI functionality will be unavailable during this time.",
      },
      {
        title: 'Confirmation Process',
        content:
          "When you click 'Reboot BMC', a confirmation dialog appears to prevent accidental reboots. Review the warning message carefully. Click 'Confirm' to proceed with the BMC reboot, or click 'Cancel' to exit without making any changes. Once you confirm, the BMC will immediately begin the reboot process.",
      },
      {
        title: 'What Happens During Reboot',
        content:
          'During the BMC reboot process: 1) The BMC immediately begins shutting down its services. 2) Your web browser loses contact with the BMC. 3) The web interface becomes unresponsive and may show connection errors. 4) The BMC restarts its firmware and services. 5) This process typically takes several minutes. 6) The server itself continues running normally; only the BMC management interface is affected.',
      },
      {
        title: 'After the Reboot',
        content:
          "When the BMC is back online after the reboot: 1) The web interface will become accessible again. 2) You may need to log in again as your session may have expired. 3) All BMC services will be restored. 4) You can verify the reboot by checking the 'Last BMC reboot' timestamp, which will show the recent reboot time. 5) Any configuration changes that required a BMC reboot will now be active.",
      },
      {
        title: 'When to Reboot the BMC',
        content:
          'You should reboot the BMC when: 1) Applying certain configuration changes that require a BMC restart. 2) Troubleshooting BMC-related issues or unresponsive management interface. 3) After firmware updates that require a BMC reboot. 4) When instructed by support personnel. 5) As part of scheduled maintenance procedures. Note: The server itself does not need to be powered off to reboot the BMC.',
      },
      {
        title: 'Important Warnings',
        content:
          'Before rebooting the BMC, be aware that: 1) You will lose access to the web interface for several minutes. 2) Any ongoing operations in the web UI will be interrupted. 3) Remote console sessions (KVM, SOL) will be disconnected. 4) You may need to log in again after the BMC comes back online. 5) Plan BMC reboots during maintenance windows when possible. 6) The server continues running, but you cannot manage it via BMC during the reboot.',
      },
    ],
    faqs: [
      {
        question: 'What is the BMC and why would I reboot it?',
        answer:
          'The BMC (Baseboard Management Controller) is a specialized processor that manages the server hardware independently of the operating system. You might reboot it to apply configuration changes, troubleshoot issues, complete firmware updates, or recover from an unresponsive management interface.',
      },
      {
        question: 'Will rebooting the BMC affect my running server?',
        answer:
          "No, rebooting the BMC does not affect the server's operation. The server and its operating system continue running normally. Only the management interface (web UI, remote console, etc.) becomes temporarily unavailable during the BMC reboot.",
      },
      {
        question: 'How long does a BMC reboot take?',
        answer:
          'A BMC reboot typically takes several minutes, usually between 2-5 minutes. During this time, the web interface will be unresponsive. The exact time can vary depending on your system model and configuration.',
      },
      {
        question: 'What happens to my web browser during the reboot?',
        answer:
          'Your web browser will lose contact with the BMC during the reboot. You may see connection errors or timeout messages. Once the BMC is back online, you can refresh the page and log in again to resume using the web interface.',
      },
      {
        question: 'Do I need to log in again after the BMC reboots?',
        answer:
          'Yes, in most cases you will need to log in again after the BMC reboots. Your session will likely expire during the reboot process, so be prepared to enter your credentials again when the BMC comes back online.',
      },
      {
        question: 'Can I cancel a BMC reboot after confirming it?',
        answer:
          "No, once you click 'Confirm' in the reboot dialog, the BMC immediately begins the reboot process and cannot be cancelled. This is why it's important to carefully consider the timing before confirming a BMC reboot.",
      },
      {
        question: 'How can I tell when the BMC is back online?',
        answer:
          "You can try refreshing your web browser periodically. When the BMC is back online, the login page will load successfully. You can also check the 'Last BMC reboot' timestamp after logging in to verify the reboot completed.",
      },
    ],
    quickActions: [
      {
        label: 'Reboot BMC',
        action: 'reboot-bmc',
        description: 'Restart the BMC controller',
      },
    ],
    tips: [
      'Plan BMC reboots during maintenance windows to minimize disruption',
      'Save any work in the web interface before rebooting the BMC',
      'The server continues running normally during a BMC reboot',
      'Check the last reboot timestamp to verify when the BMC was last restarted',
      'Be prepared to log in again after the BMC comes back online',
    ],
  },

  // Feature descriptions
  features: [
    'BMC reboot functionality',
    'Restart BMC controller',
    'View last BMC reboot time',
    'BMC restart confirmation',
    'System dump protection during reboot',
    'BMC connection management',
    'Web browser reconnection after reboot',
    'BMC online status monitoring',
    'Automatic login prompt after reboot',
    'BMC service restart',
    'Controller reset operation',
    'BMC power cycle',
    'Reboot BMC on server',
    'Last BMC reboot information display',
    'Web browser loses contact during reboot',
    'BMC back online notification',
    'Re-login after BMC reboot',
    'Click Reboot BMC to restart',
    'Confirm to restart BMC',
    'Cancel BMC reboot operation',
  ],

  // Searchable keywords
  keywords: [
    'reboot',
    'BMC',
    'restart',
    'reset',
    'controller',
    'baseboard',
    'management controller',
    'reboot BMC',
    'restart BMC',
    'reset BMC',
    'BMC reboot',
    'BMC restart',
    'BMC reset',
    'last reboot',
    'reboot time',
    'BMC online',
    'BMC offline',
    'web browser',
    'connection',
    'reconnect',
    'login',
    'system dump',
    'dump offload',
    'confirm reboot',
    'BMC service',
    'controller restart',
    'power cycle',
    'BMC power',
    'service restart',
    'management controller reboot',
    'baseboard controller',
    'BMC maintenance',
    'controller maintenance',
    'reboot BMC on server',
    'last BMC reboot information',
    'loses contact',
    'browser loses contact',
    'BMC back online',
    'log in again',
    're-login',
    'click reboot BMC',
    'click confirm',
    'cancel reboot',
    'several minutes',
    'BMC window',
    'reboot information',
    'restart the BMC',
    'exit window',
  ],

  // Related terms
  relatedTerms: [
    'system restart',
    'controller reset',
    'service recovery',
    'BMC recovery',
    'management interface',
    'remote management',
    'out-of-band management',
    'IPMI restart',
    'controller refresh',
    'system maintenance',
    'BMC maintenance',
    'service interruption',
    'connection loss',
    'session timeout',
    'automatic reconnection',
    're-authentication',
    'login required',
    'BMC availability',
    'controller availability',
    'service downtime',
    'server BMC',
    'BMC contact lost',
    'browser disconnection',
    'temporary unavailability',
    'BMC recovery time',
    'reboot confirmation dialog',
    'cancel operation',
    'confirm restart',
    'BMC status window',
    'last reboot timestamp',
  ],
};

export default rebootBmcSearchContent;
