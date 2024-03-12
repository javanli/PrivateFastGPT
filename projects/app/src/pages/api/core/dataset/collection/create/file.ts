import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { delFileByFileIdList, uploadFile } from '@/packages/service/common/file/gridfs/controller';
import { getUploadModel } from '@/packages/service/common/file/multer';
import { authDataset } from '@/packages/service/support/permission/auth/dataset';
import { FileCreateDatasetCollectionParams } from '@/packages/global/core/dataset/api';
import { removeFilesByPaths } from '@/packages/service/common/file/utils';
import { createOneCollection } from '@/packages/service/core/dataset/collection/controller';
import { DatasetCollectionTypeEnum } from '@/packages/global/core/dataset/constants';
import { BucketNameEnum } from '@/packages/global/common/file/constants';

/**
 * Creates the multer uploader
 */
const upload = getUploadModel({
  maxSize: 500 * 1024 * 1024
});

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  let filePaths: string[] = [];
  let fileId: string = '';
  const { datasetId } = req.query as { datasetId: string };

  try {
    await connectToDatabase();

    const { teamId, tmbId } = await authDataset({
      req,
      authToken: true,
      authApiKey: true,
      per: 'w',
      datasetId
    });

    const { file, bucketName, data } = await upload.doUpload<FileCreateDatasetCollectionParams>(
      req,
      res
    );
    filePaths = [file.path];

    if (!file || !bucketName) {
      throw new Error('file is empty');
    }

    const { fileMetadata, collectionMetadata, ...collectionData } = data;

    // upload file and create collection
    fileId = await uploadFile({
      teamId,
      tmbId,
      bucketName,
      path: file.path,
      filename: file.originalname,
      contentType: file.mimetype,
      metadata: fileMetadata
    });

    // create collection
    const { _id: collectionId } = await createOneCollection({
      ...collectionData,
      metadata: collectionMetadata,
      teamId,
      tmbId,
      type: DatasetCollectionTypeEnum.file,
      fileId
    });

    jsonRes(res, {
      data: collectionId
    });
  } catch (error) {
    if (fileId) {
      try {
        await delFileByFileIdList({
          fileIdList: [fileId],
          bucketName: BucketNameEnum.dataset
        });
      } catch (error) {}
    }
    jsonRes(res, {
      code: 500,
      error
    });
  }

  removeFilesByPaths(filePaths);
}

export const config = {
  api: {
    bodyParser: false
  }
};
