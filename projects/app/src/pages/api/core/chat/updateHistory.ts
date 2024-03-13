import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { UpdateHistoryProps } from '@/global/core/chat/api.d';
import { MongoChat } from '@/packages/service/core/chat/chatSchema';

/* update chat top, custom title */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { appId, chatId, shareId, outLinkUid, customTitle, top } = req.body as UpdateHistoryProps;

    await MongoChat.update(
      { appId, chatId },
      {
        updateTime: new Date(),
        ...(customTitle !== undefined && { customTitle }),
        ...(top !== undefined && { top })
      }
    );
    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
