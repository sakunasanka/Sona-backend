import pool from '../config/db';

// Dashboard Overview
export const getDashboardOverview = async () => {
  const client = await pool.connect();
  try {
    const queries = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM "User" WHERE "userType" = $1', ['counselor']),
      client.query('SELECT COUNT(*) as count FROM "User" WHERE "userType" = $1', ['psychiatrist']),
      client.query('SELECT COUNT(*) as count FROM "User" WHERE "userType" = $1', ['client']),
      client.query('SELECT COUNT(*) as count FROM "Session"'),
      client.query('SELECT COUNT(*) as count FROM "Session" WHERE status = $1', ['completed']),
      client.query('SELECT COALESCE(SUM(amount), 0) as total FROM "Payment" WHERE status = $1', ['completed']),
      client.query('SELECT COUNT(*) as count FROM "Session" WHERE status = $1', ['ongoing']),
      client.query('SELECT COUNT(*) as count FROM "Session" WHERE status = $1', ['scheduled'])
    ]);

    return {
      totalCounselors: parseInt(queries[0].rows[0].count),
      totalPsychiatrists: parseInt(queries[1].rows[0].count),
      totalClients: parseInt(queries[2].rows[0].count),
      totalSessions: parseInt(queries[3].rows[0].count),
      completedSessions: parseInt(queries[4].rows[0].count),
      totalRevenue: parseFloat(queries[5].rows[0].total),
      ongoingSessions: parseInt(queries[6].rows[0].count),
      scheduledSessions: parseInt(queries[7].rows[0].count)
    };
  } finally {
    client.release();
  }
};

// Get Counselor Count
export const getCounselorCount = async (): Promise<number> => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT COUNT(*) as count FROM "User" WHERE "userType" = $1', ['counselor']);
    return parseInt(result.rows[0].count);
  } finally {
    client.release();
  }
};

// Get Psychiatrist Count
export const getPsychiatristCount = async (): Promise<number> => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT COUNT(*) as count FROM "User" WHERE "userType" = $1', ['psychiatrist']);
    return parseInt(result.rows[0].count);
  } finally {
    client.release();
  }
};

// Get Total Session Count
export const getTotalSessionCount = async (): Promise<number> => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT COUNT(*) as count FROM "Session"');
    return parseInt(result.rows[0].count);
  } finally {
    client.release();
  }
};

// Get Total Revenue
export const getTotalRevenue = async (): Promise<number> => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT COALESCE(SUM(amount), 0) as total FROM "Payment" WHERE status = $1', ['completed']);
    return parseFloat(result.rows[0].total);
  } finally {
    client.release();
  }
};

// Get Login Statistics
export const getLoginStatistics = async (period: string = '30d') => {
  const client = await pool.connect();
  try {
    let dateFilter = '';
    switch (period) {
      case '7d':
        dateFilter = "AND \"loginTime\" >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "AND \"loginTime\" >= NOW() - INTERVAL '30 days'";
        break;
      case '3m':
        dateFilter = "AND \"loginTime\" >= NOW() - INTERVAL '3 months'";
        break;
      case '6m':
        dateFilter = "AND \"loginTime\" >= NOW() - INTERVAL '6 months'";
        break;
      case '1y':
        dateFilter = "AND \"loginTime\" >= NOW() - INTERVAL '1 year'";
        break;
    }

    const query = `
      SELECT 
        u."userType",
        COUNT(*) as login_count
      FROM "LoginLog" l
      JOIN "User" u ON l."userId" = u.id
      WHERE 1=1 ${dateFilter}
      GROUP BY u."userType"
    `;

    const result = await client.query(query);
    
    const loginStats = {
      counselorLogins: 0,
      psychiatristLogins: 0,
      clientLogins: 0,
      managementLogins: 0,
      totalLogins: 0
    };

    result.rows.forEach((row: any) => {
      const count = parseInt(row.login_count);
      loginStats.totalLogins += count;
      
      switch (row.userType) {
        case 'counselor':
          loginStats.counselorLogins = count;
          break;
        case 'psychiatrist':
          loginStats.psychiatristLogins = count;
          break;
        case 'client':
          loginStats.clientLogins = count;
          break;
        case 'admin':
        case 'management':
          loginStats.managementLogins += count;
          break;
      }
    });

    return loginStats;
  } finally {
    client.release();
  }
};

