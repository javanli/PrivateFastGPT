import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoChat } from '@/packages/service/core/chat/chatSchema';
import { ChatSourceEnum } from '@/packages/global/core/chat/constants';
import { Op } from '@/packages/service/common/mongo';

/* clear chat history */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { outLinkUid, chatIds } = req.body as {
      outLinkUid: string;
      chatIds: string[];
    };

    if (!outLinkUid) {
      throw new Error('shareId or outLinkUid is required');
    }

    const sliceIds = chatIds.slice(0, 50);

    await MongoChat.sqliteModel.update(
      {
        outLinkUid
      },
      {
        where: {
          chatId: { [Op.in]: sliceIds },
          source: ChatSourceEnum.share,
          outLinkUid: { [Op.eq]: null }
        } as any
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
