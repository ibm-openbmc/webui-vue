export const userManagementSearchContent = {
  // Main description
  description:
    'Manage local user accounts, create and delete users, modify user privileges, and configure account settings',

  // Help content
  help: {
    title: 'User Management',
    overview:
      'The User Management page allows you to manage local user accounts on the BMC. You can create and delete users, modify user privileges, configure account security settings including MFA TOTP authentication, and manage account policies such as login attempt limits and account lockout settings. The page displays user information including Username, Privilege level, Status, MFA bypass status, and Secret key information.',
    sections: [
      {
        title: 'MFA TOTP Authentication',
        content:
          'Multi-Factor Authentication (MFA) using Time-based One-Time Password (TOTP) provides an additional layer of security for user accounts. By default, MFA TOTP authentication is Disabled. To enable it, click the toggle switch to Enabled. Important: For HMC (Hardware Management Console) connections, an MFA-bypassed user account must be used, as HMC systems cannot provide TOTP codes. When MFA is enabled, users will need to provide a TOTP code in addition to their password when logging in.',
        keywords: [
          'MFA',
          'TOTP',
          'authentication',
          'two-factor',
          'HMC',
          'security',
        ],
      },
      {
        title: 'Viewing User Information',
        content:
          'The user table displays comprehensive information for each user account: 1) Username - The unique identifier for the user account. 2) Privilege - The access level assigned to the user (Administrator or ReadOnly). 3) Status - Whether the account is Enabled or Disabled. 4) MFA bypass - Indicates if the user is exempt from MFA requirements (important for HMC connections). 5) Secret key - The TOTP secret key used for MFA authentication. This information helps you monitor and manage all user accounts on the system.',
        keywords: [
          'view',
          'user',
          'username',
          'privilege',
          'status',
          'MFA bypass',
          'secret key',
        ],
      },
      {
        title: 'Account Policy Settings',
        content:
          'Click "Account policy settings" to configure security policies for user accounts. You can set: 1) Max failed login attempts - Enter a value between 0 and 65,535. If set to 0, the account is never locked regardless of failed attempts. 2) User unlock method - Choose "Manual" (requires administrator intervention) or "Automatic after timeout" (unlocks automatically after specified duration). Note: If Manual is selected, the Timeout duration field is disabled. 3) Timeout duration (seconds) - Specify how long an account remains locked before automatic unlock (only applicable for Automatic unlock method). Click "Save" to apply changes or "Cancel" to exit without saving.',
        keywords: [
          'policy',
          'settings',
          'failed login',
          'unlock',
          'timeout',
          'lockout',
        ],
      },
      {
        title: 'Adding a New User',
        content:
          'To create a new user account: 1) Click "Add user" button. 2) In the Add user dialog, select "Enabled" or "Disabled" for Account status. 3) Enter the username in the Username field. 4) Enter and confirm the password in the User password and Confirm user password fields. 5) Select the privilege level from the Privilege list: "Administrator" (full access) or "ReadOnly" (view-only access). 6) Click "Add user" to create the account or "Cancel" to exit. Upon successful creation, the message "Successfully added user." is displayed.',
        keywords: [
          'add',
          'create',
          'new user',
          'username',
          'password',
          'privilege',
        ],
      },
      {
        title: 'Editing User Details',
        content:
          'To modify an existing user account: 1) Click the Edit icon (pencil) next to the user you want to modify. 2) In the Edit user window, you can change: Account status (Enabled/Disabled), User password (enter new password and confirm), and Privilege level (Administrator/ReadOnly). 3) Click "Save" to apply changes or "Cancel" to exit without saving. The message "Successfully updated user." is displayed when changes are saved successfully. Note: You cannot change the username of an existing account.',
        keywords: [
          'edit',
          'modify',
          'update',
          'change',
          'password',
          'privilege',
        ],
      },
      {
        title: 'Deleting a User',
        content:
          'To remove a user account: 1) Click the Delete icon (trash can) next to the user you want to remove. 2) A confirmation dialog appears. Important: This action cannot be reversed once completed. The user account and all associated data will be permanently deleted. 3) Click "Delete user" to confirm the deletion or "Cancel" to exit without deleting. Be careful when deleting user accounts, especially administrator accounts, to ensure you maintain access to the system.',
        keywords: ['delete', 'remove', 'user', 'account', 'permanent'],
      },
      {
        title: 'Privilege Role Descriptions',
        content:
          'Click "View privilege role descriptions" to see detailed information about each privilege level: 1) Administrator - Full access to all BMC functions including user management, system configuration, and all operations. Can create, modify, and delete users. Can change all system settings. 2) ReadOnly - View-only access to BMC information. Cannot modify settings, create users, or perform operations. Useful for monitoring and auditing purposes. Choose the appropriate privilege level based on the user\'s responsibilities and required access level.',
        keywords: [
          'privilege',
          'role',
          'Administrator',
          'ReadOnly',
          'access',
          'permissions',
        ],
      },
      {
        title: 'Account Security Best Practices',
        content:
          "When managing user accounts: 1) Enable MFA TOTP authentication for enhanced security, except for HMC-connected accounts. 2) Use strong passwords that meet the system requirements. 3) Set appropriate failed login attempt limits to prevent brute force attacks. 4) Regularly review user accounts and remove unused accounts. 5) Assign the minimum privilege level necessary for each user's role. 6) For HMC connections, ensure at least one MFA-bypassed account exists. 7) Keep administrator accounts to a minimum. 8) Document user account purposes and owners for audit purposes.",
        keywords: [
          'best practices',
          'security',
          'MFA',
          'password',
          'brute force',
          'audit',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is MFA TOTP authentication and should I enable it?',
        answer:
          'MFA TOTP (Multi-Factor Authentication using Time-based One-Time Password) adds an extra security layer by requiring users to provide a time-based code in addition to their password. It is recommended to enable MFA for enhanced security. However, for HMC connections, you must use an MFA-bypassed account as HMC systems cannot provide TOTP codes.',
      },
      {
        question: 'What happens if I set max failed login attempts to 0?',
        answer:
          'Setting max failed login attempts to 0 means the account will never be locked, regardless of how many failed login attempts occur. This is not recommended for security reasons, as it allows unlimited login attempts which could be exploited by attackers.',
      },
      {
        question:
          'What is the difference between Administrator and ReadOnly privileges?',
        answer:
          "Administrator privilege provides full access to all BMC functions including user management, system configuration, and operations. ReadOnly privilege provides view-only access - users can see information but cannot modify settings, create users, or perform operations. Choose based on the user's role and required access level.",
      },
      {
        question: 'Can I change a username after creating the account?',
        answer:
          'No, usernames cannot be changed after an account is created. If you need to change a username, you must delete the old account and create a new one with the desired username. Make sure to document any privilege or configuration changes needed for the new account.',
      },
      {
        question: 'What is MFA bypass and when should I use it?',
        answer:
          'MFA bypass exempts a user account from Multi-Factor Authentication requirements. This is necessary for HMC (Hardware Management Console) connections because HMC systems cannot provide TOTP codes. At least one MFA-bypassed account should exist if you use HMC connections, but minimize the number of bypassed accounts for security.',
      },
      {
        question:
          'What is the difference between Manual and Automatic unlock methods?',
        answer:
          'Manual unlock requires an administrator to manually unlock a locked account. Automatic after timeout unlocks the account automatically after a specified duration. Manual provides more control but requires administrator intervention. Automatic is more convenient but may be less secure.',
      },
      {
        question: 'Can I delete my own user account?',
        answer:
          'While technically possible, deleting your own account will immediately log you out and you will lose access to the system. Always ensure at least one administrator account exists before deleting any administrator accounts. It is recommended to have another administrator delete accounts rather than self-deletion.',
      },
    ],
    quickActions: [
      {
        label: 'Add user',
        action: 'add-user',
        description: 'Create a new user account',
      },
      {
        label: 'Account policy settings',
        action: 'account-policy',
        description: 'Configure account security policies',
      },
      {
        label: 'View privilege descriptions',
        action: 'view-privileges',
        description: 'See detailed privilege level information',
      },
    ],
    tips: [
      'Enable MFA TOTP authentication for enhanced security (except for HMC accounts)',
      'Set max failed login attempts to a reasonable value (e.g., 3-5) to prevent brute force attacks',
      "Assign the minimum privilege level necessary for each user's role",
      'Regularly review and remove unused user accounts',
      'Ensure at least one MFA-bypassed account exists if using HMC connections',
    ],
  },

  // Feature descriptions
  features: [
    'User account management',
    'User creation and deletion',
    'User privilege modification',
    'Password management',
    'Account status management',
    'User role assignment',
    'Administrator privileges',
    'Operator privileges',
    'User privileges',
  ],

  // Searchable keywords
  keywords: [
    'user',
    'management',
    'account',
    'create',
    'delete',
    'modify',
    'privilege',
    'password',
    'role',
    'administrator',
    'operator',
    'user management',
    'user account',
    'local user',
    'user privileges',
    'account management',
    'user role',
    'user creation',
    'user deletion',
    'password change',
  ],

  // Related terms
  relatedTerms: [
    'access control',
    'account administration',
    'user administration',
    'privilege management',
    'role management',
    'account security',
  ],
};

export default userManagementSearchContent;
