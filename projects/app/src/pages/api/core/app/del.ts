import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoChat } from '@/packages/service/core/chat/chatSchema';
import { MongoApp } from '@/packages/service/core/app/schema';
import { authApp } from '@/packages/service/support/permission/auth/app';
import { MongoChatItem } from '@/packages/service/core/chat/chatItemSchema';
import { mongoSessionRun } from '@/packages/service/common/mongo/sessionRun';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { appId } = req.query as { appId: string };

    if (!appId) {
      throw new Error('参数错误');
    }

    // 凭证校验
    await authApp({ req, authToken: true, appId, per: 'owner' });

    // 删除对应的聊天
    await mongoSessionRun(async (session) => {
      await MongoChatItem.deleteMany(
        {
          appId
        },
        { session }
      );
      await MongoChat.deleteMany(
        {
          appId
        },
        { session }
      );
      // delete app
      await MongoApp.deleteOne(
        {
          _id: appId
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
