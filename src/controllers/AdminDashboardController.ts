import { Request, Response } from 'express';
// Make sure the file exists at the correct path and with the correct casing.
// If your file is named 'adminDashboardService.ts', update the import as follows:
import * as dashboardService from '../services/AdminDashboardService';

// Dashboard Overview Metrics
export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const overview = await dashboardService.getDashboardOverview();
    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard overview'
    });
  }
};

// Main Metrics (First row cards)
export const getMainMetrics = async (req: Request, res: Response) => {
  try {
    const [totalCounselors, totalPsychiatrists, totalSessions, totalRevenue] = await Promise.all([
      dashboardService.getCounselorCount(),
      dashboardService.getPsychiatristCount(),
      dashboardService.getTotalSessionCount(),
      dashboardService.getTotalRevenue()
    ]);

    const metrics = [
      {
        label: 'Total Counselors',
        value: totalCounselors,
        icon: 'Users',
        color: "bg-blue-100",
        textcolor: "text-blue-600"
      },
      {
        label: 'Total Psychiatrists',
        value: totalPsychiatrists,
        icon: 'Stethoscope',
        color: "bg-purple-100",
        textcolor: "text-purple-600"
      },
      {
        label: 'Total Sessions',
        value: totalSessions,
        icon: 'MessageCircle',
        color: "bg-green-100",
        textcolor: "text-green-600"
      },
      {
        label: 'Total Revenue',
        value: `Rs.${totalRevenue.toLocaleString()}`,
        icon: 'HandCoins',
        color: "bg-yellow-100",
        textcolor: "text-yellow-600"
      }
    ];

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch main metrics'
    });
  }
};

// Login Metrics
export const getLoginMetrics = async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    const loginStats = await dashboardService.getLoginStatistics(period as string);

    const loginMetrics = [
      {
        label: 'Counselor Logins',
        value: loginStats.counselorLogins.toLocaleString(),
        icon: 'UserCog',
        color: "bg-indigo-100",
        textcolor: "text-indigo-600"
      },
      {
        label: 'Psychiatrist Logins',
        value: loginStats.psychiatristLogins.toLocaleString(),
        icon: 'Stethoscope',
        color: "bg-purple-100",
        textcolor: "text-purple-600"
      },
      {
        label: 'Client Logins',
        value: loginStats.clientLogins.toLocaleString(),
        icon: 'Users',
        color: "bg-cyan-100",
        textcolor: "text-cyan-600"
      },
      {
        label: 'Management Logins',
        value: loginStats.managementLogins.toLocaleString(),
        icon: 'UserCheck',
        color: "bg-orange-100",
        textcolor: "text-orange-600"
      }
    ];

    res.status(200).json({
      success: true,
      data: loginMetrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch login metrics'
    });
  }
};

// Session Breakdown
export const getSessionBreakdown = async (req: Request, res: Response) => {
  try {
    const sessionStats = await dashboardService.getSessionBreakdown();

    const sessionMetrics = [
      {
        label: 'Counselor Sessions',
        value: sessionStats.counselorSessions,
        icon: 'UserCog',
        color: "bg-blue-100",
        textcolor: "text-blue-600"
      },
      {
        label: 'Psychiatrist Sessions',
        value: sessionStats.psychiatristSessions,
        icon: 'Stethoscope',
        color: "bg-purple-100",
        textcolor: "text-purple-600"
      },
      {
        label: 'Completed Sessions',
        value: sessionStats.completedSessions,
        icon: 'Award',
        color: "bg-green-100",
        textcolor: "text-green-600"
      },
      {
        label: 'Ongoing Sessions',
        value: sessionStats.ongoingSessions,
        icon: 'Clock',
        color: "bg-yellow-100",
        textcolor: "text-yellow-600"
      },
      {
        label: 'Scheduled Sessions',
        value: sessionStats.scheduledSessions,
        icon: 'Calendar',
        color: "bg-orange-100",
        textcolor: "text-orange-600"
      }
    ];

    res.status(200).json({
      success: true,
      data: sessionMetrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch session breakdown'
    });
  }
};

// Monthly Users Chart Data
export const getMonthlyUsersData = async (req: Request, res: Response) => {
  try {
    const { months = 5 } = req.query;
    const monthlyData = await dashboardService.getMonthlyUserGrowth(parseInt(months as string));

    res.status(200).json({
      success: true,
      data: monthlyData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch monthly users data'
    });
  }
};

// Daily Sessions Chart Data
export const getDailySessionsData = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const dailyData = await dashboardService.getDailySessionData(parseInt(days as string));

    res.status(200).json({
      success: true,
      data: dailyData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch daily sessions data'
    });
  }
};

// Monthly Growth Data
export const getMonthlyGrowthData = async (req: Request, res: Response) => {
  try {
    const { months = 6 } = req.query;
    const growthData = await dashboardService.getMonthlyGrowthData(parseInt(months as string));

    res.status(200).json({
      success: true,
      data: growthData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch monthly growth data'
    });
  }
};

// Monthly Revenue Data
export const getMonthlyRevenueData = async (req: Request, res: Response) => {
  try {
    const { months = 6 } = req.query;
    const revenueData = await dashboardService.getMonthlyRevenueData(parseInt(months as string));

    res.status(200).json({
      success: true,
      data: revenueData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch monthly revenue data'
    });
  }
};

// Session Types/Specialty Data
export const getSessionTypesData = async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    const specialtyData = await dashboardService.getSessionsBySpecialty(period as string);

    res.status(200).json({
      success: true,
      data: specialtyData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch session types data'
    });
  }
};

// User Demographics/Distribution
export const getUserDistribution = async (req: Request, res: Response) => {
  try {
    const userDistribution = await dashboardService.getUserAgeDistribution();

    res.status(200).json({
      success: true,
      data: userDistribution
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user distribution'
    });
  }
};

