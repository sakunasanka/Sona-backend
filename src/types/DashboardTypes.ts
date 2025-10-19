// Dashboard Types
export interface SessionAnalyticsData {
  summary: {
    totalSessions: number;
    scheduled: number;
    completed: number;
    cancelled: number;
  };
  frequency: {
    weekly: Array<{
      week: string;
      sessions: number;
    }>;
    monthly: Array<{
      month: string;
      sessions: number;
    }>;
  };
  counselorPerformance: Array<{
    counselor: string;
    sessions: number;
    averageRating: number;
  }>;
  trends: Array<{
    month: string;
    sessions: number;
  }>;
  feedback: Array<{
    rating: number;
    comment: string;
    date: string;
    counselorName?: string;
    clientName?: string;
    sessionId?: number;
  }>;
}

export interface CounselorReport {
  id: string;
  name: string;
  specialization: string[];
  joinDate: string;
}

export interface PsychiatristReport {
  id: string;
  name: string;
  specialization: string[];
  joinDate: string;
}

export interface FinancialReportData {
  summary: {
    totalRevenue: number;
    platformFees: number;
    sessionFees: number;
    successfulTransactions: number;
    successfulSessionTransactions: number;
    successfulPlatformTransactions: number;
  };
  monthlyTrends: Array<{
    month: string;
    totalRevenue: number;
    platformFees: number;
    sessionFees: number;
    transactionCount: number;
  }>;
  paymentTypeBreakdown: Array<{
    type: string;
    revenue: number;
    count: number;
    percentage: number;
  }>;
}