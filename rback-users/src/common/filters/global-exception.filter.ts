import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Global catch-all exception filter — registered in main.ts.
 *
 * Ensures ALL unhandled errors return a consistent JSON shape:
 * { success: false, statusCode, message }
 *
 * Domain-specific filters (@UseFilters on controllers) still run FIRST
 * and take priority over this global filter. This is the safety net.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal server error occurred.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const bodyObj = body as Record<string, unknown>;
        // class-validator returns { message: string[] } — join into one string
        if (Array.isArray(bodyObj.message)) {
          message = (bodyObj.message as string[]).join('; ');
        } else if (typeof bodyObj.message === 'string') {
          message = bodyObj.message;
        }
      }
    } else {
      // Unexpected error — log full stack for debugging, never expose internals
      const detail =
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception);
      this.logger.error(
        `Unhandled exception on [${request.method} ${request.url}]`,
        detail,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
    });
  }
}
