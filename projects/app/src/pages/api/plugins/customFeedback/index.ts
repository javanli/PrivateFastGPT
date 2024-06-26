import type { NextApiRequest, NextApiResponse } from 'next';
import type { HttpBodyType } from '@/packages/global/core/module/api.d';
import { getErrText } from '@/packages/global/common/error/utils';
import { addCustomFeedbacks } from '@/packages/service/core/chat/controller';
import { authRequestFromLocal } from '@/packages/service/support/permission/auth/common';

type Props = HttpBodyType<{
  appId: string;
  chatId?: string;
  responseChatItemId?: string;
  defaultFeedback: string;
  customFeedback: string;
}>;

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const {
      appId,
      chatId,
      responseChatItemId: chatItemId,
      defaultFeedback,
      customFeedback
    } = req.body as Props;

    await authRequestFromLocal({ req });

    const feedback = customFeedback || defaultFeedback;

    if (!feedback) {
      return res.json({
        response: ''
      });
    }

    // wait the chat finish
    setTimeout(() => {
      addCustomFeedbacks({
        appId,
        chatId,
        chatItemId,
        feedbacks: [feedback]
      });
    }, 60000);

    if (!chatId || !chatItemId) {
      return res.json({
        response: `\\n\\n**自动反馈调试**: ${feedback}\\n\\n`
      });
    }

    return res.json({
      response: ''
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(getErrText(err));
  }
}
