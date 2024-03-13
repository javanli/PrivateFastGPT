import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { authCert } from '@/packages/service/support/permission/auth/common';
import { withNextCors } from '@/packages/service/common/middle/cors';
import { getUploadModel } from '@/packages/service/common/file/multer';
import { removeFilesByPaths } from '@/packages/service/common/file/utils';
import fs from 'fs';
import { getAIApi } from '@/packages/service/core/ai/config';

const upload = getUploadModel({
  maxSize: 2
});

export default withNextCors(async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  let filePaths: string[] = [];

  try {
    const {
      file,
      data: { duration }
    } = await upload.doUpload<{ duration: number; shareId?: string }>(req, res);

    filePaths = [file.path];

    const { teamId, tmbId } = await authCert({ req, authToken: true });

    if (!global.whisperModel) {
      throw new Error('whisper model not found');
    }

    if (!file) {
      throw new Error('file not found');
    }

    const ai = getAIApi();

    const result = await ai.audio.transcriptions.create({
      file: fs.createReadStream(file.path),
      model: global.whisperModel.model
    });

    jsonRes(res, {
      data: result.text
    });
  } catch (err) {
    console.log(err);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }

  removeFilesByPaths(filePaths);
});

export const config = {
  api: {
    bodyParser: false
  }
};
