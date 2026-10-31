import { CONTACT_EMAIL } from '@/constants/links';

/** Shown on /how-it-works and mirrored 1:1 in its FAQPage JSON-LD (markup must match visible content). */
export const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'Which accounting platforms does MigrationHub support?',
    a: 'MigrationHub offers migrations between QuickBooks Online, Xero, MYOB, FreshBooks, Tally, Zoho Books, Reckon and Prosaic. The Supported platforms page lists every migration we offer today, by source platform.',
  },
  {
    q: 'Does MigrationHub change or delete data in my source platform?',
    a: 'No. We read from your source platform and do not change or delete records in it. The migration writes new records to your destination platform only.',
  },
  {
    q: 'How much does a migration cost?',
    a: 'The price depends on the migration and on the country your business is registered in. You see the price for your country before you pay, and some migrations are free in certain countries.',
  },
  {
    q: 'How do I get help with a migration?',
    a: `Use the Contact page or email ${CONTACT_EMAIL}. Tell us which platforms you are moving between and we will reply with the next step.`,
  },
]; // TODO(confirm): every answer above against current policy and pricing
