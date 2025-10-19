import { Request, Response, NextFunction } from 'express';

// Simple validation middleware for dashboard queries
export const validateDashboardQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { period, limit, months, days } = req.query;
  const errors: string[] = [];

  // Validate period
  if (period && !['7d', '30d', '3m', '6m', '1y', 'all'].includes(period as string)) {
    errors.push('Period must be one of: 7d, 30d, 3m, 6m, 1y, all');
  }

  // Validate limit
  if (limit) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be an integer between 1 and 100');
    }
  }

  // Validate months
  if (months) {
    const monthsNum = parseInt(months as string);
    if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 12) {
      errors.push('Months must be an integer between 1 and 12');
    }
  }

  // Validate days
  if (days) {
    const daysNum = parseInt(days as string);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      errors.push('Days must be an integer between 1 and 365');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
    return;
  }

  next();
};

// Date range validation middleware
export const validateDateRange = (req: Request, res: Response, next: NextFunction): void => {
  const { startDate, endDate } = req.query;
  const errors: string[] = [];

  // Validate startDate format
  if (startDate && isNaN(Date.parse(startDate as string))) {
    errors.push('Start date must be a valid date');
  }

  // Validate endDate format
  if (endDate && isNaN(Date.parse(endDate as string))) {
    errors.push('End date must be a valid date');
  }

  // Check if endDate is after startDate
  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    if (end <= start) {
      errors.push('End date must be after start date');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
    return;
  }

  next();
};

// Handle validation errors (compatibility function)
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  // This is now just a pass-through since validation is handled above
  next();
};

// Sanitization middleware
export const sanitizeQuery = (req: Request, res: Response, next: NextFunction): void => {
  // Remove any potentially harmful characters from query parameters
  Object.keys(req.query || {}).forEach(key => {
    if (typeof req.query![key] === 'string') {
      req.query![key] = (req.query![key] as string)
        .replace(/[<>\"'%;()&+]/g, '') // Remove potentially harmful characters
        .trim();
    }
  });
  
  next();
};

// Business rules validation
export const validateBusinessRules = (req: Request, res: Response, next: NextFunction): void => {
  const { startDate, endDate, period } = req.query || {};
  
  // If custom date range is provided, it should not exceed 1 year
  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 365 days'
      });
      return;
    }
  }
  
  // Validate period against current date
  if (period) {
    const validPeriods = ['7d', '30d', '3m', '6m', '1y', 'all'];
    if (!validPeriods.includes(period as string)) {
      res.status(400).json({
        success: false,
        message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`
      });
      return;
    }
  }
  
  next();
};