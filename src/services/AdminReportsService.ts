import { sequelize } from '../config/db';
import { QueryTypes } from 'sequelize';
import { SessionAnalyticsData, CounselorReport, PsychiatristReport, FinancialReportData } from '../types/DashboardTypes';

// Get Session Analytics Data
export const getSessionAnalytics = async (): Promise<SessionAnalyticsData> => {
  // Get summary data
  const summaryQuery = await Promise.all([
    sequelize.query('SELECT COUNT(*) as count FROM sessions', {
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM sessions WHERE status = $1', {
      bind: ['scheduled'],
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM sessions WHERE status = $1', {
      bind: ['completed'],
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM sessions WHERE status = $1', {
      bind: ['cancelled'],
      type: QueryTypes.SELECT
    })
  ]);

  const summary = {
    totalSessions: parseInt((summaryQuery[0][0] as { count: string }).count),
    scheduled: parseInt((summaryQuery[1][0] as { count: string }).count),
    completed: parseInt((summaryQuery[2][0] as { count: string }).count),
    cancelled: parseInt((summaryQuery[3][0] as { count: string }).count)
  };

  // Get weekly frequency data (last 5 weeks)
  const weeklyQuery = `
    SELECT
      TO_CHAR(DATE_TRUNC('week', "createdAt"), 'YYYY-MM-DD') as week,
      COUNT(*) as sessions
    FROM sessions
    WHERE "createdAt" >= NOW() - INTERVAL '5 weeks'
    GROUP BY DATE_TRUNC('week', "createdAt"), TO_CHAR(DATE_TRUNC('week', "createdAt"), 'YYYY-MM-DD')
    ORDER BY DATE_TRUNC('week', "createdAt")
  `;

  const weeklyResult = await sequelize.query(weeklyQuery, {
    type: QueryTypes.SELECT
  });

  const weekly = weeklyResult.map((row: any) => ({
    week: row.week,
    sessions: parseInt(row.sessions)
  }));

  // Get monthly frequency data (last 5 months)
  const monthlyQuery = `
    SELECT
      TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as month,
      COUNT(*) as sessions
    FROM sessions
    WHERE "createdAt" >= NOW() - INTERVAL '5 months'
    GROUP BY DATE_TRUNC('month', "createdAt"), TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY')
    ORDER BY DATE_TRUNC('month', "createdAt")
  `;

  const monthlyResult = await sequelize.query(monthlyQuery, {
    type: QueryTypes.SELECT
  });

  const monthly = monthlyResult.map((row: any) => ({
    month: row.month,
    sessions: parseInt(row.sessions)
  }));

  const frequency = {
    weekly,
    monthly
  };

  // Get counselor performance data
  let counselorPerformance: Array<{
    counselor: string;
    sessions: number;
    averageRating: number;
  }> = [];

  try {
    const counselorQuery = `
      SELECT
        u.name as counselor,
        COUNT(s.id) as sessions,
      COALESCE(AVG(CASE WHEN qr.total_score ~ '^[0-9]+$' THEN CAST(qr.total_score AS NUMERIC) ELSE NULL END), 4.5) as averageRating
      FROM users u
      LEFT JOIN sessions s ON u.id = s."counselorId"
      LEFT JOIN questionnaire_results qr ON s."userId" = qr.user_id AND qr.questionnaire_type = 'PHQ9'
      WHERE u.role IN ('Counselor', 'Psychiatrist')
      GROUP BY u.id, u.name
      HAVING COUNT(s.id) > 0
      ORDER BY COUNT(s.id) DESC
      LIMIT 10
    `;

    const counselorResult = await sequelize.query(counselorQuery, {
      type: QueryTypes.SELECT
    });

    counselorPerformance = counselorResult.map((row: any) => ({
      counselor: row.counselor,
      sessions: parseInt(row.sessions),
      averageRating: parseFloat(row.averageRating)
    }));
  } catch (error) {
    console.log('Error in counselor performance query, using fallback:', error);
    // Fallback query without AVG calculation
    const fallbackQuery = `
      SELECT
        u.name as counselor,
        COUNT(s.id) as sessions,
        4.5 as averageRating
      FROM users u
      LEFT JOIN sessions s ON u.id = s."counselorId"
      WHERE u.role IN ('Counselor', 'Psychiatrist')
      GROUP BY u.id, u.name
      HAVING COUNT(s.id) > 0
      ORDER BY COUNT(s.id) DESC
      LIMIT 10
    `;

    const fallbackResult = await sequelize.query(fallbackQuery, {
      type: QueryTypes.SELECT
    });

    counselorPerformance = fallbackResult.map((row: any) => ({
      counselor: row.counselor,
      sessions: parseInt(row.sessions),
      averageRating: 4.5
    }));
  }

  // Get monthly trends (last 5 months)
  const trendsQuery = `
    SELECT
      TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
      COUNT(*) as sessions
    FROM sessions
    WHERE "createdAt" >= NOW() - INTERVAL '5 months'
    GROUP BY DATE_TRUNC('month', "createdAt"), TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon')
    ORDER BY DATE_TRUNC('month', "createdAt")
  `;

  const trendsResult = await sequelize.query(trendsQuery, {
    type: QueryTypes.SELECT
  });

  const trends = trendsResult.map((row: any) => ({
    month: row.month,
    sessions: parseInt(row.sessions)
  }));

  // Get feedback data from reviews table if it exists
  let feedback: Array<{
    rating: number;
    comment: string;
    date: string;
    counselorName?: string;
    clientName?: string;
    sessionId?: number;
  }> = [];

  try {
    // Check if reviews table exists and fetch feedback data with counselor, client, and session info
    const feedbackQuery = `
      SELECT
        CAST(r.rating AS NUMERIC) as rating,
        r.comment,
        TO_CHAR(r."createdAt", 'YYYY-MM-DD') as date,
        c.name as counselor_name,
        u.name as client_name,
        r.session_id
      FROM reviews r
      LEFT JOIN sessions s ON r.session_id = s.id
      LEFT JOIN users c ON s."counselorId" = c.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.rating IS NOT NULL
      ORDER BY r."createdAt" DESC
      LIMIT 10
    `;

    const feedbackResult = await sequelize.query(feedbackQuery, {
      type: QueryTypes.SELECT
    });

    feedback = feedbackResult.map((row: any) => ({
      rating: parseFloat(row.rating),
      comment: row.comment || '',
      date: row.date,
      counselorName: row.counselor_name,
      clientName: row.client_name,
      sessionId: row.session_id
    }));
  } catch (error) {
    // If reviews table doesn't exist or query fails, keep feedback as empty array
    console.log('Reviews table not found or query failed, returning empty feedback array');
  }

  return {
    summary,
    frequency,
    counselorPerformance,
    trends,
    feedback
  };
};

