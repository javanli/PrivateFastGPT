import { BucketNameEnum } from '@fastgpt/global/common/file/constants';
import fsp from 'fs/promises';
import fs from 'fs';
import os from 'os';
import pathUtil from 'path';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { FileInfoTable } from './schema';

const gptPath = pathUtil.join(os.homedir(), '.gpt');
/* crud  file */
export async function uploadFile({
  bucketName,
  teamId,
  tmbId,
  path,
  filename,
  contentType,
  metadata = {}
}: {
  bucketName: `${BucketNameEnum}`;
  teamId: string;
  tmbId: string;
  path: string;
  filename: string;
  contentType?: string;
  metadata?: Record<string, any>;
}) {
  if (!path) return Promise.reject(`filePath is empty`);
  if (!filename) return Promise.reject(`filename is empty`);

  const stats = await fsp.stat(path);
  if (!stats.isFile()) return Promise.reject(`${path} is not a file`);

  metadata.teamId = teamId;
  metadata.tmbId = tmbId;

  const bucketPath = pathUtil.join(gptPath, bucketName);

  try {
    await fsp.stat(bucketPath);
  } catch (error) {
    fs.mkdirSync(bucketPath, { recursive: true });
  }
  const fileId = getNanoid(28);
  const targetPath = pathUtil.join(bucketPath, fileId);
  await fsp.copyFile(path, targetPath);
  FileInfoTable.create({
    teamId,
    tmbId,
    fileId,
    fileName: filename,
    contentType: contentType ?? ''
  });

  return fileId;
}

export async function getFileById({
  bucketName,
  fileId
}: {
  bucketName: `${BucketNameEnum}`;
  fileId: string;
}) {
  const fileInfo = await FileInfoTable.findOne({
    fileId
  });
  return fileInfo;
}

export async function delFileByFileIdList({
  bucketName,
  fileIdList,
  retry = 3
}: {
  bucketName: `${BucketNameEnum}`;
  fileIdList: string[];
  retry?: number;
}) {
  try {
    for (const fileId of fileIdList) {
      const targetPath = pathUtil.join(gptPath, bucketName, fileId);
      if (fs.existsSync(targetPath)) {
        await FileInfoTable.destroy({
          fileId
        });
        fs.rmSync(targetPath);
      }
    }
  } catch (error) {
    if (retry > 0) {
      await delFileByFileIdList({ bucketName, fileIdList, retry: retry - 1 });
    }
  }
}

export function getDownloadStream({
  bucketName,
  fileId
}: {
  bucketName: `${BucketNameEnum}`;
  fileId: string;
}) {
  const targetPath = pathUtil.join(gptPath, bucketName, fileId);
  const fileStream = fs.createReadStream(targetPath);

  return fileStream;
}
