import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../../domain/errors/domain-error.base';

/**
 * Catches domain errors thrown from use-cases and maps them to HTTP responses.
 * Keeps domain logic out of the controller layer.
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(exception.statusCode).json({
      success: false,
      statusCode: exception.statusCode,
      code: exception.code,
      message: exception.message,
    });
  }
}
