import type { Plan } from '@/types';

export const PLANS: Plan[] = [
  {
    name: 'Basic',
    history: '1 year',
    support: 'Email support',
    basePrice: 389,
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
    history: '3 years',
    support: 'Priority email + call',
    basePrice: 649,
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
    history: 'Unlimited',
    support: 'Phone, chat + 30-day cover',
    basePrice: 999,
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

export const GST_RATE = 0.1;