// Get Session Breakdown
export const getSessionBreakdown = async () => {
  const client = await pool.connect();
  try {
    const queries = await Promise.all([
      client.query(`
        SELECT COUNT(*) as count 
        FROM "Session" s 
        JOIN "User" u ON s."providerId" = u.id 
        WHERE u."userType" = 'counselor'
      `),
      client.query(`
        SELECT COUNT(*) as count 
        FROM "Session" s 
        JOIN "User" u ON s."providerId" = u.id 
        WHERE u."userType" = 'psychiatrist'
      `),
      client.query('SELECT COUNT(*) as count FROM "Session" WHERE status = $1', ['completed']),
      client.query('SELECT COUNT(*) as count FROM "Session" WHERE status = $1', ['ongoing']),
      client.query('SELECT COUNT(*) as count FROM "Session" WHERE status = $1', ['scheduled']),
      client.query('SELECT COUNT(*) as count FROM "Session" WHERE status = $1', ['cancelled']),
      client.query('SELECT COUNT(*) as count FROM "Session"')
    ]);

    return {
      counselorSessions: parseInt(queries[0].rows[0].count),
      psychiatristSessions: parseInt(queries[1].rows[0].count),
      completedSessions: parseInt(queries[2].rows[0].count),
      ongoingSessions: parseInt(queries[3].rows[0].count),
      scheduledSessions: parseInt(queries[4].rows[0].count),
      cancelledSessions: parseInt(queries[5].rows[0].count),
      totalSessions: parseInt(queries[6].rows[0].count)
    };
  } finally {
    client.release();
  }
};

// Get Monthly User Growth
export const getMonthlyUserGrowth = async (months: number = 5) => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        TO_CHAR("createdAt", 'Mon YYYY') as month,
        COUNT(*) FILTER (WHERE "userType" = 'counselor') as counselors,
        COUNT(*) FILTER (WHERE "userType" = 'psychiatrist') as psychiatrists,
        COUNT(*) FILTER (WHERE "userType" = 'client') as clients,
        COUNT(*) as total
      FROM "User" 
      WHERE "createdAt" >= NOW() - INTERVAL '${months} months'
      GROUP BY TO_CHAR("createdAt", 'Mon YYYY'), DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt")
    `;

    const result = await client.query(query);
    return result.rows.map((row: any) => ({
      month: row.month,
      counselors: parseInt(row.counselors) || 0,
      psychiatrists: parseInt(row.psychiatrists) || 0,
      clients: parseInt(row.clients) || 0,
      total: parseInt(row.total)
    }));
  } finally {
    client.release();
  }
};

// Get Daily Session Data
export const getDailySessionData = async (days: number = 7) => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        DATE(s."createdAt") as date,
        COUNT(*) FILTER (WHERE u."userType" = 'counselor') as counselor,
        COUNT(*) FILTER (WHERE u."userType" = 'psychiatrist') as psychiatrist,
        COUNT(*) as total
      FROM "Session" s
      JOIN "User" u ON s."providerId" = u.id
      WHERE s."createdAt" >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(s."createdAt")
      ORDER BY DATE(s."createdAt")
    `;

    const result = await client.query(query);
    return result.rows.map((row: any) => ({
      date: row.date,
      counselor: parseInt(row.counselor) || 0,
      psychiatrist: parseInt(row.psychiatrist) || 0,
      total: parseInt(row.total)
    }));
  } finally {
    client.release();
  }
};

