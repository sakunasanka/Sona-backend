import { sequelize } from '../config/db';
import { QueryTypes } from 'sequelize';

// Dashboard Overview
export const getDashboardOverview = async () => {
  const queries = await Promise.all([
    sequelize.query('SELECT COUNT(*) as count FROM users WHERE role = $1', {
      bind: ['Counselor'],
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM users WHERE role = $1', {
      bind: ['Psychiatrist'],
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM users WHERE role = $1', {
      bind: ['Client'],
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM sessions', {
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM sessions WHERE status = $1', {
      bind: ['completed'],
      type: QueryTypes.SELECT
    }),
    // sequelize.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = $1', {
    //   bind: ['completed'],
    //   type: QueryTypes.SELECT
    // }),
    sequelize.query('SELECT 0 as total', {
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM sessions WHERE status = $1', {
      bind: ['ongoing'],
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM sessions WHERE status = $1', {
      bind: ['scheduled'],
      type: QueryTypes.SELECT
    })
  ]);

  return {
    totalCounselors: parseInt((queries[0][0] as { count: string }).count),
    totalPsychiatrists: parseInt((queries[1][0] as { count: string }).count),
    totalClients: parseInt((queries[2][0] as { count: string }).count),
    totalSessions: parseInt((queries[3][0] as { count: string }).count),
    completedSessions: parseInt((queries[4][0] as { count: string }).count),
    // totalRevenue: parseFloat((queries[5][0] as { total: string }).total),
    totalRevenue: 0,
    ongoingSessions: parseInt((queries[5][0] as { count: string }).count),
    scheduledSessions: parseInt((queries[6][0] as { count: string }).count)
  };
};

// Get Counselor Count
export const getCounselorCount = async (): Promise<number> => {
  const result = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE role = $1', {
    bind: ['Counselor'],
    type: QueryTypes.SELECT
  });
  return parseInt((result[0] as { count: string }).count);
};

// Get Psychiatrist Count
export const getPsychiatristCount = async (): Promise<number> => {
  const result = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE role = $1', {
    bind: ['Psychiatrist'],
    type: QueryTypes.SELECT
  });
  return parseInt((result[0] as { count: string }).count);
};

// Get Total Session Count
export const getTotalSessionCount = async (): Promise<number> => {
  const result = await sequelize.query('SELECT COUNT(*) as count FROM sessions', {
    type: QueryTypes.SELECT
  });
  return parseInt((result[0] as { count: string }).count);
};

// Get Total Revenue
export const getTotalRevenue = async (): Promise<number> => {
  // const result = await sequelize.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = $1', {
  //   bind: ['completed'],
  //   type: QueryTypes.SELECT
  // });
  // return parseFloat((result[0] as { total: string }).total);
  return 0;
};

