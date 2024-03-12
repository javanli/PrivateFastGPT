import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { InitChatResponse, InitOutLinkChatProps } from '@/global/core/chat/api.d';
import { getGuideModule } from '@/packages/global/core/module/utils';
import { getChatModelNameListByModules } from '@/service/core/app/module';
import { ModuleOutputKeyEnum } from '@/packages/global/core/module/constants';
import { getChatItems } from '@/packages/service/core/chat/controller';
import { authOutLink } from '@/service/support/permission/auth/outLink';
import { MongoApp } from '@/packages/service/core/app/schema';
import { selectShareResponse } from '@/utils/service/core/chat';
import { AppErrEnum } from '@/packages/global/common/error/code/app';
import { MongoChat } from '@/packages/service/core/chat/chatSchema';
import { ChatErrEnum } from '@/packages/global/common/error/code/chat';
import { getDefaultTeamMember } from '@/packages/service/support/user/team/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    let { chatId, shareId, outLinkUid } = req.query as InitOutLinkChatProps;

    // auth link permission
    const { shareChat, uid, appId } = await authOutLink({ shareId, outLinkUid });

    // auth app permission
    const tmb = getDefaultTeamMember();
    const [chat, app] = await Promise.all([
      MongoChat.findOne({ appId, chatId, shareId }),
      MongoApp.findById(appId)
    ]);

    if (!app) {
      throw new Error(AppErrEnum.unExist);
    }

    // auth chat permission
    if (chat && chat.outLinkUid !== uid) {
      throw new Error(ChatErrEnum.unAuthChat);
    }

    const { history } = await getChatItems({
      appId: app._id,
      chatId,
      limit: 30,
      field: `dataId obj value userGoodFeedback userBadFeedback ${
        shareChat.responseDetail ? `adminFeedback ${ModuleOutputKeyEnum.responseData}` : ''
      } `
    });

    // pick share response field
    history.forEach((item) => {
      item.responseData = selectShareResponse({ responseData: item.responseData });
    });

    jsonRes<InitChatResponse>(res, {
      data: {
        chatId,
        appId: app._id,
        title: chat?.title || '新对话',
        //@ts-ignore
        userAvatar: tmb?.userId?.avatar,
        variables: chat?.variables || {},
        history,
        app: {
          userGuideModule: getGuideModule(app.modules),
          chatModels: getChatModelNameListByModules(app.modules),
          name: app.name,
          avatar: app.avatar,
          intro: app.intro
        }
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}

export const config = {
  api: {
    responseLimit: '10mb'
  }
};
