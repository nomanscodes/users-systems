import { SetMetadata } from '@nestjs/common';

export const ACTION_KEY = 'action';

export interface ActionRequirements {
  path: string;
  action: string;
}

export const RequireAction = (path: string, action: string) =>
  SetMetadata(ACTION_KEY, { path, action });
