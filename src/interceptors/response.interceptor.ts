import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Response, Request } from "express";
import { ResponseUtil, ApiResponse } from "../util/response.util";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;

        // If the data is already in our standard format, return as is
        if (
          data &&
          typeof data === "object" &&
          "success" in data &&
          "status" in data
        ) {
          return data as ApiResponse;
        }

        // Otherwise, wrap the data in our standard format
        let message = "Operation successful";

        // Determine message based on HTTP method and status
        const request = ctx.getRequest<Request>();
        const method = request.method;
        if (method === "POST" && statusCode === 201) {
          message = "Resource created successfully";
        } else if (method === "PUT" || method === "PATCH") {
          message = "Resource updated successfully";
        } else if (method === "DELETE") {
          message = "Resource deleted successfully";
        }

        return ResponseUtil.success(data, message, statusCode);
      }),
    );
  }
}
