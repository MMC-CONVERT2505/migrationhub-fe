import type { AdminPairData, FeedItem, KPICard } from '@/types';
import { PAIRS } from './pairs';

export const ADMIN_DATA: AdminPairData[] = [
  { total: 3241, completed: 3198, inProgress: 12, failed: 31, successRate: 98.7, avgTime: '22 min' },
  { total: 892,  completed: 871,  inProgress: 5,  failed: 16, successRate: 97.6, avgTime: '14 min' },
  { total: 1147, completed: 1121, inProgress: 8,  failed: 18, successRate: 97.7, avgTime: '26 min' },
  { total: 428,  completed: 418,  inProgress: 4,  failed: 6,  successRate: 97.7, avgTime: '18 min' },
  { total: 4523, completed: 4481, inProgress: 22, failed: 20, successRate: 99.1, avgTime: '20 min' },
  { total: 768,  completed: 748,  inProgress: 9,  failed: 11, successRate: 97.4, avgTime: '31 min' },
  { total: 643,  completed: 628,  inProgress: 7,  failed: 8,  successRate: 97.7, avgTime: '17 min' },
  { total: 318,  completed: 309,  inProgress: 3,  failed: 6,  successRate: 97.2, avgTime: '23 min' },
  { total: 987,  completed: 965,  inProgress: 11, failed: 11, successRate: 97.8, avgTime: '19 min' },
];

export const ACTIVITY_FEED: FeedItem[] = [
  {
    type: 'success',
    title: 'Migration complete',
    description: 'MYOB → QBO · 2,341 records transferred',
    timestamp: '1 min ago',
  },
  {
    type: 'info',
    title: 'Migration started',
    description: 'Xero → QBO · Organisation: Bright & Co.',
    timestamp: '3 min ago',
  },
  {
    type: 'success',
    title: 'Migration complete',
    description: 'QBO → Xero · 1,892 records transferred',
    timestamp: '7 min ago',
  },
  {
    type: 'info',
    title: 'Payment received',
    description: 'Standard plan · $713.90 · Tally → ZOHO',
    timestamp: '11 min ago',
  },
  {
    type: 'warning',
    title: 'Awaiting review',
    description: 'Xero → Prosaic · Mapping review pending',
    timestamp: '14 min ago',
  },
  {
    type: 'success',
    title: 'Migration complete',
    description: 'QBO → FreshBooks · 934 records transferred',
    timestamp: '18 min ago',
  },
  {
    type: 'info',
    title: 'Migration started',
    description: 'Xero → MYOB · Organisation: Novex Ltd.',
    timestamp: '22 min ago',
  },
  {
    type: 'error',
    title: 'Error — retrying',
    description: 'MYOB → QBO · Bank transaction import issue',
    timestamp: '29 min ago',
  },
  {
    type: 'success',
    title: 'Migration complete',
    description: 'Xero → Reckon · 641 records transferred',
    timestamp: '35 min ago',
  },
  {
    type: 'success',
    title: 'Migration complete',
    description: 'Tally → ZOHO · 3,100 records transferred',
    timestamp: '41 min ago',
  },
];

export const KPI_CARDS: KPICard[] = [
  {
    label: 'Total Migrations',
    value: '13,947',
    change: '+8.4% this month',
    changePositive: true,
    icon: '🔄',
  },
  {
    label: 'Success Rate',
    value: '98.4%',
    change: '+0.3% vs last month',
    changePositive: true,
    icon: '✅',
  },
  {
    label: 'Active Now',
    value: '81',
    change: '12 started today',
    changePositive: true,
    icon: '⚡',
  },
  {
    label: 'Avg Duration',
    value: '19 min',
    change: '2 min faster vs last month',
    changePositive: true,
    icon: '⏱️',
  },
];

export const ADMIN_TABLE_DATA = PAIRS.map((pair, i) => ({
  pair,
  ...ADMIN_DATA[i],
}));
