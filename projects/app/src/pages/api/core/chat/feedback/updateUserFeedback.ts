import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoChatItem } from '@/packages/service/core/chat/chatItemSchema';
import { UpdateChatFeedbackProps } from '@/packages/global/core/chat/api';

/* 初始化我的聊天框，需要身份验证 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { appId, chatId, chatItemId, shareId, outLinkUid, userBadFeedback, userGoodFeedback } =
    req.body as UpdateChatFeedbackProps;

  try {
    await connectToDatabase();

    if (!chatItemId) {
      throw new Error('chatItemId is required');
    }
    // TODO: feedback
    // await MongoChatItem.findOneAndUpdate(
    //   {
    //     appId,
    //     chatId,
    //     dataId: chatItemId
    //   },
    //   {
    //     $unset: {
    //       ...(userBadFeedback === undefined && { userBadFeedback: '' }),
    //       ...(userGoodFeedback === undefined && { userGoodFeedback: '' })
    //     },
    //     $set: {
    //       ...(userBadFeedback !== undefined && { userBadFeedback }),
    //       ...(userGoodFeedback !== undefined && { userGoodFeedback })
    //     }
    //   }
    // );

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
