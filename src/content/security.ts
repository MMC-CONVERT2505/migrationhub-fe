/**
 * The Security page, word for word from the document prepared by the MMC team (November 2026). It is only data: edit
 * the wording here, never in the page. Every figure and claim (certification, TLS version, 7 / 8 day schedule, quarterly
 * testing) comes from that document; change it only when the document changes.
 */
export const SECURITY_UPDATED = 'November 2026';

export const SECURITY_INTRO =
  'Your accounting data holds years of financial history. Migration Hub is built so that only the people who need it can reach it, it is encrypted wherever it travels or rests, and it is deleted on a set schedule. We are data migration experts, and we treat client data accordingly.';

export const SECURITY_BADGES = [
  'ISO/IEC 27001:2022 certified',
  'TLS 1.2 in transit',
  'Encrypted at rest',
  'Role-based access',
  'No sub-processors',
  'Automatic deletion',
] as const;

export interface DataStep {
  /** "Day 0" / "Day 7": shown as a marker beside the step; absent for steps that happen in between. */
  when?: string;
  title: string;
  text: string;
}

export const DATA_JOURNEY = {
  heading: 'What happens to your data, step by step',
  intro: 'Every migration follows the same path. Here it is in order, with nothing hidden.',
  steps: [
    {
      when: 'Day 0',
      title: 'Upload',
      text: 'You choose what to upload or connect. Transfers are encrypted with TLS 1.2 and land in a private AWS environment in the region nearest to you.',
    },
    {
      title: 'Conversion',
      text: 'Stored data is encrypted at rest. It is decrypted only for the time needed to run the conversion, and only staff and systems assigned to your job can reach it.',
    },
    {
      title: 'Quality check (optional)',
      text: 'If you request manual QA, our accountants check the converted data against your source before you sign off.',
    },
    {
      title: 'Job complete',
      text: 'We remove our access to your source systems.',
    },
    {
      when: 'Day 7',
      title: 'Deletion',
      text: 'If you requested manual QA, your data is kept for up to 7 days so the review can be completed. It is then deleted automatically on the eighth day after conversion.',
    },
  ] as DataStep[],
};

export type ProtectionIcon = 'cloud' | 'lock' | 'key' | 'shield' | 'scan' | 'bug' | 'backup' | 'alert';

export const PROTECTIONS = {
  heading: 'How we protect it',
  items: [
    {
      icon: 'cloud',
      title: 'Private cloud environment',
      text: 'Runs on Amazon Web Services inside a Virtual Private Cloud, with network access control lists restricting traffic.',
    },
    {
      icon: 'lock',
      title: 'Encryption',
      text: 'TLS 1.2 protects data in transit. Stored data is encrypted at rest.',
    },
    {
      icon: 'key',
      title: 'Least-privilege access',
      text: 'Role-based access control limits each person to what their role needs. Remote access to our internal network is through secure VPN only.',
    },
    {
      icon: 'shield',
      title: 'Strong credentials',
      text: 'Passwords must meet complexity rules, are rotated regularly, and accounts lock after repeated failed sign-ins.',
    },
    {
      icon: 'scan',
      title: 'Regular testing',
      text: 'Vulnerability scanning and penetration testing run every quarter. Patches are applied based on published vulnerabilities (CVEs).',
    },
    {
      icon: 'bug',
      title: 'Malware protection',
      text: 'Microsoft Defender runs on our systems with regularly updated definitions, and antivirus activity is logged.',
    },
    {
      icon: 'backup',
      title: 'Backup and recovery',
      text: 'S3 storage with versioning, plus documented backup, business continuity and disaster recovery procedures.',
    },
    {
      icon: 'alert',
      title: 'Incident response',
      text: 'A documented response plan and a dedicated security response team. Staff must report suspected incidents immediately.',
    },
  ] as Array<{ icon: ProtectionIcon; title: string; text: string }>,
};

export const CONTROL = {
  heading: 'You stay in control',
  intro: 'Migration Hub is a self-serve tool, so the decisions that matter are yours.',
  items: [
    'You decide how many historical years of data to upload or connect.',
    'You decide whether to request a manual quality check.',
    'We remove our access to your source systems when the job is done.',
    'Your data is deleted on a fixed schedule, not left to chance.',
  ],
};

export const CERTIFICATION = {
  heading: 'Certification and privacy',
  rows: [
    {
      term: 'ISO/IEC 27001:2022',
      text: 'MMC Convert’s Information Security Management System is certified for accounting, bookkeeping and data migration services.',
    },
    {
      term: 'Written policies',
      text: 'Our Information Security Policy covers access, networks, backups, physical security, vendors and incident response. Every employee, contractor and vendor must follow it.',
    },
    { term: 'Use of your data', text: 'Used only to deliver the migration you requested.' },
    { term: 'Sub-processors', text: 'We do not pass your data to sub-processors.' },
    {
      term: 'Records of processing',
      text: 'We maintain a record of our processing activities and keep our data protection and privacy policies up to date.',
    },
    { term: 'Data location', text: 'Stored in the AWS region nearest to the customer.' },
  ],
};

export const SECURITY_CONTACT = {
  heading: 'Have a security question?',
  text: 'Ask us about our policies, request documentation for a vendor review, or report a concern.',
};
