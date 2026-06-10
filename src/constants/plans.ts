import type { Plan } from '@/types';

export const PLANS: Plan[] = [
  {
    name: 'Basic',
    history: 'Current Financial Year + 1 Historical Year',
    support: 'Email support',
    basePrice: 199,

    features: [
      '1 year history',
      'All data categories',
      'Email support',
      '2 revisions',
      'Reconciliation report',
    ],
  },
  {
    name: 'Standard',
    history: 'Current Financial Year + 3 Historical Years',
    support: 'Priority email + call',
    basePrice: 349,

    features: [
      '3 years history',
      'All data categories',
      'Payroll included',
      'Priority support',
      '5 revisions',
      'Reconciliation report',
      'Post-migration call',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    history: 'Inception to Date',
    support: 'Phone, chat + 30-day cover',
    basePrice: 599,

    features: [
      'Unlimited history',
      'All data categories',
      'Payroll + multi-currency',
      'Attachments',
      'Dedicated senior specialist',
      'Unlimited revisions',
      'Phone + chat support',
      '30-day post-migration support',
    ],
  },
];
