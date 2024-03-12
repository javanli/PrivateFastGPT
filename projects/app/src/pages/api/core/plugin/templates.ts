import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@/packages/service/support/permission/auth/common';
import { MongoPlugin } from '@/packages/service/core/plugin/schema';
import { FlowNodeTypeEnum } from '@/packages/global/core/module/node/constant';
import { FlowModuleTemplateType } from '@/packages/global/core/module/type';
import { ModuleTemplateTypeEnum } from '@/packages/global/core/module/constants';
import { GET } from '@/packages/service/common/api/plusRequest';
import type { PluginTemplateType } from '@/packages/global/core/plugin/type.d';
import { FastGPTProUrl } from '@/packages/service/common/system/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { teamId } = await authCert({ req, authToken: true });

    const [userPlugins, plusPlugins] = await Promise.all([
      MongoPlugin.find({ teamId }),
      FastGPTProUrl ? GET<PluginTemplateType[]>('/core/plugin/getTemplates') : []
    ]);

    const data: FlowModuleTemplateType[] = [
      ...userPlugins.map((plugin) => ({
        id: String(plugin._id),
        templateType: ModuleTemplateTypeEnum.personalPlugin,
        flowType: FlowNodeTypeEnum.pluginModule,
        avatar: plugin.avatar,
        name: plugin.name,
        intro: plugin.intro,
        showStatus: false,
        inputs: [],
        outputs: []
      })),
      ...(global.communityPlugins?.map((plugin) => ({
        id: plugin.id,
        templateType: plugin.templateType ?? ModuleTemplateTypeEnum.other,
        flowType: FlowNodeTypeEnum.pluginModule,
        avatar: plugin.avatar,
        name: plugin.name,
        intro: plugin.intro,
        showStatus: true,
        inputs: [],
        outputs: []
      })) || [])
    ];

    jsonRes<FlowModuleTemplateType[]>(res, {
      data
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
