import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoChatItem } from '@/packages/service/core/chat/chatItemSchema';
import type { DeleteChatItemProps } from '@/global/core/chat/api.d';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { appId, chatId, contentId, shareId, outLinkUid } = req.query as DeleteChatItemProps;

    if (!contentId || !chatId) {
      return jsonRes(res);
    }

    await MongoChatItem.deleteOne({
      appId,
      chatId,
      dataId: contentId
    });

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
