import { getSystemInitData } from '@/web/common/system/api';
import { delay } from '@/packages/global/common/system/utils';
import type { FastGPTFeConfigsType } from '@/packages/global/common/system/types/index.d';

import { useSystemStore } from './useSystemStore';

export const clientInitData = async (
  retry = 3
): Promise<{
  feConfigs: FastGPTFeConfigsType;
}> => {
  try {
    const res = await getSystemInitData();
    useSystemStore.getState().initStaticData(res);

    return {
      feConfigs: res.feConfigs
    };
  } catch (error) {
    if (retry > 0) {
      await delay(500);
      return clientInitData(retry - 1);
    }
    return Promise.reject(error);
  }
};
