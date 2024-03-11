import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import type { PagingData } from '@/types';
import { AppLogsListItemType } from '@/types/app';
import { addDays } from 'date-fns';
import type { GetAppChatLogsParams } from '@/global/core/api/appReq.d';
import { authApp } from '@fastgpt/service/support/permission/auth/app';
import { ChatItemCollectionName, MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { Op } from '@fastgpt/service/common/mongo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const {
      pageNum = 1,
      pageSize = 20,
      appId,
      dateStart = addDays(new Date(), -7),
      dateEnd = new Date()
    } = req.body as GetAppChatLogsParams;

    if (!appId) {
      throw new Error('缺少参数');
    }

    // 凭证校验
    const { teamId } = await authApp({ req, authToken: true, appId, per: 'w' });

    const where = {
      teamId: teamId,
      appId: appId,
      updateTime: {
        $gte: new Date(dateStart),
        $lte: new Date(dateEnd)
      }
    };
    // export type AppLogsListItemType = {
    //   _id: string;
    //   id: string;
    //   source: ChatSchema['source'];
    //   time: Date;
    //   title: string;
    //   messageCount: number;
    //   userGoodFeedbackCount: number;
    //   userBadFeedbackCount: number;
    //   customFeedbacksCount: number;
    //   markCount: number;
    // };

    const total = await MongoChat.sqliteModel.count({
      where: {
        teamId: teamId,
        appId: appId,
        updateTime: {
          [Op.between]: [new Date(dateStart), new Date(dateEnd)]
        }
      }
    });
    const chats = (
      await MongoChat.sqliteModel.findAll({
        where: {
          teamId: teamId,
          appId: appId,
          updateTime: {
            [Op.between]: [new Date(dateStart), new Date(dateEnd)]
          }
        },
        order: [
          ['userBadFeedbackCount', 'DESC'],
          ['userGoodFeedbackCount', 'DESC'],
          ['customFeedbacksCount', 'DESC'],
          ['updateTime', 'DESC']
        ],
        offset: (pageNum - 1) * pageSize,
        limit: pageSize
      })
    ).map((item) => item.dataValues);
    const data: AppLogsListItemType[] = chats.map((chat) => {
      return {
        ...chat,
        id: chat.chatId,
        time: chat.updateTime,
        messageCount: 0,
        userGoodFeedbackCount: 0,
        userBadFeedbackCount: 0,
        customFeedbacksCount: 0,
        markCount: 0
      };
    });
    for (const item of data) {
      item.messageCount = await MongoChatItem.sqliteModel.count({
        where: {
          appId,
          chatId: item.id
        }
      });
      item.userGoodFeedbackCount = await MongoChatItem.sqliteModel.count({
        where: {
          appId,
          chatId: item.id,
          userGoodFeedback: {
            [Op.not]: null
          }
        } as any
      });
      item.userBadFeedbackCount = await MongoChatItem.sqliteModel.count({
        where: {
          appId,
          chatId: item.id,
          userBadFeedback: {
            [Op.not]: null
          }
        } as any
      });
      item.customFeedbacksCount = await MongoChatItem.sqliteModel.count({
        where: {
          appId,
          chatId: item.id,
          customFeedbacks: {
            [Op.not]: null
          }
        } as any
      });
      item.markCount = await MongoChatItem.sqliteModel.count({
        where: {
          appId,
          chatId: item.id,
          adminFeedback: {
            [Op.not]: null
          }
        } as any
      });
    }

    jsonRes<PagingData<AppLogsListItemType>>(res, {
      data: {
        pageNum,
        pageSize,
        data,
        total
      }
    });
  } catch (error) {
    jsonRes(res, {
      code: 500,
      error
    });
  }
}
