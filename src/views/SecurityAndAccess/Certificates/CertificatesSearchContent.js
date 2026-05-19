export const certificatesSearchContent = {
  // Main description
  description:
    'Manage SSL/TLS certificates, upload certificates, generate CSR, and configure HTTPS, LDAP, and CA certificates',

  // Help content
  help: {
    title: 'Certificates',
    overview:
      'The Certificates page allows you to manage SSL/TLS certificates for secure communication with the BMC. You can view certificate details including issuer, validity dates, generate Certificate Signing Requests (CSR), upload new certificates, replace existing certificates, and delete certificates. The page displays certificates for HTTPS, LDAP, CA (Certificate Authority), BMC shell ACF, and Resource Dump ACF.',
    sections: [
      {
        title: 'Viewing Certificate Information',
        content:
          'The certificates table displays comprehensive information for each certificate: 1) Certificate - The certificate type (HTTPS, LDAP, CA, etc.). 2) Issued by - The organization or authority that issued the certificate. 3) Issued to - The entity the certificate was issued to. 4) Valid from - The date when the certificate becomes valid. 5) Valid until - The expiration date of the certificate. Monitor the "Valid until" dates to ensure certificates are renewed before expiration. Expired certificates will prevent secure connections.',
      },
      {
        title: 'Generating a Certificate Signing Request (CSR)',
        content:
          'To generate a CSR: 1) Click "Generate CSR" button. 2) Select Certificate type: HTTPS Certificate or LDAP Certificate. 3) Select Country/Region from the list. 4) Select Private key type: EC (Elliptic Curve) or RSA. 5) Enter State, City, Company name, and Company unit. 6) Enter Common name (typically the server hostname or domain). 7) Optionally enter Contact person, Email address, and Alternate name (you can add multiple alternate names separated by space). 8) Click "Generate CSR" to create the request or "Cancel" to exit. The message "Successfully generated CSR." is displayed. You can then submit the CSR to a Certificate Authority to obtain a signed certificate.',
      },
      {
        title: 'Adding a New Certificate',
        content:
          'To add a new certificate: 1) Click "Add new certificate" button. Important: BMC shell and Resource Dump ACF certificates are not listed in the table. The system must be powered on to upload a Resource Dump ACF certificate. 2) Select Certificate type from the list: CA Certificate, BMC shell ACF certificate, or Resource dump ACF certificate. 3) Click "Add file" to browse and select the certificate file from your computer. 4) Click "Add" to upload the certificate or "Cancel" to exit. The message "Successfully added certificate." is displayed when the upload completes successfully.',
      },
      {
        title: 'Replacing an Existing Certificate',
        content:
          'To replace a certificate: 1) Click the Replace icon (refresh/replace symbol) next to the certificate you want to replace. 2) In the Replace certificate dialog, click "Add file" to select the new certificate file. 3) Click "Replace" to upload and replace the certificate or "Cancel" to exit without changes. The message "Successfully added certificate." is displayed. Replacing a certificate updates it with a new version, typically when renewing an expiring certificate or updating to a certificate with different properties.',
      },
      {
        title: 'Deleting a Certificate',
        content:
          'To delete a certificate: 1) Click the Delete icon (trash can) next to the certificate you want to remove. 2) A confirmation dialog appears. 3) Click "Delete" to confirm the deletion or "Cancel" to exit without deleting. The message "Successfully deleted certificate." is displayed. Important: Deleting certain certificates (like HTTPS or LDAP certificates) may affect system functionality. Only delete certificates if you plan to replace them or no longer need the associated functionality.',
      },
      {
        title: 'Certificate Types',
        content:
          'Different certificate types serve different purposes: 1) HTTPS Certificate - Secures web interface connections. Required for secure browser access to the BMC. 2) LDAP Certificate - Used for secure LDAP authentication when Secure LDAP is enabled. 3) CA Certificate - Certificate Authority certificate used to validate other certificates, particularly for LDAP. 4) BMC shell ACF certificate - Access Control File certificate for BMC shell access. 5) Resource Dump ACF certificate - Access Control File certificate for resource dump operations (requires system to be powered on for upload).',
      },
      {
        title: 'Certificate Expiration Monitoring',
        content:
          'The page displays alerts for certificate status: 1) Expired certificates - Red/danger alert indicating one or more certificates have expired. Expired certificates prevent secure connections and must be replaced immediately. 2) Expiring certificates - Yellow/warning alert indicating certificates are approaching expiration. Plan to renew these certificates before they expire. 3) Valid certificates - No alert displayed. Regular monitoring of certificate expiration dates is essential for maintaining secure, uninterrupted access to the BMC.',
      },
      {
        title: 'Certificate Best Practices',
        content:
          'When managing certificates: 1) Monitor expiration dates regularly and renew certificates before they expire. 2) Use strong private key types (RSA 2048-bit or higher, or EC). 3) Keep certificate files secure and backed up. 4) Use certificates from trusted Certificate Authorities for production systems. 5) Include appropriate alternate names (SANs) in certificates for all hostnames/IPs used to access the BMC. 6) Test new certificates in a non-production environment before deploying. 7) Document certificate renewal procedures and schedules. 8) Ensure the system is powered on before uploading Resource Dump ACF certificates.',
      },
    ],
    faqs: [
      {
        question: 'What is a Certificate Signing Request (CSR)?',
        answer:
          'A CSR is a request sent to a Certificate Authority (CA) to obtain a signed certificate. It contains information about your organization and the public key. The CA validates the information and issues a signed certificate that you can then upload to the BMC.',
      },
      {
        question: 'What is the difference between EC and RSA private keys?',
        answer:
          'EC (Elliptic Curve) and RSA are different cryptographic algorithms. EC keys are generally smaller and faster while providing equivalent security. RSA is more widely supported. For modern systems, EC is recommended, but RSA is a safe choice for maximum compatibility.',
      },
      {
        question: "Why can't I upload a Resource Dump ACF certificate?",
        answer:
          'Resource Dump ACF certificates can only be uploaded when the system is powered on. If the system is off or in standby, you must power it on before you can upload this certificate type. Other certificate types can be uploaded regardless of system power state.',
      },
      {
        question: 'What happens if my HTTPS certificate expires?',
        answer:
          'If the HTTPS certificate expires, browsers will display security warnings when accessing the BMC web interface. Users may not be able to connect securely. You should replace the expired certificate immediately with a valid one to restore secure access.',
      },
      {
        question: 'Can I use self-signed certificates?',
        answer:
          'Yes, you can use self-signed certificates, but browsers will display security warnings because the certificate is not issued by a trusted Certificate Authority. For production environments, certificates from trusted CAs are recommended. Self-signed certificates are acceptable for testing or isolated environments.',
      },
      {
        question: 'What are alternate names in a certificate?',
        answer:
          'Alternate names (Subject Alternative Names or SANs) are additional hostnames or IP addresses that the certificate is valid for. If users access the BMC using different hostnames or IP addresses, include all of them as alternate names to avoid certificate warnings. Separate multiple names with spaces.',
      },
      {
        question: 'How do I know which certificates are about to expire?',
        answer:
          'The page displays warning alerts for certificates approaching expiration. Check the "Valid until" column in the certificates table to see exact expiration dates. Plan to renew certificates well before they expire to avoid service interruptions.',
      },
    ],
    quickActions: [
      {
        label: 'Generate CSR',
        action: 'generate-csr',
        description: 'Create a Certificate Signing Request',
      },
      {
        label: 'Add certificate',
        action: 'add-certificate',
        description: 'Upload a new certificate',
      },
    ],
    tips: [
      'Monitor certificate expiration dates and renew before they expire',
      'Include all hostnames and IP addresses as alternate names in certificates',
      'Keep certificate files and private keys secure and backed up',
      'Use certificates from trusted Certificate Authorities for production systems',
      'Ensure the system is powered on before uploading Resource Dump ACF certificates',
    ],
  },

  // Feature descriptions
  features: [
    'Certificate management',
    'HTTPS certificate upload',
    'LDAP certificate upload',
    'CA certificate management',
    'CSR generation',
    'Certificate replacement',
    'Certificate deletion',
    'Certificate expiration monitoring',
    'SSL/TLS configuration',
  ],

  // Searchable keywords
  keywords: [
    'certificate',
    'certificates',
    'SSL',
    'TLS',
    'HTTPS',
    'LDAP',
    'CA',
    'CSR',
    'upload',
    'generate',
    'replace',
    'delete',
    'expiration',
    'HTTPS certificate',
    'LDAP certificate',
    'CA certificate',
    'certificate authority',
    'certificate signing request',
    'SSL certificate',
    'TLS certificate',
    'certificate management',
    'certificate upload',
    'generate CSR',
  ],

  // Related terms
  relatedTerms: [
    'security certificates',
    'encryption',
    'secure communication',
    'certificate validation',
    'public key',
    'private key',
    'certificate chain',
  ],
};

export default certificatesSearchContent;
