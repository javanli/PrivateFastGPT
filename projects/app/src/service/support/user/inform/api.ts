import { POST } from '@/packages/service/common/api/plusRequest';
import { SendInformProps } from '@/packages/global/support/user/inform/type';
import { FastGPTProUrl } from '@/packages/service/common/system/constants';

export function sendOneInform(data: SendInformProps) {
  if (!FastGPTProUrl) return;
  return POST('/support/user/inform/create', data);
}
