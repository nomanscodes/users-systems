import { DomainError } from './domain-error.base';

export class AdminEmailAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(
      `User with email "${email}" already exists.`,
      'ADMIN_EMAIL_EXISTS',
      409,
    );
  }
}