// Get Login Statistics
export const getLoginStatistics = async (period: string = '30d') => {
  let dateFilter = '';
  switch (period) {
    case '7d':
      dateFilter = "AND login_at >= NOW() - INTERVAL '7 days'";
      break;
    case '30d':
      dateFilter = "AND login_at >= NOW() - INTERVAL '30 days'";
      break;
    case '3m':
      dateFilter = "AND login_at >= NOW() - INTERVAL '3 months'";
      break;
    case '6m':
      dateFilter = "AND login_at >= NOW() - INTERVAL '6 months'";
      break;
    case '1y':
      dateFilter = "AND login_at >= NOW() - INTERVAL '1 year'";
      break;
  }

  const query = `
    SELECT 
      u.role,
      COUNT(*) as login_count
    FROM user_logins l
    JOIN users u ON l.user_id = u.id
    WHERE 1=1 ${dateFilter}
    GROUP BY u.role
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });
  
  const loginStats = {
    counselorLogins: 0,
    psychiatristLogins: 0,
    clientLogins: 0,
    managementLogins: 0,
    totalLogins: 0
  };

  result.forEach((row: any) => {
    const count = parseInt(row.login_count);
    loginStats.totalLogins += count;
    
    switch (row.role) {
      case 'Counselor':
        loginStats.counselorLogins = count;
        break;
      case 'Psychiatrist':
        loginStats.psychiatristLogins = count;
        break;
      case 'Client':
        loginStats.clientLogins = count;
        break;
      case 'Admin':
      case 'MT-Team':
        loginStats.managementLogins += count;
        break;
    }
  });

  return loginStats;
};

// Get Session Breakdown
export const getSessionBreakdown = async () => {
  const queries = await Promise.all([
    sequelize.query(`
      SELECT COUNT(*) as count 
      FROM sessions s 
      JOIN users u ON s."counselorId" = u.id 
      WHERE u.role = 'Counselor'
    `, { type: QueryTypes.SELECT }),
    sequelize.query(`
      SELECT COUNT(*) as count 
      FROM sessions s 
      JOIN users u ON s."counselorId" = u.id 
      WHERE u.role = 'Psychiatrist'
    `, { type: QueryTypes.SELECT }),
    sequelize.query('SELECT COUNT(*) as count FROM sessions WHERE status = $1', {
      bind: ['completed'],
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM sessions WHERE status = $1', {
      bind: ['ongoing'],
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM sessions WHERE status = $1', {
      bind: ['scheduled'],
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM sessions WHERE status = $1', {
      bind: ['cancelled'],
      type: QueryTypes.SELECT
    }),
    sequelize.query('SELECT COUNT(*) as count FROM sessions', {
      type: QueryTypes.SELECT
    })
  ]);

  return {
    counselorSessions: parseInt((queries[0][0] as { count: string }).count),
    psychiatristSessions: parseInt((queries[1][0] as { count: string }).count),
    completedSessions: parseInt((queries[2][0] as { count: string }).count),
    ongoingSessions: parseInt((queries[3][0] as { count: string }).count),
    scheduledSessions: parseInt((queries[4][0] as { count: string }).count),
    cancelledSessions: parseInt((queries[5][0] as { count: string }).count),
    totalSessions: parseInt((queries[6][0] as { count: string }).count)
  };
};

// Get Monthly User Growth
export const getMonthlyUserGrowth = async (months: number = 5) => {
  const query = `
    SELECT 
      TO_CHAR("createdAt", 'Mon YYYY') as month,
      COUNT(*) FILTER (WHERE role = 'Counselor') as counselors,
      COUNT(*) FILTER (WHERE role = 'Psychiatrist') as psychiatrists,
      COUNT(*) FILTER (WHERE role = 'Client') as clients,
      COUNT(*) as total
    FROM users 
    WHERE "createdAt" >= NOW() - INTERVAL '${months} months'
    GROUP BY TO_CHAR("createdAt", 'Mon YYYY'), DATE_TRUNC('month', "createdAt")
    ORDER BY DATE_TRUNC('month', "createdAt")
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });
  return result.map((row: any) => ({
    month: row.month,
    counselors: parseInt(row.counselors) || 0,
    psychiatrists: parseInt(row.psychiatrists) || 0,
    clients: parseInt(row.clients) || 0,
    total: parseInt(row.total)
  }));
};

// Get Daily Session Data
export const getDailySessionData = async (days: number = 7) => {
  const query = `
    SELECT 
      DATE(s."createdAt") as date,
      COUNT(*) FILTER (WHERE u.role = 'Counselor') as counselor,
      COUNT(*) FILTER (WHERE u.role = 'Psychiatrist') as psychiatrist,
      COUNT(*) as total
    FROM sessions s
    JOIN users u ON s."counselorId" = u.id
    WHERE s."createdAt" >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(s."createdAt")
    ORDER BY DATE(s."createdAt")
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });
  return result.map((row: any) => ({
    date: row.date,
    counselor: parseInt(row.counselor) || 0,
    psychiatrist: parseInt(row.psychiatrist) || 0,
    total: parseInt(row.total)
  }));
};

// Get Monthly Growth Data
export const getMonthlyGrowthData = async (months: number = 6) => {
  const query = `
    WITH monthly_stats AS (
      SELECT
        TO_CHAR(DATE_TRUNC('month', u."createdAt"), 'Mon YYYY') as month,
        DATE_TRUNC('month', u."createdAt") as month_date,
        COUNT(DISTINCT u.id) as users,
        COUNT(DISTINCT s.id) as sessions
      FROM users u
      LEFT JOIN sessions s ON s."userId" = u.id OR s."counselorId" = u.id
      WHERE u."createdAt" >= NOW() - INTERVAL '${months} months'
      GROUP BY DATE_TRUNC('month', u."createdAt"), TO_CHAR(DATE_TRUNC('month', u."createdAt"), 'Mon YYYY')
      ORDER BY DATE_TRUNC('month', u."createdAt")
    ),
    revenue_stats AS (
      SELECT
        DATE_TRUNC('month', pt.created_at) as month_date,
        SUM(pt.amount) as revenue
      FROM payment_transactions pt
      WHERE pt.payment_for = 'platform_fee' AND pt.status = 'success'
      GROUP BY DATE_TRUNC('month', pt.created_at)
    ),
    combined_stats AS (
      SELECT
        ms.month,
        ms.month_date,
        ms.users,
        ms.sessions,
        COALESCE(rs.revenue, 0) as revenue
      FROM monthly_stats ms
      LEFT JOIN revenue_stats rs ON ms.month_date = rs.month_date
    ),
    growth_calc AS (
      SELECT
        *,
        LAG(users) OVER (ORDER BY month_date) as prev_users
      FROM combined_stats
    )
    SELECT
      month,
      users,
      sessions,
      revenue,
      CASE
        WHEN prev_users > 0 THEN ROUND(((users - prev_users) * 100.0 / prev_users), 2)
        ELSE 0
      END as growth_rate
    FROM growth_calc
    ORDER BY month_date
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });
  return result.map((row: any) => ({
    month: row.month,
    users: parseInt(row.users),
    sessions: parseInt(row.sessions),
    revenue: parseFloat(row.revenue),
    growth_rate: parseFloat(row.growth_rate) || 0
  }));
};