// Get Approved Counselors for Reports
export const getApprovedCounselorsReport = async (year?: number, month?: number): Promise<CounselorReport[]> => {
  let whereClause = `u.role = 'Counselor' AND c.status = 'approved'`;

  if (year && month) {
    whereClause += ` AND EXTRACT(YEAR FROM u."createdAt") = ${year} AND EXTRACT(MONTH FROM u."createdAt") = ${month}`;
  } else if (year) {
    whereClause += ` AND EXTRACT(YEAR FROM u."createdAt") = ${year}`;
  } else if (month) {
    whereClause += ` AND EXTRACT(MONTH FROM u."createdAt") = ${month}`;
  }

  const query = `
    SELECT
      u.id::text as id,
      u.name,
      c.specialities as specialization,
      TO_CHAR(u."createdAt", 'YYYY-MM-DD') as joinDate
    FROM users u
    JOIN counselors c ON u.id = c."userId"
    WHERE ${whereClause}
    ORDER BY u."createdAt" DESC
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });

  return result.map((row: any) => ({
    id: row.id,
    name: row.name,
    specialization: row.specialization || [],
    joinDate: row.joindate
  }));
};

// Get Approved Psychiatrists for Reports
export const getApprovedPsychiatristsReport = async (year?: number, month?: number): Promise<PsychiatristReport[]> => {
  let whereClause = `u.role = 'Psychiatrist' AND p.status = 'approved'`;

  if (year && month) {
    whereClause += ` AND EXTRACT(YEAR FROM u."createdAt") = ${year} AND EXTRACT(MONTH FROM u."createdAt") = ${month}`;
  } else if (year) {
    whereClause += ` AND EXTRACT(YEAR FROM u."createdAt") = ${year}`;
  } else if (month) {
    whereClause += ` AND EXTRACT(MONTH FROM u."createdAt") = ${month}`;
  }

  const query = `
    SELECT
      u.id::text as id,
      u.name,
      p.specialities as specialization,
      TO_CHAR(u."createdAt", 'YYYY-MM-DD') as joinDate
    FROM users u
    JOIN psychiatrists p ON u.id = p."userId"
    WHERE ${whereClause}
    ORDER BY u."createdAt" DESC
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });

  return result.map((row: any) => ({
    id: row.id,
    name: row.name,
    specialization: row.specialization || [],
    joinDate: row.joindate
  }));
};

