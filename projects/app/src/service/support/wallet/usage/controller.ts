import { ConcatUsageProps, CreateUsageProps } from '@/packages/global/support/wallet/usage/api';
import { addLog } from '@/packages/service/common/system/log';
import { POST } from '@/packages/service/common/api/plusRequest';
import { FastGPTProUrl } from '@/packages/service/common/system/constants';

export function createUsage(data: CreateUsageProps) {
  if (!FastGPTProUrl) return;
  if (data.totalPoints === 0) {
    addLog.info('0 totalPoints', data);
  }
  try {
    POST('/support/wallet/usage/createUsage', data);
  } catch (error) {}
}
export function concatUsage(data: ConcatUsageProps) {
  if (!FastGPTProUrl) return;
  if (data.totalPoints === 0) {
    addLog.info('0 totalPoints', data);
  }
  try {
    POST('/support/wallet/usage/concatUsage', data);
  } catch (error) {}
}
