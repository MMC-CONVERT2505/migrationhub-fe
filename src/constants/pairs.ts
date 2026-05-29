import type { Pair } from '@/types';

/**
 * Migration pairs configuration.
 *
 * url     – direct-access URL for FREE pairs. PairCard opens this straight away.
 * toolUrl – the external microservice tool for this pair. After payment, the user
 *           is redirected here. Set to null to fall back to the internal wizard.
 *
 * When deploying a new microservice tool, add its URL to toolUrl.
 */
export const PAIRS: Pair[] = [
  {
    src: 'QBO',
    dst: 'Xero',
    srcColor: '#2CA01C',
    dstColor: '#13B5EA',
    srcAbbr: 'QB',
    dstAbbr: 'XE',
    count: '3,200+',
    status: 'paid',
    url: null,
    toolUrl: null, // TODO: add deployed microservice URL e.g. 'https://tools.mmcconvert.com/qbo-xero'
  },
  {
    src: 'QBO',
    dst: 'FreshBooks',
    srcColor: '#2CA01C',
    dstColor: '#1E7FC3',
    srcAbbr: 'QB',
    dstAbbr: 'FB',
    count: '890+',
    status: 'paid',
    url: null,
    toolUrl: null, // TODO: add deployed microservice URL
  },
  {
    src: 'Xero',
    dst: 'MYOB',
    srcColor: '#13B5EA',
    dstColor: '#9B1C1C',
    srcAbbr: 'XE',
    dstAbbr: 'MY',
    count: '1,100+',
    status: 'free',
    url: 'https://v0-xero-to-wafeq.vercel.app/',
    toolUrl: 'https://v0-xero-to-wafeq.vercel.app/', // same tool — free access
  },
  {
    src: 'Xero',
    dst: 'Prosaic',
    srcColor: '#13B5EA',
    dstColor: '#5B21B6',
    srcAbbr: 'XE',
    dstAbbr: 'PR',
    count: '420+',
    status: 'free',
    url: null,
    toolUrl: null, // TODO: add deployed microservice URL
  },
  {
    src: 'Xero',
    dst: 'QBO',
    srcColor: '#13B5EA',
    dstColor: '#2CA01C',
    srcAbbr: 'XE',
    dstAbbr: 'QB',
    count: '4,500+',
    status: 'region',
    url: 'https://v0-xero-naqood.vercel.app/',
    toolUrl: 'https://v0-xero-naqood.vercel.app/', // same tool — region-based access
  },
  {
    src: 'Tally',
    dst: 'ZOHO',
    srcColor: '#EA580C',
    dstColor: '#B91C1C',
    srcAbbr: 'TA',
    dstAbbr: 'ZO',
    count: '760+',
    status: 'paid',
    url: null,
    toolUrl: null, // TODO: add deployed microservice URL
  },
  {
    src: 'QBO',
    dst: 'MYOB',
    srcColor: '#2CA01C',
    dstColor: '#9B1C1C',
    srcAbbr: 'QB',
    dstAbbr: 'MY',
    count: '640+',
    status: 'free',
    url: 'https://v0-qbo-to-zoho-books.vercel.app/',
    toolUrl: 'https://v0-qbo-to-zoho-books.vercel.app/', // same tool — free access
  },
  {
    src: 'Xero',
    dst: 'Reckon',
    srcColor: '#13B5EA',
    dstColor: '#1D4ED8',
    srcAbbr: 'XE',
    dstAbbr: 'RK',
    count: '310+',
    status: 'free',
    url: null,
    toolUrl: null, // TODO: add deployed microservice URL
  },
  {
    src: 'MYOB',
    dst: 'QBO',
    srcColor: '#9B1C1C',
    dstColor: '#2CA01C',
    srcAbbr: 'MY',
    dstAbbr: 'QB',
    count: '980+',
    status: 'free',
    url: null,
    toolUrl: null, // TODO: add deployed microservice URL
    myobBusiness: true,
  },
];

export const PAIR_FILTER_TABS = ['All', 'QBO', 'Xero', 'MYOB', 'Tally', 'Free'];

export const DATA_CATEGORIES = [
  { icon: '📊', name: 'Chart of accounts',    estimatedRecords: 180  },
  { icon: '👤', name: 'Contacts & customers', estimatedRecords: 1240 },
  { icon: '📄', name: 'Invoices & sales',     estimatedRecords: 2100 },
  { icon: '🧾', name: 'Bills & purchases',    estimatedRecords: 890  },
  { icon: '💳', name: 'Bank transactions',    estimatedRecords: 3400 },
  { icon: '🏷️', name: 'Tax codes & rates',    estimatedRecords: 24   },
  { icon: '📦', name: 'Products & services',  estimatedRecords: 210  },
  { icon: '💰', name: 'Payment records',      estimatedRecords: 1680 },
];
