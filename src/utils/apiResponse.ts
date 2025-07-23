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
  
  static notFound(res: Response, message: string = 'Resource not found'): Response {
    const response: ApiResponse = {
      success: false,
      message,
      statusCode: 404,
    };
    
    return res.status(404).json(response);
  }
}