// Get Monthly Growth Data
export const getMonthlyGrowthData = async (months: number = 6) => {
  const client = await pool.connect();
  try {
    const query = `
      WITH monthly_stats AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', u."createdAt"), 'Mon YYYY') as month,
          DATE_TRUNC('month', u."createdAt") as month_date,
          COUNT(DISTINCT u.id) as users,
          COUNT(DISTINCT s.id) as sessions,
          COALESCE(SUM(p.amount), 0) as revenue
        FROM "User" u
        LEFT JOIN "Session" s ON s."clientId" = u.id OR s."providerId" = u.id
        LEFT JOIN "Payment" p ON p."sessionId" = s.id AND p.status = 'completed'
        WHERE u."createdAt" >= NOW() - INTERVAL '${months} months'
        GROUP BY DATE_TRUNC('month', u."createdAt")
        ORDER BY DATE_TRUNC('month', u."createdAt")
      ),
      growth_calc AS (
        SELECT 
          *,
          LAG(users) OVER (ORDER BY month_date) as prev_users
        FROM monthly_stats
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

    const result = await client.query(query);
    return result.rows.map((row: any) => ({
      month: row.month,
      users: parseInt(row.users),
      sessions: parseInt(row.sessions),
      revenue: parseFloat(row.revenue),
      growth_rate: parseFloat(row.growth_rate) || 0
    }));
  } finally {
    client.release();
  }
};

// Get Sessions by Specialty
export const getSessionsBySpecialty = async (period: string = '30d') => {
  const client = await pool.connect();
  try {
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
          COALESCE(c.specialty, p.specialty, 'General') as specialty,
          COUNT(*) as sessions
        FROM "Session" s
        LEFT JOIN "Counselor" c ON s."providerId" = c."userId"
        LEFT JOIN "Psychiatrist" p ON s."providerId" = p."userId"
        WHERE 1=1 ${dateFilter}
        GROUP BY COALESCE(c.specialty, p.specialty, 'General')
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

    const result = await client.query(query);
    return result.rows.map((row: any) => ({
      name: row.specialty,
      value: parseInt(row.sessions),
      percentage: parseFloat(row.percentage)
    }));
  } finally {
    client.release();
  }
};

// Get User Age Distribution
export const getUserAgeDistribution = async () => {
  const client = await pool.connect();
  try {
    const query = `
      WITH age_groups AS (
        SELECT 
          CASE 
            WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) < 18 THEN 'Under 18'
            WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) BETWEEN 18 AND 25 THEN 'Clients (18-25)'
            WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) BETWEEN 26 AND 35 THEN 'Clients (26-35)'
            WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) BETWEEN 36 AND 50 THEN 'Clients (36-50)'
            WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) > 50 THEN 'Clients (50+)'
            ELSE 'Unknown'
          END as age_group,
          COUNT(*) as count
        FROM "User" 
        WHERE "dateOfBirth" IS NOT NULL AND "userType" = 'client'
        GROUP BY 
          CASE 
            WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) < 18 THEN 'Under 18'
            WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) BETWEEN 18 AND 25 THEN 'Clients (18-25)'
            WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) BETWEEN 26 AND 35 THEN 'Clients (26-35)'
            WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) BETWEEN 36 AND 50 THEN 'Clients (36-50)'
            WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) > 50 THEN 'Clients (50+)'
            ELSE 'Unknown'
          END
      ),
      total_users AS (
        SELECT SUM(count) as total FROM age_groups
      )
      SELECT 
        ag.age_group as name,
        ag.count as value,
        ROUND((ag.count * 100.0 / tu.total), 2) as percentage
      FROM age_groups ag
      CROSS JOIN total_users tu
      ORDER BY 
        CASE ag.age_group
          WHEN 'Under 18' THEN 1
          WHEN 'Clients (18-25)' THEN 2
          WHEN 'Clients (26-35)' THEN 3
          WHEN 'Clients (36-50)' THEN 4
          WHEN 'Clients (50+)' THEN 5
          ELSE 6
        END
    `;

    const result = await client.query(query);
    return result.rows.map((row: any) => ({
      name: row.name,
      value: parseInt(row.value)
    }));
  } finally {
    client.release();
  }
};

// Get Session Status Distribution
export const getSessionStatusDistribution = async (period: string = '30d') => {
  const client = await pool.connect();
  try {
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
        FROM "Session" 
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

    const result = await client.query(query);
    return result.rows.map((row: any) => ({
      name: row.name,
      value: parseInt(row.value)
    }));
  } finally {
    client.release();
  }
};

// Get Recent Activities
export const getRecentActivities = async (limit: number = 10) => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        'session' as type,
        CONCAT(u."firstName", ' ', u."lastName", ' completed session') as message,
        EXTRACT(EPOCH FROM (NOW() - s."createdAt"))::INTEGER as seconds_ago,
        'Clock' as icon,
        'text-green-600' as color
      FROM "Session" s
      JOIN "User" u ON s."providerId" = u.id
      WHERE s.status = 'completed'
      ORDER BY s."createdAt" DESC
      LIMIT $1
    `;

    const result = await client.query(query, [limit]);
    return result.rows.map((row: any) => {
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
  } finally {
    client.release();
  }
};