// Get Monthly Revenue Data
export const getMonthlyRevenueData = async (months: number = 6) => {
  const query = `
    SELECT 
      TO_CHAR(DATE_TRUNC('month', pt.created_at), 'Mon YYYY') as month,
      DATE_TRUNC('month', pt.created_at) as month_date,
      COALESCE(SUM(pt.amount), 0) as revenue
    FROM payment_transactions pt
    WHERE pt.payment_for = 'platform_fee' 
      AND pt.status = 'success'
      AND pt.created_at >= NOW() - INTERVAL '${months} months'
    GROUP BY DATE_TRUNC('month', pt.created_at), TO_CHAR(DATE_TRUNC('month', pt.created_at), 'Mon YYYY')
    ORDER BY DATE_TRUNC('month', pt.created_at)
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });
  return result.map((row: any) => ({
    month: row.month,
    revenue: parseFloat(row.revenue)
  }));
};

// Get Sessions by Specialty
export const getSessionsBySpecialty = async (period: string = '30d') => {
  let dateFilter = '';
  switch (period) {
    case '7d':
      dateFilter = "AND s.\"createdAt\" >= NOW() - INTERVAL '7 days'";
      break;
    case '30d':
      dateFilter = "AND s.\"createdAt\" >= NOW() - INTERVAL '30 days'";
      break;
    case '3m':
      dateFilter = "AND s.\"createdAt\" >= NOW() - INTERVAL '3 months'";
      break;
  }

  const query = `
    WITH session_specialty AS (
      SELECT 
        COALESCE(c.specialities[1], p.specialities[1], 'General') as specialty,
        COUNT(*) as sessions
      FROM sessions s
      LEFT JOIN counselors c ON s."counselorId" = c."userId"
      LEFT JOIN psychiatrists p ON s."counselorId" = p."userId"
      WHERE 1=1 ${dateFilter}
      GROUP BY COALESCE(c.specialities[1], p.specialities[1], 'General')
    ),
    total_sessions AS (
      SELECT SUM(sessions) as total FROM session_specialty
    )
    SELECT 
      ss.specialty,
      ss.sessions,
      ROUND((ss.sessions * 100.0 / ts.total), 2) as percentage
    FROM session_specialty ss
    CROSS JOIN total_sessions ts
    ORDER BY ss.sessions DESC
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });
  return result.map((row: any) => ({
    name: row.specialty,
    value: parseInt(row.sessions),
    percentage: parseFloat(row.percentage)
  }));
};

// Get User Age Distribution
export const getUserAgeDistribution = async () => {
  // Since dateOfBirth column doesn't exist in users table, return empty data
  return [];
};

