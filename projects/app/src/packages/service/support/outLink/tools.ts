import axios from 'axios';
import { MongoOutLink } from './schema';
import { FastGPTProUrl } from '../../common/system/constants';
import { ChatHistoryItemResType } from '@/packages/global/core/chat/type';

export const addOutLinkUsage = async ({
  shareId,
  totalPoints
}: {
  shareId: string;
  totalPoints: number;
}) => {
  await MongoOutLink.update(
    { shareId },
    {
      lastTime: new Date()
    }
  ).catch((err) => {
    console.log('update shareChat error', err);
  });
  await MongoOutLink.sqliteModel.increment('usagePoints', { by: totalPoints, where: { shareId } });
};

export const pushResult2Remote = async ({
  outLinkUid,
  shareId,
  appName,
  responseData
}: {
  outLinkUid?: string; // raw id, not parse
  shareId?: string;
  appName: string;
  responseData?: ChatHistoryItemResType[];
}) => {
  if (!shareId || !outLinkUid || !FastGPTProUrl) return;
  try {
    const outLink = await MongoOutLink.findOne({
      shareId
    });
    if (!outLink?.limit?.hookUrl) return;

    axios({
      method: 'post',
      baseURL: outLink.limit.hookUrl,
      url: '/shareAuth/finish',
      data: {
        token: outLinkUid,
        appName,
        responseData
      }
    });
  } catch (error) {}
};
