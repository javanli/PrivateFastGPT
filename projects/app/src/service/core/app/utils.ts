import { AppSimpleEditConfigTemplateType } from '@/packages/global/core/app/type';
import { GET } from '@/packages/service/common/api/plusRequest';
import { FastGPTProUrl } from '@/packages/service/common/system/constants';

export async function getSimpleTemplatesFromPlus(): Promise<AppSimpleEditConfigTemplateType[]> {
  try {
    if (!FastGPTProUrl) return [];

    return GET<AppSimpleEditConfigTemplateType[]>('/core/app/getSimpleTemplates');
  } catch (error) {
    return [];
  }
}
