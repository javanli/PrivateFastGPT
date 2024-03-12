import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authDatasetFile } from '@/packages/service/support/permission/auth/dataset';
import { createFileToken } from '@/packages/service/support/permission/controller';
import { BucketNameEnum, FileBaseUrl } from '@/packages/global/common/file/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();

    const { fileId } = req.query as { fileId: string };

    if (!fileId) {
      throw new Error('fileId is empty');
    }

    const { teamId, tmbId } = await authDatasetFile({ req, authToken: true, fileId, per: 'r' });

    const token = await createFileToken({
      bucketName: BucketNameEnum.dataset,
      teamId,
      tmbId,
      fileId
    });

    jsonRes(res, {
      data: `${FileBaseUrl}?token=${token}`
    });
  } catch (error) {
    jsonRes(res, {
      code: 500,
      error
    });
  }
}
