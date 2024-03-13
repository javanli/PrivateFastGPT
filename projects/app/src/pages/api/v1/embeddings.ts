import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { authCert } from '@/packages/service/support/permission/auth/common';
import { withNextCors } from '@/packages/service/common/middle/cors';
import { connectToDatabase } from '@/service/mongo';
import { getVectorsByText } from '@/packages/service/core/ai/embedding';
import { getUsageSourceByAuthType } from '@/packages/global/support/wallet/usage/tools';
import { getVectorModel } from '@/packages/service/core/ai/model';
import { checkTeamAIPoints } from '@/packages/service/support/permission/teamLimit';

type Props = {
  input: string | string[];
  model: string;
  dimensions?: number;
  billId?: string;
};

export default withNextCors(async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    let { input, model, billId } = req.body as Props;
    await connectToDatabase();

    if (!Array.isArray(input) && typeof input !== 'string') {
      throw new Error('input is nor array or string');
    }

    const query = Array.isArray(input) ? input[0] : input;

    const { teamId, tmbId, apikey, authType } = await authCert({
      req,
      authToken: true,
      authApiKey: true
    });

    await checkTeamAIPoints(teamId);

    const { charsLength, vectors } = await getVectorsByText({
      input: query,
      model: getVectorModel(model)
    });

    res.json({
      object: 'list',
      data: vectors.map((item, index) => ({
        object: 'embedding',
        index: index,
        embedding: item
      })),
      model,
      usage: {
        prompt_tokens: charsLength,
        total_tokens: charsLength
      }
    });
  } catch (err) {
    console.log(err);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
});
