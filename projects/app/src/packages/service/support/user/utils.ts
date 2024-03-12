import { Op } from 'sequelize';

/* export dataset limit */
export const updateExportDatasetLimit = async (teamId: string) => {};
export const checkExportDatasetLimit = async ({
  teamId,
  limitMinutes = 0
}: {
  teamId: string;
  limitMinutes?: number;
}) => {
  const limitMinutesAgo = new Date(Date.now() - limitMinutes * 60 * 1000);

  // auth export times
  const authTimes = 99999;

  if (!authTimes) {
    return Promise.reject(`每个团队，每 ${limitMinutes} 分钟仅可导出一次。`);
  }
};

/* web sync limit */
export const updateWebSyncLimit = async (teamId: string) => {};
export const checkWebSyncLimit = async ({
  teamId,
  limitMinutes = 0
}: {
  teamId: string;
  limitMinutes?: number;
}) => {
  const limitMinutesAgo = new Date(Date.now() - limitMinutes * 60 * 1000);

  // auth export times
  const authTimes = 99999;

  if (!authTimes) {
    return Promise.reject(`每个团队，每 ${limitMinutes} 分钟仅使用一次同步功能。`);
  }
};
