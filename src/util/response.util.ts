export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  status: number;
}

export class ResponseUtil {
  static success<T>(
    data: T,
    message: string = "Operation successful",
    status: number = 200,
  ): ApiResponse<T> {
    return {
      success: true,
      status,
      message,
      data,
    };
  }

  static error(
    message: string = "Operation failed",
    status: number = 500,
    data: null = null,
  ): ApiResponse<null> {
    return {
      success: false,
      status,
      message,
      data,
    };
  }
}
