import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoChat } from '@/packages/service/core/chat/chatSchema';
import type { ChatHistoryItemType } from '@/packages/global/core/chat/type.d';
import { ChatSourceEnum } from '@/packages/global/core/chat/constants';
import { getHistoriesProps } from '@/global/core/chat/api';
import { authOutLink } from '@/service/support/permission/auth/outLink';
import { authCert } from '@/packages/service/support/permission/auth/common';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { appId, shareId, outLinkUid } = req.body as getHistoriesProps;

    const limit = shareId && outLinkUid ? 20 : 30;

    const match = await (async () => {
      if (shareId && outLinkUid) {
        const { uid } = await authOutLink({ shareId, outLinkUid });

        return {
          shareId,
          outLinkUid: uid,
          source: ChatSourceEnum.share,
          updateTime: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        };
      }
      if (appId && outLinkUid) {
        return {
          shareId,
          outLinkUid: outLinkUid,
          source: ChatSourceEnum.team
        };
      }
      if (appId) {
        const { tmbId } = await authCert({ req, authToken: true });
        return {
          tmbId,
          appId,
          source: ChatSourceEnum.online
        };
      }

      return Promise.reject('Params are error');
    })();

    const data = (
      await MongoChat.sqliteModel.findAll({
        where: match,
        order: [
          ['top', 'DESC'],
          ['updateTime', 'DESC']
        ],
        limit
      })
    ).map((item) => item.dataValues);

    jsonRes<ChatHistoryItemType[]>(res, {
      data: data.map((item) => ({
        chatId: item.chatId,
        updateTime: item.updateTime,
        appId: item.appId,
        customTitle: item.customTitle,
        title: item.title,
        top: item.top
      }))
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
