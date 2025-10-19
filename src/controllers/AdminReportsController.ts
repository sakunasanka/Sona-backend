import { Request, Response } from 'express';
import * as reportsService from '../services/AdminReportsService';

// Get Session Analytics Report
export const getSessionAnalyticsReport = async (req: Request, res: Response) => {
  try {
    const analyticsData = await reportsService.getSessionAnalytics();
    res.status(200).json({
      success: true,
      data: analyticsData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch session analytics report'
    });
  }
};

// Get Approved Counselors Report
export const getApprovedCounselorsReport = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    const yearNum = year ? parseInt(year as string) : undefined;
    const monthNum = month ? parseInt(month as string) : undefined;

    const counselorsData = await reportsService.getApprovedCounselorsReport(yearNum, monthNum);
    res.status(200).json({
      success: true,
      data: counselorsData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch approved counselors report'
    });
  }
};

// Get Approved Psychiatrists Report
export const getApprovedPsychiatristsReport = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    const yearNum = year ? parseInt(year as string) : undefined;
    const monthNum = month ? parseInt(month as string) : undefined;

    const psychiatristsData = await reportsService.getApprovedPsychiatristsReport(yearNum, monthNum);
    res.status(200).json({
      success: true,
      data: psychiatristsData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch approved psychiatrists report'
    });
  }
};

// Get Financial Report
export const getFinancialReport = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    const yearNum = year ? parseInt(year as string) : undefined;
    const monthNum = month ? parseInt(month as string) : undefined;

    const financialData = await reportsService.getFinancialReport(yearNum, monthNum);
    res.status(200).json({
      success: true,
      data: financialData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch financial report'
    });
  }
};


