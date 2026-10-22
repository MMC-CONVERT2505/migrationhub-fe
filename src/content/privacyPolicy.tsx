import React from 'react';

/** Privacy policy text, kept as data so the page stays presentational and the structure is testable. */

export const PRIVACY_EMAIL = 'migrations@mmcconvert.com';
export const PRIVACY_EFFECTIVE = '1st Jan 2026';
export const PRIVACY_UPDATED = '22nd October 2026';

const Mail: React.FC = () => (
  <a href={`mailto:${PRIVACY_EMAIL}`} className="text-blue-600 hover:underline break-all">{PRIVACY_EMAIL}</a>
);

export type Block =
  | { type: 'p'; content: React.ReactNode; lead?: string; /** Clause number, e.g. "3.4" — shown in its own column. */ num?: string }
  | { type: 'list'; items: React.ReactNode[] }
  | { type: 'table'; caption: string; head: string[]; rows: React.ReactNode[][] };

export interface PolicySection {
  id: string;
  title: string;
  blocks: Block[];
}

export const GLANCE: PolicySection = {
  id: 'at-a-glance',
  title: 'Privacy at a glance',
  blocks: [
    {
      type: 'p',
      content:
        'Migration Hub moves your accounting data from one platform to another. To do that, we need temporary access to your financial records. This policy explains what we collect, why, how long we keep it, and how you stay in control.',
    },
    {
      type: 'table',
      caption: 'Privacy at a glance',
      head: ['Question', 'Short answer'],
      rows: [
        ['Who is responsible for your data?', 'MMC Convert, Indore, India'],
        ['What do we collect?', 'Account and contact details, the accounting data you ask us to migrate, connection tokens for your accounting platforms, payment records and basic usage data'],
        ['Do we sell your data?', 'No. Never'],
        ['Do we use your accounting data to train AI models or for advertising?', 'No'],
        ['How long do we keep your accounting data?', "Only as long as needed to complete the migration and the support window, then we delete it (7 days after completion, or the plan's post migration support period, unless you ask us to delete it sooner)"],
        ['Can you see, correct or delete your data?', <>Yes. Email <Mail /></>],
        ['Who do I contact with a complaint?', <>Email <Mail /></>],
      ],
    },
  ],
};