// Get Top Performing Counselors
export const getTopPerformingCounselors = async (options: { limit: number; period: string }) => {
  const client = await pool.connect();
  try {
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
        CONCAT(u."firstName", ' ', u."lastName") as name,
        u.email,
        COALESCE(c.specialty, 'General') as specialty,
        COUNT(s.id) as sessions,
        COALESCE(AVG(f.rating), 0) as rating,
        CASE 
          WHEN COUNT(s.id) > 0 THEN 
            ROUND((COUNT(s.id) FILTER (WHERE s.status = 'completed') * 100.0 / COUNT(s.id)), 2)
          ELSE 0 
        END as success_rate
      FROM "User" u
      LEFT JOIN "Counselor" c ON u.id = c."userId"
      LEFT JOIN "Session" s ON u.id = s."providerId" ${dateFilter}
      LEFT JOIN "QuestionnaireResult" f ON s.id = f."sessionId"
      WHERE u."userType" IN ('counselor', 'psychiatrist')
      GROUP BY u.id, u."firstName", u."lastName", u.email, c.specialty
      HAVING COUNT(s.id) > 0
      ORDER BY COUNT(s.id) DESC, AVG(f.rating) DESC NULLS LAST
      LIMIT $1
    `;

    const result = await client.query(query, [options.limit]);
    return result.rows.map((row: any) => ({
      name: row.name,
      sessions: parseInt(row.sessions),
      rating: parseFloat(row.rating) || 4.5,
      specialty: row.specialty
    }));
  } finally {
    client.release();
  }
};

// Get Health Status
export const getHealthStatus = async () => {
  const client = await pool.connect();
  try {
    const startTime = Date.now();
    
    // Test database connection and response time
    await client.query('SELECT 1');
    const responseTime = Date.now() - startTime;

    // Get database stats
    const statsQueries = await Promise.all([
      client.query('SELECT COUNT(*) as active_connections FROM pg_stat_activity WHERE state = $1', ['active']),
      client.query(`
        SELECT 
          EXTRACT(EPOCH FROM (NOW() - pg_postmaster_start_time())) as uptime
      `)
    ]);

    const activeConnections = parseInt(statsQueries[0].rows[0].active_connections);
    const uptime = parseFloat(statsQueries[1].rows[0].uptime);

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
  } catch (error) {
    return {
      database_connection: false,
      api_response_time: 0,
      memory_usage: 0,
      cpu_usage: 0,
      active_connections: 0,
      last_backup: new Date(),
      uptime: 0,
      status: 'critical' as const
    };
  } finally {
    client.release();
  }
};