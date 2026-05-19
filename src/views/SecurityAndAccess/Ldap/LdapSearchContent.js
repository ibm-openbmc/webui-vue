export const ldapSearchContent = {
  // Main description
  description:
    'Configure LDAP authentication, manage role groups, and set user privileges for directory services integration',

  // Help content
  help: {
    title: 'LDAP',
    overview:
      'The LDAP page allows you to configure LDAP (Lightweight Directory Access Protocol) authentication for centralized user management. You can integrate with directory services like OpenLDAP or Active Directory, enable secure LDAP using SSL certificates, and manage role groups with specific privileges. LDAP authentication enables users to log in using their directory service credentials instead of local BMC accounts.',
    sections: [
      {
        title: 'LDAP Authentication Settings',
        content:
          'By default, LDAP authentication is disabled. To enable it, select the "Enable" checkbox in the LDAP authentication section. Once enabled, you can configure various LDAP settings including service type, server URI, bind credentials, and certificate information. LDAP authentication allows users from your directory service to access the BMC using their existing credentials, providing centralized user management.',
        keywords: [
          'LDAP',
          'authentication',
          'enable',
          'disable',
          'settings',
          'configuration',
        ],
      },
      {
        title: 'Secure LDAP Using SSL',
        content:
          'Secure LDAP using SSL encrypts the communication between the BMC and the LDAP server, protecting credentials and data in transit. Important: A CA certificate and an LDAP certificate are required to enable secure LDAP. By default, Secure LDAP using SSL is disabled. Select "Enable" to activate it. The page displays the CA Certificate valid until and LDAP Certificate valid until dates, allowing you to monitor certificate expiration and renew them before they expire.',
        keywords: ['secure', 'SSL', 'certificate', 'CA', 'encryption', 'LDAPS'],
      },
      {
        title: 'Service Type Configuration',
        content:
          "Select the appropriate service type for your directory service: 1) OpenLDAP - For OpenLDAP directory servers. 2) Active Directory - For Microsoft Active Directory servers. The service type determines how the BMC communicates with your directory service and affects the authentication process. Choose the type that matches your organization's directory infrastructure.",
        keywords: [
          'service type',
          'OpenLDAP',
          'Active Directory',
          'directory',
          'AD',
        ],
      },
      {
        title: 'Server and Bind Configuration',
        content:
          'Configure the connection to your LDAP server: 1) Server URI - Enter the LDAP server address (e.g., ldap://server.example.com or ldaps://server.example.com for SSL). 2) Bind DN - Enter the bind distinguished name (DN) used to authenticate to the LDAP server (e.g., cn=admin,dc=example,dc=com). 3) Bind password - Enter the password for the bind DN account. 4) Base DN - Enter the base DN where user searches begin (e.g., ou=users,dc=example,dc=com). These settings establish the connection between the BMC and your LDAP server.',
        keywords: [
          'server',
          'URI',
          'bind',
          'DN',
          'password',
          'base DN',
          'connection',
        ],
      },
      {
        title: 'Optional LDAP Attributes',
        content:
          'Configure optional attributes to customize LDAP integration: 1) User ID attribute (optional) - Enter the LDAP attribute used as the user ID (e.g., uid, sAMAccountName). If not specified, the default attribute for your service type is used. 2) Group ID attribute (optional) - Enter the LDAP attribute used to identify groups (e.g., cn, groupName). This helps the BMC identify group memberships for role assignment. These optional fields allow you to adapt the LDAP integration to your directory schema.',
        keywords: [
          'attributes',
          'user ID',
          'group ID',
          'uid',
          'sAMAccountName',
          'optional',
        ],
      },
      {
        title: 'Role Groups Management',
        content:
          'Role groups map LDAP groups to BMC privileges, determining what users can do when they log in. The role groups table displays Group name and Group privilege for each configured group. Important: LDAP authentication must be enabled to modify role groups. To add a role group: 1) Click "Add role group". 2) Enter the LDAP group name (must match the group name in your directory). 3) Select the privilege level (Administrator, Operator, ReadOnly, or Callback). 4) Click "Add" to save or "Cancel" to exit. Users who are members of the LDAP group will receive the assigned privilege level when they log in.',
        keywords: [
          'role groups',
          'groups',
          'privileges',
          'add',
          'manage',
          'mapping',
        ],
      },
      {
        title: 'Privilege Levels',
        content:
          "Role groups can be assigned different privilege levels: 1) Administrator - Full access to all BMC functions including configuration and user management. 2) Operator - Can perform operations but cannot modify system configuration or manage users. 3) ReadOnly - View-only access to BMC information, cannot perform operations or modify settings. 4) Callback - Limited access for specific callback operations. Assign the minimum privilege level necessary for each group's responsibilities to maintain security.",
        keywords: [
          'privilege',
          'Administrator',
          'Operator',
          'ReadOnly',
          'Callback',
          'access',
        ],
      },
      {
        title: 'Saving LDAP Configuration',
        content:
          'After configuring LDAP settings, click "Save" to apply your changes. The system will validate the configuration and attempt to connect to the LDAP server. If successful, LDAP authentication will be enabled and users from your directory service can log in using their credentials. If there are errors, review your settings, especially the Server URI, Bind DN, Bind password, and Base DN. Ensure the LDAP server is accessible from the BMC and the bind credentials are correct.',
        keywords: [
          'save',
          'apply',
          'validate',
          'configuration',
          'connect',
          'test',
        ],
      },
    ],
    faqs: [
      {
        question: 'What certificates are required for secure LDAP?',
        answer:
          "To enable secure LDAP using SSL, you need two certificates: 1) A CA (Certificate Authority) certificate that validates the LDAP server's certificate. 2) An LDAP certificate for the LDAP server itself. Both certificates must be valid and not expired. You can upload these certificates in the Certificates page.",
      },
      {
        question:
          'What is the difference between OpenLDAP and Active Directory?',
        answer:
          "OpenLDAP is an open-source LDAP implementation commonly used in Linux/Unix environments. Active Directory is Microsoft's directory service used in Windows environments. The service type setting tells the BMC how to communicate with your specific directory service, as they have different schemas and authentication methods.",
      },
      {
        question: 'What is a Bind DN and why is it needed?',
        answer:
          'A Bind DN (Distinguished Name) is an account in your LDAP directory that the BMC uses to authenticate to the LDAP server and search for users. It needs sufficient permissions to search the directory and read user and group information. The bind password is the password for this account.',
      },
      {
        question: 'Can I use LDAP and local accounts at the same time?',
        answer:
          'Yes, when LDAP authentication is enabled, both LDAP users and local BMC accounts can log in. Local accounts continue to work even if LDAP is enabled, providing a fallback authentication method if the LDAP server is unavailable.',
      },
      {
        question: "Why can't I modify role groups?",
        answer:
          'Role groups can only be modified when LDAP authentication is enabled. If the "Add role group" button is disabled, check that you have enabled LDAP authentication in the settings section. You must also have Administrator privileges to manage role groups.',
      },
      {
        question: 'How do I know if my LDAP configuration is working?',
        answer:
          'After saving your LDAP configuration, try logging in with an LDAP user account. If the login succeeds, your LDAP configuration is working correctly. You can also check the BMC logs for LDAP authentication events. Ensure the user is a member of a role group that has been configured in the BMC.',
      },
      {
        question: 'What happens if my LDAP certificates expire?',
        answer:
          'If your CA certificate or LDAP certificate expires, secure LDAP will stop working and users will not be able to authenticate via LDAP. Monitor the certificate expiration dates displayed on the page and renew certificates before they expire. You can upload new certificates in the Certificates page.',
      },
    ],
    quickActions: [
      {
        label: 'Enable LDAP',
        action: 'enable-ldap',
        description: 'Activate LDAP authentication',
      },
      {
        label: 'Add role group',
        action: 'add-role-group',
        description: 'Create a new LDAP role group',
      },
      {
        label: 'Save settings',
        action: 'save-settings',
        description: 'Apply LDAP configuration changes',
      },
    ],
    tips: [
      'Ensure CA and LDAP certificates are valid before enabling secure LDAP',
      'Test LDAP configuration with a test user account before deploying to production',
      'Keep local administrator accounts active as a fallback if LDAP becomes unavailable',
      'Monitor certificate expiration dates and renew before they expire',
      'Assign the minimum privilege level necessary for each role group',
    ],
  },

  // Feature descriptions
  features: [
    'LDAP authentication configuration',
    'Enable and disable LDAP authentication',
    'Secure LDAP using SSL',
    'Open LDAP service type',
    'Active Directory service type',
    'Role group management',
    'Add new role groups',
    'Remove role groups',
    'Modify role group privileges',
    'Administrator privilege assignment',
    'Operator privilege assignment',
    'User privilege assignment',
    'Callback privilege assignment',
    'Certificate authority integration',
    'LDAP certificate management',
    'Directory services authentication',
  ],

  // Searchable keywords
  keywords: [
    'LDAP',
    'authentication',
    'directory',
    'Active Directory',
    'Open LDAP',
    'SSL',
    'secure',
    'certificate',
    'CA',
    'certificate authority',
    'role group',
    'role groups',
    'privilege',
    'privileges',
    'administrator',
    'operator',
    'user',
    'callback',
    'enable LDAP',
    'disable LDAP',
    'LDAP authentication',
    'secure LDAP',
    'LDAP SSL',
    'LDAP certificate',
    'service type',
    'directory service',
    'directory services',
    'add role group',
    'remove role group',
    'modify role group',
    'edit role group',
    'group management',
    'user management',
    'access control',
    'authentication service',
    'LDAP server',
    'LDAP configuration',
    'LDAP settings',
    'group privileges',
    'user privileges',
    'admin privileges',
    'operator privileges',
    'LDAP integration',
    'directory integration',
  ],

  // Related terms
  relatedTerms: [
    'user authentication',
    'access management',
    'identity management',
    'directory server',
    'authentication server',
    'security configuration',
    'user access',
    'group permissions',
    'role-based access',
    'RBAC',
    'single sign-on',
    'SSO',
    'domain authentication',
    'enterprise authentication',
    'centralized authentication',
    'user directory',
    'organizational units',
    'LDAP bind',
    'LDAP search',
    'LDAP query',
  ],
};

export default ldapSearchContent;
