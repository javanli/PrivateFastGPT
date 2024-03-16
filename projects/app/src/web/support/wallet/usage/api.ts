import { GET, POST } from '@/web/common/api/request';
import { CreateTrainingUsageProps } from '@/packages/global/support/wallet/usage/api.d';
import type { PagingData, RequestPaging } from '@/types';
import type { UsageItemType } from '@/packages/global/support/wallet/usage/type';

export const getUserUsages = (data: RequestPaging) =>
  POST<PagingData<UsageItemType>>(`/proApi/support/wallet/usage/getUsage`, data);
