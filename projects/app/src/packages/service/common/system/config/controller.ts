import { SystemConfigsTypeEnum } from '@/packages/global/common/system/config/constants';
import { MongoSystemConfigs } from './schema';
import { FastGPTConfigFileType } from '@/packages/global/common/system/types';
import { FastGPTProUrl } from '../constants';

export const getFastGPTConfigFromDB = async () => {
  if (!FastGPTProUrl) return {} as FastGPTConfigFileType;

  const res = await MongoSystemConfigs.sqliteModel.findOne({
    where: {
      type: SystemConfigsTypeEnum.fastgpt
    },
    order: [['createTime', 'ASC']]
  });

  const config = res?.dataValues || {};

  return config as FastGPTConfigFileType;
};
