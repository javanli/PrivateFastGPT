import { AuthUserTypeEnum } from '@/packages/global/support/permission/constant';
import { parseHeaderCert } from '../controller';
import { AuthModeType } from '../type';
import { SERVICE_LOCAL_HOST } from '../../../common/system/tools';

export const authCert = async (props: AuthModeType) => {
  const result = await parseHeaderCert(props);

  return {
    ...result,
    isOwner: true,
    canWrite: true
  };
};
export async function authCertOrShareId({
  shareId,
  ...props
}: AuthModeType & { shareId?: string }) {
  return authCert(props);
}

/* auth the request from local service */
export const authRequestFromLocal = ({ req }: AuthModeType) => {
  if (req.headers.host !== SERVICE_LOCAL_HOST) {
    return Promise.reject('Invalid request');
  }
};
