import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoChat } from '@/packages/service/core/chat/chatSchema';
import { MongoChatItem } from '@/packages/service/core/chat/chatItemSchema';
import { DelHistoryProps } from '@/global/core/chat/api';
import { mongoSessionRun } from '@/packages/service/common/mongo/sessionRun';

/* clear chat history */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { appId, chatId, shareId, outLinkUid } = req.query as DelHistoryProps;

    await mongoSessionRun(async (session) => {
      await MongoChatItem.deleteMany(
        {
          appId,
          chatId
        },
        { session }
      );
      await MongoChat.destroy(
        {
          appId,
          chatId
        },
        { session }
      );
    });

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
