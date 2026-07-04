import { apiClient } from './client';

export interface ReportPairSummary {
  id: string;
  source: string;
  destination: string;
  displayName: string;
  environment: string;
  isActive: boolean;
  sourceLogo: string | null;
  destinationLogo: string | null;
  hasReport: boolean;
  runDate: string | null;
  totalOrders: number | null;
  averageDays: number | null;
  ingestedAt: string | null;
}

export interface ReportCountrySummary {
  code: string;
  name: string;
  orders: number;
  averageDays: number | null;
  minDays: number | null;
  maxDays: number | null;
  flagged: boolean;
}

export interface ReportOrderRow {
  orderNumber: string;
  fileName: string | null;
  ptaDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  processingDays: number | null;
  flagged: boolean;
}

export interface ReportOrderGroup {
  code: string;
  name: string;
  orders: ReportOrderRow[];
}

export interface ReportDetail {
  id: string;
  pairId: string;
  pairCode: string;
  pairName: string | null;
  title: string;
  source: string;
  destination: string;
  displayName: string;
  runDate: string;
  totalOrders: number;
  averageDays: number | null;
  ingestedAt: string;
  countries: ReportCountrySummary[];
  groups: ReportOrderGroup[];
}

export const reportsService = {
  /** Admin — all migration pairs with their latest report summary. */
  listPairs: () =>
    apiClient
      .get<ReportPairSummary[]>('/admin/reports/pairs')
      .then((r) => r.data),

  /** Admin — full latest report for a pair (404 when none ingested yet). */
  getByPairId: (pairId: string) =>
    apiClient
      .get<ReportDetail>(`/admin/reports/pairs/${pairId}`)
      .then((r) => r.data),
};
