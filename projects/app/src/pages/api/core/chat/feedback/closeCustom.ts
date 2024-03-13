import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@/packages/service/support/permission/auth/common';
import type { CloseCustomFeedbackParams } from '@/global/core/chat/api.d';
import { MongoChatItem } from '@/packages/service/core/chat/chatItemSchema';

/* remove custom feedback */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { appId, chatId, chatItemId, index } = req.body as CloseCustomFeedbackParams;

    if (!chatItemId || !appId || !chatId || !chatItemId) {
      throw new Error('missing parameter');
    }

    await authCert({ req, authToken: true });

    // TODO: feedback
    // await MongoChatItem.findOneAndUpdate(
    //   { appId, chatId, dataId: chatItemId },
    //   { $unset: { [`customFeedbacks.${index}`]: 1 } }
    // );

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