// Get Financial Report Data
export const getFinancialReport = async (year?: number, month?: number): Promise<FinancialReportData> => {
  let whereClause = `pt.status = 'success'`;

  if (year && month) {
    whereClause += ` AND EXTRACT(YEAR FROM pt.created_at) = ${year} AND EXTRACT(MONTH FROM pt.created_at) = ${month}`;
  } else if (year) {
    whereClause += ` AND EXTRACT(YEAR FROM pt.created_at) = ${year}`;
  } else if (month) {
    whereClause += ` AND EXTRACT(MONTH FROM pt.created_at) = ${month}`;
  }

  // Get summary data
  const summaryQuery = await Promise.all([
    // Total revenue (successful transactions only)
    sequelize.query(`SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions pt WHERE ${whereClause}`, {
      type: QueryTypes.SELECT
    }),
    // Platform fees
    sequelize.query(`SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions pt WHERE ${whereClause} AND payment_for = 'platform_fee'`, {
      type: QueryTypes.SELECT
    }),
    // Session fees
    sequelize.query(`SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions pt WHERE ${whereClause} AND payment_for = 'session_fee'`, {
      type: QueryTypes.SELECT
    }),
    // Successful transaction counts by payment type
    sequelize.query(`SELECT payment_for, COUNT(*) as count FROM payment_transactions pt WHERE ${whereClause} GROUP BY payment_for`, {
      type: QueryTypes.SELECT
    })
  ]);

  const totalRevenue = parseFloat((summaryQuery[0][0] as { total: string }).total);
  const platformFees = parseFloat((summaryQuery[1][0] as { total: string }).total);
  const sessionFees = parseFloat((summaryQuery[2][0] as { total: string }).total);

  // Process successful transaction counts by payment type
  const paymentTypeCounts = summaryQuery[3] as Array<{ payment_for: string; count: string }>;
  const successfulSessionTransactions = parseInt(paymentTypeCounts.find(pt => pt.payment_for === 'session_fee')?.count || '0');
  const successfulPlatformTransactions = parseInt(paymentTypeCounts.find(pt => pt.payment_for === 'platform_fee')?.count || '0');
  const successfulTransactions = successfulSessionTransactions + successfulPlatformTransactions;

  const summary = {
    totalRevenue,
    platformFees,
    sessionFees,
    successfulTransactions,
    successfulSessionTransactions,
    successfulPlatformTransactions
  };

  // Get monthly trends (last 6 months or filtered period)
  let monthlyWhereClause = `pt.status = 'success'`;
  if (year && month) {
    monthlyWhereClause += ` AND EXTRACT(YEAR FROM pt.created_at) = ${year} AND EXTRACT(MONTH FROM pt.created_at) = ${month}`;
  } else if (year) {
    monthlyWhereClause += ` AND EXTRACT(YEAR FROM pt.created_at) = ${year}`;
  } else if (month) {
    monthlyWhereClause += ` AND EXTRACT(MONTH FROM pt.created_at) = ${month}`;
  } else {
    monthlyWhereClause += ` AND pt.created_at >= NOW() - INTERVAL '6 months'`;
  }

  const monthlyQuery = `
    SELECT
      TO_CHAR(DATE_TRUNC('month', pt.created_at), 'Mon YYYY') as month,
      DATE_TRUNC('month', pt.created_at) as month_date,
      COALESCE(SUM(pt.amount), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN pt.payment_for = 'platform_fee' THEN pt.amount ELSE 0 END), 0) as platform_fees,
      COALESCE(SUM(CASE WHEN pt.payment_for = 'session_fee' THEN pt.amount ELSE 0 END), 0) as session_fees,
      COUNT(*) as transaction_count
    FROM payment_transactions pt
    WHERE ${monthlyWhereClause}
    GROUP BY DATE_TRUNC('month', pt.created_at), TO_CHAR(DATE_TRUNC('month', pt.created_at), 'Mon YYYY')
    ORDER BY DATE_TRUNC('month', pt.created_at)
  `;

  const monthlyResult = await sequelize.query(monthlyQuery, {
    type: QueryTypes.SELECT
  });

  const monthlyTrends = monthlyResult.map((row: any) => ({
    month: row.month,
    totalRevenue: parseFloat(row.total_revenue),
    platformFees: parseFloat(row.platform_fees),
    sessionFees: parseFloat(row.session_fees),
    transactionCount: parseInt(row.transaction_count)
  }));

  // Get payment type breakdown
  const paymentTypeQuery = `
    SELECT
      pt.payment_for as type,
      COALESCE(SUM(pt.amount), 0) as revenue,
      COUNT(*) as count
    FROM payment_transactions pt
    WHERE ${whereClause}
    GROUP BY pt.payment_for
    ORDER BY SUM(pt.amount) DESC
  `;

  const paymentTypeResult = await sequelize.query(paymentTypeQuery, {
    type: QueryTypes.SELECT
  });

  const totalRevenueForPercentage = paymentTypeResult.reduce((sum: number, row: any) => sum + parseFloat(row.revenue), 0);

  const paymentTypeBreakdown = paymentTypeResult.map((row: any) => ({
    type: row.type,
    revenue: parseFloat(row.revenue),
    count: parseInt(row.count),
    percentage: totalRevenueForPercentage > 0 ? Math.round((parseFloat(row.revenue) / totalRevenueForPercentage) * 100 * 100) / 100 : 0
  }));

  return {
    summary,
    monthlyTrends,
    paymentTypeBreakdown
  };
};


