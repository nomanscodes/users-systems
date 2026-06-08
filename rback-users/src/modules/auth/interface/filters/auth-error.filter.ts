import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../../../tenants/domain/errors/domain-error.base';

/**
 * Catches DomainErrors thrown in the auth module and maps them to
 * structured HTTP responses without leaking internal domain logic.
 */
@Catch(DomainError)
export class AuthDomainErrorFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(exception.statusCode ?? HttpStatus.BAD_REQUEST).json({
      success: false,
      statusCode: exception.statusCode ?? HttpStatus.BAD_REQUEST,
      code: exception.code,
      message: exception.message,
    });
  }
}
