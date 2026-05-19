export const sessionsSearchContent = {
  // Main description
  description:
    'View and manage active HMC and user sessions, disconnect sessions, and monitor user connections',

  // Help content
  help: {
    title: 'HMC and User Sessions',
    overview:
      'The Sessions page allows you to view and manage all active HMC (Hardware Management Console) and user sessions connected to the BMC. You can monitor connection details including Client ID, Username, and IP address for each session. The page provides the ability to disconnect sessions when needed, with important considerations for HMC sessions.',
    sections: [
      {
        title: 'Important HMC Warning',
        content:
          'Warning: If an HMC is attached and active, disconnecting it from this page is not effective, as the HMC will automatically attempt to reconnect. To correctly disconnect a working HMC, you must initiate the disconnect operation from the HMC interface itself. Disconnecting an HMC session from this page will only provide a temporary disconnection before the HMC reconnects automatically.',
      },
      {
        title: 'Viewing Session Information',
        content:
          'The sessions table displays all active connections to the BMC. For each session, you can view: 1) Client ID - A unique identifier for the session. 2) Username - The user account associated with the session. 3) IP Address - The network address from which the connection originated. This information helps you monitor who is currently connected to the system and from where.',
      },
      {
        title: 'Disconnecting a Single Session',
        content:
          'To disconnect an individual session: 1) Locate the session you want to disconnect in the table. 2) Click the "Disconnect" button in the Actions column for that session. 3) A confirmation dialog will appear. 4) Click "Disconnect" to confirm the operation or "Cancel" to exit without making changes. Note: This action cannot be reversed once completed. The user will be immediately logged out and will need to log in again to reconnect.',
      },
      {
        title: 'Disconnecting Multiple Sessions',
        content:
          'To disconnect multiple sessions at once: 1) Select the checkbox next to each session you want to disconnect. You can also use the header checkbox to select all sessions. 2) Click the "Disconnect" button in the batch actions toolbar that appears. 3) A confirmation dialog will show the number of sessions to be disconnected. 4) Click "Disconnect" to confirm or "Cancel" to exit. All selected sessions will be terminated simultaneously.',
      },
      {
        title: 'Search and Filter Sessions',
        content:
          'Use the search box to quickly find specific sessions by filtering the table based on Client ID, Username, or IP Address. Enter your search term and the table will automatically filter to show only matching sessions. Click the clear button (X) to remove the search filter and show all sessions again. The session count display shows how many sessions match your current filter.',
      },
      {
        title: 'Session Management Best Practices',
        content:
          'When managing sessions: 1) Verify the session details before disconnecting to ensure you are terminating the correct connection. 2) Be aware that disconnecting your own session will log you out. 3) For HMC sessions, use the HMC interface to properly disconnect rather than this page. 4) Disconnected users will need to log in again to reconnect. 5) Monitor active sessions regularly for security purposes. 6) Use batch disconnect carefully when terminating multiple sessions.',
      },
      {
        title: 'Understanding Session Types',
        content:
          'The sessions list may include different types of connections: 1) HMC Sessions - Hardware Management Console connections that manage the server. These will automatically reconnect if disconnected from this interface. 2) User Sessions - Individual user connections through the web interface or other management tools. 3) Service Sessions - Connections from automated tools or services. Each session type may behave differently when disconnected, with HMC sessions being the most persistent.',
      },
    ],
    faqs: [
      {
        question: 'Why does the HMC reconnect after I disconnect it?',
        answer:
          'HMC (Hardware Management Console) systems are designed to maintain persistent connections to managed servers. When you disconnect an HMC session from this page, the HMC automatically attempts to reconnect. To properly disconnect an HMC, you must initiate the disconnect operation from the HMC interface itself.',
      },
      {
        question: 'What happens when I disconnect a session?',
        answer:
          'When you disconnect a session, the user or system is immediately logged out and their connection is terminated. They will need to log in again to reconnect. This action cannot be reversed once completed.',
      },
      {
        question: 'Can I disconnect my own session?',
        answer:
          'Yes, you can disconnect your own session, but doing so will log you out immediately. You will need to log in again to access the system. Be careful when using batch disconnect to avoid accidentally terminating your own session.',
      },
      {
        question: 'How do I disconnect multiple sessions at once?',
        answer:
          'Select the checkboxes next to the sessions you want to disconnect, then click the "Disconnect" button in the batch actions toolbar. You can also use the header checkbox to select all sessions. Confirm the operation in the dialog that appears.',
      },
      {
        question: 'What information can I see about each session?',
        answer:
          'For each active session, you can view the Client ID (unique session identifier), Username (the logged-in user account), and IP Address (the network location of the connection). This information helps you identify and manage connections.',
      },
      {
        question: 'How do I find a specific session?',
        answer:
          'Use the search box at the top of the table to filter sessions by Client ID, Username, or IP Address. Enter your search term and the table will automatically show only matching sessions. The session count will update to show how many sessions match your filter.',
      },
      {
        question: 'Is disconnecting a session permanent?',
        answer:
          'Disconnecting a session terminates the current connection, but it does not prevent the user or system from logging in again. For HMC sessions, the system will automatically attempt to reconnect. For user sessions, the user can log in again manually.',
      },
    ],
    quickActions: [
      {
        label: 'Disconnect session',
        action: 'disconnect-session',
        description: 'Terminate a selected session',
      },
      {
        label: 'Search sessions',
        action: 'search-sessions',
        description: 'Filter sessions by Client ID, Username, or IP',
      },
    ],
    tips: [
      'For HMC sessions, always disconnect from the HMC interface, not from this page',
      'Verify session details before disconnecting to avoid terminating the wrong connection',
      'Use the search feature to quickly locate specific sessions',
      'Monitor active sessions regularly for security purposes',
      'Be careful not to disconnect your own session accidentally',
    ],
  },

  // Feature descriptions
  features: [
    'Active session viewing',
    'HMC session management',
    'User session management',
    'Session disconnection',
    'Connection monitoring',
    'Client ID tracking',
    'IP address monitoring',
    'Username tracking',
  ],

  // Searchable keywords
  keywords: [
    'sessions',
    'HMC',
    'user',
    'active',
    'disconnect',
    'connection',
    'client',
    'IP address',
    'username',
    'user sessions',
    'HMC sessions',
    'active sessions',
    'session management',
    'disconnect session',
    'client ID',
    'session monitoring',
  ],

  // Related terms
  relatedTerms: [
    'connection management',
    'user connections',
    'session control',
    'access management',
    'active connections',
    'user monitoring',
  ],
};

export default sessionsSearchContent;
