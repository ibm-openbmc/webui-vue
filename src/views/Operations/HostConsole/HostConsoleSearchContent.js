/**
 * Host Console Search Content
 * Provides searchable content for header search and help modal NLP integration
 */
export const hostConsoleSearchContent = {
  // Main description for header search
  description:
    'View and control the server console over the network, independent of the operating system. View the status of the server console and open it in a new tab for better accessibility.',

  // Feature descriptions for header search
  features: [
    'Serial port console access',
    'Terminal emulation',
    'Console output monitoring',
    'Server console interface',
    'Serial console redirection',
    'Command line interface access',
    'System console viewer',
    'Remote console access',
    'Console log viewer',
    'Text-based console',
    'Host system terminal',
    'Serial over LAN console',
  ],

  // Searchable keywords for header search
  keywords: [
    'SOL',
    'Serial over LAN',
    'terminal',
    'console',
    'serial',
    'output',
    'monitor',
    'viewer',
    'access',
    'remote',
    'interface',
    'command line',
    'shell',
    'CLI',
    'host',
    'server console',
    'system console',
    'serial port',
    'text console',
    'console log',
    'terminal emulator',
    'remote console',
    'console access',
    'serial console',
    'host console',
    'new tab',
    'new window',
    // Natural language variations
    'show console',
    'view console',
    'display console',
    'see console',
    'open console',
    'access console',
    'show host console',
    'view host console',
    'display host console',
    'open host console',
    'show server console',
    'view server console',
    'display server console',
    'open server console',
    'how to access console',
    'how to open console',
    'how to view console',
    'how to use console',
    'where is console',
    'find console',
    'terminal access',
    'command line access',
    'shell access',
    'remote access',
    'serial access',
    'console connection',
    'connect to console',
    'console status',
    'check console status',
    'is console connected',
    'console connected',
    'console disconnected',
    'open in new tab',
    'open in new window',
    'open separate window',
    'new tab console',
    'separate window console',
    'SOL console',
    'serial over LAN console',
    'text based console',
    'command line interface',
    'terminal interface',
    'serial interface',
    'remote terminal',
    'remote shell',
    'system terminal',
    'host terminal',
    'server terminal',
    'boot messages',
    'system logs',
    'console logs',
    'console output',
    'terminal output',
    'serial output',
    'troubleshoot console',
    'debug console',
    'console troubleshooting',
    'OS independent console',
    'independent console',
    'always available console',
    'boot console',
    'BIOS console',
    'UEFI console',
    'pre-boot console',
  ],

  // Related terms for header search
  relatedTerms: [
    'server management',
    'system administration',
    'remote management',
    'console management',
    'serial communication',
    'terminal session',
    'console session',
    'host management',
    'system monitoring',
    'console redirection',
    'Web socket',
    'network-based access',
    'OS-independent access',
  ],

  // Help content for Help Modal NLP integration
  help: {
    title: 'Host Console Help',
    overview:
      'You can view the status of the host console. Click Host console to view and control the server console over the network, independent of the operating system. You can view the Status of the server console and click Open in new tab to display the Status of the server console in a new window.',

    sections: [
      {
        id: 'accessing-console',
        title: 'Accessing Host Console',
        content:
          'Click Host console to view and control the server console over the network, independent of the operating system.',
        keywords: [
          'access',
          'host console',
          'view',
          'control',
          'server console',
          'network',
        ],
        steps: [
          'Navigate to the Host console page',
          'The console interface will load automatically',
          'View the server console output in real-time',
          'Type commands directly into the console',
        ],
        note: 'The host console operates independently of the operating system, providing access even when the OS is not responsive.',
      },
      {
        id: 'console-status',
        title: 'Viewing Console Status',
        content:
          'You can view the Status of the server console to check if the connection is active.',
        keywords: ['status', 'console status', 'connection', 'view status'],
        steps: [
          'Look at the Status indicator at the top of the console',
          'Check if the status shows "Connected" or "Disconnected"',
          'A green indicator means the console is connected',
          'A red indicator means the console is disconnected',
        ],
      },
      {
        id: 'open-new-tab',
        title: 'Opening Console in New Tab',
        content:
          'Click "Open in new tab" to display the Status of the server console in a new window for better accessibility and multitasking.',
        keywords: [
          'open',
          'new tab',
          'new window',
          'separate window',
          'open in new tab',
        ],
        steps: [
          'Locate the "Open in new tab" button',
          'Click the button to open the console in a new browser tab',
          'The new tab will display the full console interface',
          'You can now work with the console in a separate window',
        ],
        note: 'Opening in a new tab allows you to keep the console open while navigating other parts of the interface.',
      },
      {
        id: 'console-features',
        title: 'Console Features',
        content:
          'The host console provides Serial over LAN (SOL) access, allowing you to interact with the server as if you were physically connected to its serial port.',
        keywords: [
          'features',
          'SOL',
          'Serial over LAN',
          'serial port',
          'terminal',
          'command line',
        ],
        steps: [
          'Use the console for command-line access',
          'View boot messages and system logs',
          'Troubleshoot system issues',
          'Access the system when network is unavailable',
          'Perform system recovery operations',
        ],
      },
      {
        id: 'os-independent',
        title: 'Operating System Independence',
        content:
          'The host console operates independently of the operating system, providing access even when the OS is not running or responsive.',
        keywords: [
          'independent',
          'OS independent',
          'operating system',
          'network independent',
          'always available',
        ],
        steps: [
          'Access the console even if the OS has crashed',
          'View BIOS/UEFI messages during boot',
          'Troubleshoot boot failures',
          'Access the system before OS loads',
        ],
        note: 'This is particularly useful for troubleshooting boot issues or when the operating system is not responsive.',
      },
    ],

    faqs: [
      {
        question: 'How do I access the host console?',
        answer:
          'Navigate to the Host console page. The console interface will load automatically, allowing you to view and control the server console over the network.',
        keywords: ['access', 'how to access', 'open console'],
      },
      {
        question: 'How do I check if the console is connected?',
        answer:
          'Look at the Status indicator at the top of the console. A green indicator with "Connected" means the console is active, while a red indicator with "Disconnected" means it is not connected.',
        keywords: ['status', 'connected', 'disconnected', 'check connection'],
      },
      {
        question: 'How do I open the console in a new tab?',
        answer:
          'Click the "Open in new tab" button to display the console in a separate browser tab. This allows you to work with the console while navigating other parts of the interface.',
        keywords: ['new tab', 'open', 'separate window'],
      },
      {
        question: 'What is Serial over LAN (SOL)?',
        answer:
          "Serial over LAN (SOL) is a mechanism that allows you to access the server's serial console over the network. It provides command-line access as if you were physically connected to the serial port.",
        keywords: ['SOL', 'Serial over LAN', 'what is', 'serial'],
      },
      {
        question: 'Can I use the console when the OS is not running?',
        answer:
          'Yes, the host console operates independently of the operating system. You can access it even when the OS has crashed, during boot, or before the OS loads.',
        keywords: [
          'OS independent',
          'not running',
          'crashed',
          'boot',
          'independent',
        ],
      },
      {
        question: 'What can I do with the host console?',
        answer:
          'You can use the console for command-line access, view boot messages and system logs, troubleshoot system issues, access the system when network is unavailable, and perform system recovery operations.',
        keywords: ['features', 'what can I do', 'use cases', 'capabilities'],
      },
    ],

    quickActions: [
      {
        label: 'Open in new tab',
        description: 'Open console in separate window',
        action: 'open-new-tab',
      },
    ],

    tips: [
      'Use the host console for troubleshooting when the OS is not responsive',
      'Open the console in a new tab to keep it accessible while navigating other pages',
      'The console provides access even during system boot or when the network is down',
      'Check the Status indicator to verify the console connection',
      'Use Serial over LAN (SOL) for remote command-line access',
    ],
  },
};

export default hostConsoleSearchContent;