export const SECTIONS: PolicySection[] = [
  {
    id: 'who-we-are',
    title: '1. Who we are',
    blocks: [
      {
        type: 'p',
        content: <>Migration Hub (migrationhub.mmcconvert.com) is a service of M/s MMC Convert, a business registered in India (GSTIN [23BCAPM8108A1Z9]). In this policy, "MMC Convert", "we", "us" and "our" mean M/s MMC Convert.</>,
      },
      { type: 'p', lead: 'Registered office:', content: '163, RNT Marg, Indore, Madhya Pradesh [452001], India' },
      {
        type: 'p',
        content: "For the personal data described in this policy, MMC Convert is the Data Fiduciary under India's Digital Personal Data Protection Act, 2023 and the controller under the EU and UK General Data Protection Regulation.",
      },
      {
        type: 'p',
        content: 'When you ask us to migrate a business\'s accounting records, those records may contain personal data about other people, such as your customers, suppliers and employees. For that data, we act on your instructions as a processor (or Data Processor). Our Data Processing Agreement sets out those terms.',
      },
      {
        type: 'p',
        content: (
          <>
            This policy covers Migration Hub only. Other MMC Convert services at mmcconvert.com are covered by the{' '}
            <a href="https://www.mmcconvert.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">MMC Convert Privacy Policy</a>.
          </>
        ),
      },
    ],
  },
  {
    id: 'what-we-collect',
    title: '2. What we collect',
    blocks: [
      {
        type: 'p',
        content: 'We collect only what we need to run your migration, support you and meet our legal duties. We do not collect sensitive data such as health, biometric, religious or political information about you.',
      },
      {
        type: 'table',
        caption: 'Categories of data we collect',
        head: ['Category', 'Examples', 'Where it comes from'],
        rows: [
          ['Account details', 'First and last name, username, work email, password (stored hashed), mobile number, country', 'You, at sign up'],
          ['Migration details', 'Your name, email, phone, country, legal name of the entity being migrated, financial year end, chosen plan and add-ons', 'You, before each migration'],
          ['Accounting data', 'Chart of accounts, invoices, bills, bank transactions, contacts, payroll, attachments and other records in the source file or platform', 'Your source platform (for example MYOB, QuickBooks Online, Xero, Tally) or files you upload'],
          ['Connection tokens', 'OAuth access and refresh tokens that let us read from the source and write to the destination platform. We never see or store your platform passwords', 'The accounting platforms, when you authorise the connection'],
          ['Payment records', 'Plan purchased, amount, currency, invoice and payment status. Card or bank details are handled by our payment provider, not stored by us', 'You and our payment provider'],
          ['Communications', 'Messages through our contact form, email, chat or phone, and our replies', 'You'],
          ['Technical and usage data', 'IP address, browser and device type, pages visited, actions in the app, error logs, timestamps', 'Automatically, through server logs and [cookies or analytics tools]'],
        ],
      },
      { type: 'p', content: 'If you give us personal data about someone else (for example a colleague as a contact), please make sure they know you are sharing it.' },
    ],
  },
  {
    id: 'how-we-use',
    title: '3. How we use your data and why we are allowed to',
    blocks: [
      {
        type: 'p',
        content: 'We use your data only for the purposes below. If we ever want to use it for a new purpose, we will update this policy and, where the law requires, ask for your consent first.',
      },
      {
        type: 'table',
        caption: 'Purposes and legal bases',
        head: ['Purpose', 'Data used', 'Legal basis (GDPR)', 'Basis under India DPDP Act'],
        rows: [
          ['Create and secure your account, verify your email by OTP', 'Account details', 'Contract', 'Consent'],
          ['Scope, price and run your migration, including reconciliation reports and revisions', 'Migration details, accounting data, connection tokens', 'Contract', 'Consent'],
          ['Take payment and issue invoices', 'Payment records, account details', 'Contract, legal obligation', 'Consent; legal obligation'],
          ['Answer your questions and provide support', 'Communications, account details', 'Contract, legitimate interests', 'Consent'],
          ['Keep the service secure, prevent fraud and fix errors', 'Technical and usage data, logs', 'Legitimate interests', 'Legitimate use (s.7)'],
          ['Improve Migration Hub using aggregated statistics', 'Technical and usage data (not the content of your accounting data)', 'Legitimate interests', 'Consent'],
          ['Send product news and offers', 'Name, email', 'Consent (you can opt out at any time)', 'Consent'],
          ['Meet tax, accounting and legal requirements', 'Payment records, logs', 'Legal obligation', 'Legitimate use (s.7)'],
        ],
      },
      {
        type: 'p',
        lead: 'Automated decisions.',
        content: 'Migration Hub uses software to map and transfer records, and our specialists review mappings. We do not make decisions about you that have legal or similarly significant effects based solely on automated processing.',
      },
      {
        type: 'p',
        lead: 'Withdrawing consent.',
        content: <>Where we rely on consent, you can withdraw it as easily as you gave it, by emailing <Mail />. Withdrawal does not affect processing already done, but we may be unable to complete a migration that is in progress.</>,
      },
    ],
  },
  {
    id: 'accounting-data',
    title: '4. Your accounting data and connected platforms',
    blocks: [
      { type: 'p', content: 'Your financial records are the most sensitive thing you trust us with, so we hold ourselves to these commitments:' },
      {
        type: 'list',
        items: [
          <><strong>Least access.</strong> We request only the platform permissions (scopes) needed to read the source and write to the destination. You can see the permissions on the consent screen before you approve.</>,
          <><strong>No passwords.</strong> We connect through each platform's official authorisation (OAuth) or through files you upload. We never ask for or store your accounting platform login.</>,
          <><strong>Purpose limited.</strong> Accounting data is used only to perform, check and support your migration. We do not sell it, use it for advertising, or use it to train artificial intelligence or machine learning models.</>,
          <><strong>Human access only when needed.</strong> Our migration specialists access your data only to review mappings, resolve errors or answer your support requests, under confidentiality obligations.</>,
          <><strong>Your source stays untouched.</strong> We read from your source platform and do not change or delete records in it.</>,
          <><strong>Disconnect any time.</strong> Connections are revoked when your migration and support window close. You can also revoke access yourself in the platform's connected apps settings or ask us to do it.</>,
        ],
      },
      {
        type: 'p',
        content: 'Each accounting platform (for example Intuit, Xero, MYOB, Zoho, Tally, FreshBooks, Reckon, Prosaic) has its own privacy policy that governs the data it holds.',
      },
    ],
  },
  {
    id: 'sharing',
    title: '5. Who we share your data with',
    blocks: [
      { type: 'p', content: 'We do not sell or rent personal data. We share it only with the parties below, and only what each one needs.' },
      {
        type: 'table',
        caption: 'Recipients of personal data',
        head: ['Recipient', 'Why', 'Location'],
        rows: [
          ['Cloud hosting: [Amazon Web Services]', 'Store and process data securely', '[Region per customer country, e.g. Sydney, Mumbai, London, US]'],
          ['Payment provider: Razorpay', 'Take payments and prevent fraud', 'India'],
          ['Email and OTP delivery', 'Send verification codes, receipts and service emails', 'India'],
          ['Customer support and CRM tools', 'Manage enquiries and support tickets', 'India'],
          ['Analytics', 'Understand how the site is used, in aggregate', 'India'],
          ['The accounting platforms you connect', 'Read from your source and write to your destination, as you instruct', 'Per platform'],
          ['Professional advisers (lawyers, auditors)', 'Legal, tax and audit purposes', 'India'],
          ['Authorities and courts', 'Only when required by law or to protect rights and safety', 'As required'],
          ['A buyer or successor business', 'If MMC Convert is sold or merged; this policy will continue to apply', 'As applicable'],
        ],
      },
    ],
  },
  {
    id: 'transfers',
    title: '6. International transfers',
    blocks: [
      {
        type: 'p',
        content: 'MMC Convert is based in India and serves customers in Australia, New Zealand, the United Kingdom, the European Union, the United States, Canada, Singapore, the UAE, South Africa and India. Your data may therefore be processed outside the country where you live.',
      },
      {
        type: 'list',
        items: [
          <><strong>Where we store accounting data:</strong> [we store uploaded files and migration data in the cloud region closest to your country (for example AWS Sydney for Australian customers)]. Our team in India may access it remotely to run and support your migration.</>,
          <><strong>From the EU or UK:</strong> we use the European Commission's Standard Contractual Clauses (and the UK Addendum) with our service providers and between MMC Convert offices, plus additional security measures.</>,
          <><strong>From Australia:</strong> we take reasonable steps to make sure overseas recipients handle your information in line with the Australian Privacy Principles, and we remain accountable for it.</>,
          <><strong>From India:</strong> we transfer data only to countries not restricted by the Central Government under section 16 of the DPDP Act.</>,
        ],
      },
    ],
  },
  {
    id: 'retention',
    title: '7. How long we keep your data',
    blocks: [
      {
        type: 'p',
        content: 'We keep data only as long as we need it for the purposes above, then delete or anonymise it. Proposed periods are below; final figures to be confirmed by MMC Convert.',
      },
      {
        type: 'table',
        caption: 'Retention periods',
        head: ['Data', 'How long we keep it'],
        rows: [
          ['Accounting data and uploaded files', "Until the migration is complete plus the support window of 7 days, or the plan's post migration support period, then deleted from live systems."],
          ['Connection tokens', 'Revoked and deleted when the migration and support window end, or immediately if you disconnect'],
          ['Marketing preferences', 'Until you unsubscribe, then we keep only your email on a suppression list so we do not contact you again'],
        ],
      },
      {
        type: 'p',
        content: 'You can ask us to delete your data earlier (see section 9). We may keep some data longer if the law requires it or to handle a legal claim.',
      },
    ],
  },
  {
    id: 'security',
    title: '8. How we protect your data',
    blocks: [
      { type: 'p', content: 'We use technical and organisational safeguards suited to financial data, including:' },
      {
        type: 'list',
        items: [
          'Encryption in transit (TLS 1.2 or higher) and at rest ([AES-256])',
          'OAuth tokens stored encrypted, separate from accounting data',
          'Role based access with multi factor authentication for staff, and access logged and reviewed',
          'Separate storage per customer country, and regular backups',
          'Confidentiality agreements and privacy training for all staff',
          'Security testing and vulnerability management [at least annually]',
        ],
      },
      {
        type: 'p',
        content: 'No system is completely secure. If a personal data breach occurs, we will contain it, notify affected people without undue delay through their account or registered email, and notify regulators within the time the law requires (for example within 72 hours to the EU or UK supervisory authority, the Data Protection Board of India and, for eligible breaches, the Office of the Australian Information Commissioner).',
      },
      { type: 'p', content: 'Please keep your password private and use a strong, unique one.' },
    ],
  },
  {
    id: 'your-rights',
    title: '9. Your rights',
    blocks: [
      { type: 'p', content: 'Wherever you live, you can ask us to:' },
      {
        type: 'list',
        items: [
          'Access a copy of your personal data and information about how we use it',
          'Correct data that is wrong or incomplete',
          'Delete your data, unless we must keep it by law',
          'Withdraw consent or stop marketing at any time',
        ],
      },
    ],
  },
  {
    id: 'cookies-children-changes',
    title: '10. Cookies, children and changes',
    blocks: [
      { type: 'p', lead: 'Cookies.', content: 'We use strictly necessary cookies to keep you signed in and secure your session.' },
      {
        type: 'p',
        lead: 'Children.',
        content: 'Migration Hub is a business service for adults. We do not knowingly collect data from anyone under 18. If you believe a child has given us data, contact us and we will delete it.',
      },
      { type: 'p', lead: 'Links to other sites.', content: "Links to accounting platforms, Trustpilot or other sites are governed by those sites' own privacy policies." },
      {
        type: 'p',
        lead: 'Changes to this policy.',
        content: 'We will post any update on this page and change the "Last updated" date. If a change is significant, for example a new purpose for your data, we will tell you by email or in the app at least [14] days before it takes effect and, where required, ask for your consent. Previous versions are available on request.',
      },
    ],
  },
  {
    id: 'contact',
    title: '11. Contact us and Grievance Officer',
    blocks: [{ type: 'p', content: <>For any privacy question, request or complaint, contact us on <Mail />.</> }],
  },
];

/** Everything shown in the page's table of contents, in order. */
export const ALL_SECTIONS: PolicySection[] = [GLANCE, ...SECTIONS];