// Get Session Status Distribution
export const getSessionStatusDistribution = async (period: string = '30d') => {
  let dateFilter = '';
  switch (period) {
    case '7d':
      dateFilter = "AND \"createdAt\" >= NOW() - INTERVAL '7 days'";
      break;
    case '30d':
      dateFilter = "AND \"createdAt\" >= NOW() - INTERVAL '30 days'";
      break;
    case '3m':
      dateFilter = "AND \"createdAt\" >= NOW() - INTERVAL '3 months'";
      break;
  }

  const query = `
    WITH status_counts AS (
      SELECT 
        CASE status
          WHEN 'completed' THEN 'Completed'
          WHEN 'scheduled' THEN 'Pending'
          WHEN 'cancelled' THEN 'Cancelled'
          ELSE 'Other'
        END as status,
        COUNT(*) as count
      FROM sessions 
      WHERE 1=1 ${dateFilter}
      GROUP BY CASE status
        WHEN 'completed' THEN 'Completed'
        WHEN 'scheduled' THEN 'Pending'  
        WHEN 'cancelled' THEN 'Cancelled'
        ELSE 'Other'
      END
    ),
    total_sessions AS (
      SELECT SUM(count) as total FROM status_counts
    )
    SELECT 
      sc.status as name,
      sc.count as value,
      ROUND((sc.count * 100.0 / ts.total), 2) as percentage
    FROM status_counts sc
    CROSS JOIN total_sessions ts
    ORDER BY sc.count DESC
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });
  return result.map((row: any) => ({
    name: row.name,
    value: parseInt(row.value)
  }));
};

// Get Recent Activities
export const getRecentActivities = async (limit: number = 10) => {
  const query = `
    SELECT 
      'session' as type,
      CONCAT(u.name, ' completed session') as message,
      EXTRACT(EPOCH FROM (NOW() - s."createdAt"))::INTEGER as seconds_ago,
      'Clock' as icon,
      'text-green-600' as color
    FROM sessions s
    JOIN users u ON s."counselorId" = u.id
    WHERE s.status = 'completed'
    ORDER BY s."createdAt" DESC
    LIMIT ${limit}
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });
  return result.map((row: any) => {
    const secondsAgo = row.seconds_ago;
    let timeAgo;
    
    if (secondsAgo < 60) {
      timeAgo = 'Just now';
    } else if (secondsAgo < 3600) {
      timeAgo = `${Math.floor(secondsAgo / 60)} minutes ago`;
    } else if (secondsAgo < 86400) {
      timeAgo = `${Math.floor(secondsAgo / 3600)} hours ago`;
    } else {
      timeAgo = `${Math.floor(secondsAgo / 86400)} days ago`;
    }

    return {
      type: row.type,
      message: row.message,
      time: timeAgo,
      icon: row.icon,
      color: row.color
    };
  });
};

// Get Top Performing Counselors
export const getTopPerformingCounselors = async (options: { limit: number; period: string }) => {
  let dateFilter = '';
  switch (options.period) {
    case '7d':
      dateFilter = "AND s.\"createdAt\" >= NOW() - INTERVAL '7 days'";
      break;
    case '30d':
      dateFilter = "AND s.\"createdAt\" >= NOW() - INTERVAL '30 days'";
      break;
    case '3m':
      dateFilter = "AND s.\"createdAt\" >= NOW() - INTERVAL '3 months'";
      break;
  }

  const query = `
    SELECT 
      u.id,
      u.name as name,
      u.email,
      COALESCE(c.specialities[1], 'General') as specialty,
      COUNT(s.id) as sessions,
      COALESCE(AVG(f.total_score), 0) as rating,
      CASE 
        WHEN COUNT(s.id) > 0 THEN 
          ROUND((COUNT(s.id) FILTER (WHERE s.status = 'completed') * 100.0 / COUNT(s.id)), 2)
        ELSE 0 
      END as success_rate
    FROM users u
    LEFT JOIN counselors c ON u.id = c."userId"
    LEFT JOIN sessions s ON u.id = s."counselorId" ${dateFilter}
    LEFT JOIN questionnaire_results f ON s."userId" = f.user_id AND f.questionnaire_type = 'PHQ9'
    WHERE u.role IN ('Counselor', 'Psychiatrist')
    GROUP BY u.id, u.name, u.email, c.specialities
    HAVING COUNT(s.id) > 0
    ORDER BY COUNT(s.id) DESC, AVG(f.total_score) DESC NULLS LAST
    LIMIT ${options.limit}
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });
  return result.map((row: any) => ({
    name: row.name,
    sessions: parseInt(row.sessions),
    rating: parseFloat(row.rating) || 4.5,
    specialty: row.specialty
  }));
};// Get Health Status
export const getHealthStatus = async () => {
  const startTime = Date.now();
  
  // Test database connection and response time
  await sequelize.query('SELECT 1', { type: QueryTypes.SELECT });
  const responseTime = Date.now() - startTime;

  // Get database stats
  const statsQueries = await Promise.all([
    sequelize.query('SELECT COUNT(*) as active_connections FROM pg_stat_activity WHERE state = $1', {
      bind: ['active'],
      type: QueryTypes.SELECT
    }),
    sequelize.query(`
      SELECT 
        EXTRACT(EPOCH FROM (NOW() - pg_postmaster_start_time())) as uptime
    `, { type: QueryTypes.SELECT })
  ]);

  const activeConnections = parseInt((statsQueries[0][0] as { active_connections: string }).active_connections);
  const uptime = parseFloat((statsQueries[1][0] as { uptime: string }).uptime);

  // Determine health status
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (responseTime > 1000 || activeConnections > 50) {
    status = 'warning';
  }
  if (responseTime > 5000 || activeConnections > 100) {
    status = 'critical';
  }

  return {
    database_connection: true,
    api_response_time: responseTime,
    memory_usage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    cpu_usage: process.cpuUsage().user / 1000000, // seconds
    active_connections: activeConnections,
    last_backup: new Date(),
    uptime: uptime,
    status: status
  };
};