// Session Status Data
export const getSessionStatusData = async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    const statusData = await dashboardService.getSessionStatusDistribution(period as string);

    res.status(200).json({
      success: true,
      data: statusData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch session status data'
    });
  }
};

// Recent Activities
export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const activities = await dashboardService.getRecentActivities(parseInt(limit as string));

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch recent activities'
    });
  }
};

// Top Performing Counselors
export const getTopCounselors = async (req: Request, res: Response) => {
  try {
    const { limit = 10, period = '30d' } = req.query;
    const topCounselors = await dashboardService.getTopPerformingCounselors({
      limit: parseInt(limit as string),
      period: period as string
    });

    res.status(200).json({
      success: true,
      data: topCounselors
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch top counselors'
    });
  }
};

// Complete Dashboard Data (All in one)
export const getCompleteDashboard = async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;

    // Fetch all dashboard data in parallel
    const [
      mainMetrics,
      loginStats,
      sessionStats,
      monthlyUsers,
      dailySessions,
      monthlyGrowth,
      monthlyRevenue,
      sessionTypes,
      userDistribution,
      sessionStatus,
      recentActivities,
      topCounselors
    ] = await Promise.all([
      // Main metrics
      Promise.all([
        dashboardService.getCounselorCount(),
        dashboardService.getPsychiatristCount(),
        dashboardService.getTotalSessionCount(),
        dashboardService.getTotalRevenue()
      ]),
      // Login stats
      dashboardService.getLoginStatistics(period as string),
      // Session breakdown
      dashboardService.getSessionBreakdown(),
      // Monthly users
      dashboardService.getMonthlyUserGrowth(5),
      // Daily sessions
      dashboardService.getDailySessionData(7),
      // Monthly growth
      dashboardService.getMonthlyGrowthData(6),
      // Monthly revenue
      dashboardService.getMonthlyRevenueData(6),
      // Session types
      dashboardService.getSessionsBySpecialty(period as string),
      // User distribution
      dashboardService.getUserAgeDistribution(),
      // Session status
      dashboardService.getSessionStatusDistribution(period as string),
      // Recent activities
      dashboardService.getRecentActivities(10),
      // Top counselors
      dashboardService.getTopPerformingCounselors({ limit: 10, period: period as string })
    ]);

    const dashboardData = {
      mainMetrics: [
        {
          label: 'Total Counselors',
          value: mainMetrics[0],
          icon: 'Users',
          color: "bg-blue-100",
          textcolor: "text-blue-600"
        },
        {
          label: 'Total Psychiatrists',
          value: mainMetrics[1],
          icon: 'Stethoscope',
          color: "bg-purple-100",
          textcolor: "text-purple-600"
        },
        {
          label: 'Total Sessions',
          value: mainMetrics[2],
          icon: 'MessageCircle',
          color: "bg-green-100",
          textcolor: "text-green-600"
        },
        {
          label: 'Total Revenue',
          value: `Rs.${mainMetrics[3].toLocaleString()}`,
          icon: 'HandCoins',
          color: "bg-yellow-100",
          textcolor: "text-yellow-600"
        }
      ],
      loginMetrics: [
        {
          label: 'Counselor Logins',
          value: loginStats.counselorLogins.toLocaleString(),
          icon: 'UserCog',
          color: "bg-indigo-100",
          textcolor: "text-indigo-600"
        },
        {
          label: 'Psychiatrist Logins',
          value: loginStats.psychiatristLogins.toLocaleString(),
          icon: 'Stethoscope',
          color: "bg-purple-100",
          textcolor: "text-purple-600"
        },
        {
          label: 'Client Logins',
          value: loginStats.clientLogins.toLocaleString(),
          icon: 'Users',
          color: "bg-cyan-100",
          textcolor: "text-cyan-600"
        },
        {
          label: 'Management Logins',
          value: loginStats.managementLogins.toLocaleString(),
          icon: 'UserCheck',
          color: "bg-orange-100",
          textcolor: "text-orange-600"
        }
      ],
      sessionMetrics: [
        {
          label: 'Counselor Sessions',
          value: sessionStats.counselorSessions,
          icon: 'UserCog',
          color: "bg-blue-100",
          textcolor: "text-blue-600"
        },
        {
          label: 'Psychiatrist Sessions',
          value: sessionStats.psychiatristSessions,
          icon: 'Stethoscope',
          color: "bg-purple-100",
          textcolor: "text-purple-600"
        },
        {
          label: 'Completed Sessions',
          value: sessionStats.completedSessions,
          icon: 'Award',
          color: "bg-green-100",
          textcolor: "text-green-600"
        },
        {
          label: 'Ongoing Sessions',
          value: sessionStats.ongoingSessions,
          icon: 'Clock',
          color: "bg-yellow-100",
          textcolor: "text-yellow-600"
        },
        {
          label: 'Scheduled Sessions',
          value: sessionStats.scheduledSessions,
          icon: 'Calendar',
          color: "bg-orange-100",
          textcolor: "text-orange-600"
        }
      ],
      charts: {
        monthlyUsers: monthlyUsers,
        dailySessions: dailySessions,
        monthlyGrowth: monthlyGrowth,
        monthlyRevenue: monthlyRevenue,
        sessionTypes: sessionTypes,
        userDistribution: userDistribution,
        sessionStatus: sessionStatus
      },
      recentActivities: recentActivities,
      topCounselors: topCounselors
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch complete dashboard data'
    });
  }
};

// Health Status
export const getHealthStatus = async (req: Request, res: Response) => {
  try {
    const healthStatus = await dashboardService.getHealthStatus();
    res.status(200).json({
      success: true,
      data: healthStatus
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get health status'
    });
  }
};