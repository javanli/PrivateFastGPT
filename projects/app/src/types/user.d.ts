import { UsageSourceEnum } from '@/packages/global/support/wallet/usage/constants';
import type { UserModelSchema } from '@/packages/global/support/user/type';

export interface UserUpdateParams {
  balance?: number;
  avatar?: string;
  timezone?: string;
  openaiAccount?: UserModelSchema['openaiAccount'];
}
