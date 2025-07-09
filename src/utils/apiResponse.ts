import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export class ApiResponseUtil {
  static success<T>(res: Response, data?: T, message?: string, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data?: T, message?: string): Response {
    return this.success(res, data, message, 201);
  }
}