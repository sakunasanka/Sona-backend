// Dashboard Models and Interfaces for Admin Dashboard

export interface MetricCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  textcolor: string;
}

export interface DashboardOverview {
  totalCounselors: number;
  totalPsychiatrists: number;
  totalClients: number;
  totalSessions: number;
  completedSessions: number;
  totalRevenue: number;
  ongoingSessions: number;
  scheduledSessions: number;
}

export interface LoginStatistics {
  counselorLogins: number;
  psychiatristLogins: number;
  clientLogins: number;
  managementLogins: number;
  totalLogins: number;
}

export interface SessionBreakdown {
  counselorSessions: number;
  psychiatristSessions: number;
  completedSessions: number;
  ongoingSessions: number;
  scheduledSessions: number;
  cancelledSessions: number;
  totalSessions: number;
}

export interface MonthlyUserData {
  month: string;
  counselors: number;
  psychiatrists: number;
  clients: number;
  total: number;
}

export interface DailySessionData {
  date: string;
  counselor: number;
  psychiatrist: number;
  total: number;
}

export interface MonthlyGrowthData {
  month: string;
  users: number;
  sessions: number;
  revenue: number;
  growth_rate: number;
}

export interface SessionSpecialtyData {
  name: string;
  value: number;
  percentage?: number;
}

export interface UserAgeDistribution {
  name: string;
  value: number;
}

export interface SessionStatusData {
  name: string;
  value: number;
}

export interface RecentActivity {
  type: string;
  message: string;
  time: string;
  icon: string;
  color: string;
}

export interface TopCounselor {
  name: string;
  sessions: number;
  rating: number;
  specialty: string;
}

export interface HealthStatus {
  database_connection: boolean;
  api_response_time: number;
  memory_usage: number;
  cpu_usage: number;
  active_connections: number;
  last_backup: Date;
  uptime: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface ChartData {
  monthlyUsers: MonthlyUserData[];
  dailySessions: DailySessionData[];
  monthlyGrowth: MonthlyGrowthData[];
  sessionTypes: SessionSpecialtyData[];
  userDistribution: UserAgeDistribution[];
  sessionStatus: SessionStatusData[];
}

export interface CompleteDashboardData {
  mainMetrics: MetricCard[];
  loginMetrics: MetricCard[];
  sessionMetrics: MetricCard[];
  charts: ChartData;
  recentActivities: RecentActivity[];
  topCounselors: TopCounselor[];
}

// API Request/Response Interfaces
export interface DashboardAPIRequest {
  period?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  months?: number;
  days?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Period Types
export type PeriodType = '7d' | '30d' | '3m' | '6m' | '1y' | 'all';

// User Types
export type UserType = 'counselor' | 'psychiatrist' | 'client' | 'admin' | 'management';

// Session Status Types
export type SessionStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'no-show';

// Activity Types
export type ActivityType = 'session' | 'appointment' | 'feedback' | 'message' | 'login' | 'registration';

// Chart Colors for frontend consistency
export const CHART_COLORS = [
  '#0088FE', // Blue
  '#00C49F', // Green
  '#FFBB28', // Yellow
  '#FF8042', // Orange
  '#8884d8', // Purple
  '#82ca9d', // Light Green
  '#ffc658', // Light Orange
  '#ff7c7c', // Pink
  '#8dd1e1', // Light Blue
  '#d084d0'  // Light Purple
];

// Default export for main dashboard interface
export default interface AdminDashboardData extends CompleteDashboardData {
  overview: DashboardOverview;
  health: HealthStatus;
}