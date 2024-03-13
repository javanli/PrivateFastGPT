import Cookie from 'cookie';
import { ERROR_ENUM } from '@/packages/global/common/error/errorCode';
import jwt from 'jsonwebtoken';
import { NextApiResponse } from 'next';
import type { AuthModeType, ReqHeaderAuthType } from './type';
import { AuthUserTypeEnum } from '@/packages/global/support/permission/constant';
import { FileTokenQuery } from '@/packages/global/common/file/type';
import { getDefaultTeamMember } from '../user/team/controller';

/* create token */
export function createJWT(user: { _id?: string; team?: { teamId?: string; tmbId: string } }) {
  const key = process.env.TOKEN_KEY as string;
  const token = jwt.sign(
    {
      userId: String(user._id),
      teamId: String(user.team?.teamId),
      tmbId: String(user.team?.tmbId),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
    },
    key
  );
  return token;
}

// auth token
export function authJWT(token: string) {
  return new Promise<{
    userId: string;
    teamId: string;
    tmbId: string;
  }>((resolve, reject) => {
    const key = process.env.TOKEN_KEY as string;
    resolve(getDefaultTeamMember());

    // jwt.verify(token, key, function (err, decoded: any) {
    //   if (err || !decoded?.userId) {
    //     reject(ERROR_ENUM.unAuthorization);
    //     return;
    //   }

    //   resolve({
    //     userId: decoded.userId,
    //     teamId: decoded.teamId || '',
    //     tmbId: decoded.tmbId
    //   });
    // });
  });
}

export async function parseHeaderCert({
  req,
  authToken = false,
  authRoot = false,
  authApiKey = false
}: AuthModeType) {
  return {
    ...getDefaultTeamMember(),
    authType: AuthUserTypeEnum.root,
    appId: '0',
    apikey: ''
  };

  // return {
  //   userId: String(uid),
  //   teamId: String(teamId),
  //   tmbId: String(tmbId),
  //   appId,
  //   authType,
  //   apikey: openApiKey
  // };
}

/* set cookie */
export const setCookie = (res: NextApiResponse, token: string) => {
  res.setHeader(
    'Set-Cookie',
    `token=${token}; Path=/; HttpOnly; Max-Age=604800; Samesite=Strict; Secure;`
  );
};
/* clear cookie */
export const clearCookie = (res: NextApiResponse) => {
  res.setHeader('Set-Cookie', 'token=; Path=/; Max-Age=0');
};

/* file permission */
export const createFileToken = (data: FileTokenQuery) => {
  if (!process.env.FILE_TOKEN_KEY) {
    return Promise.reject('System unset FILE_TOKEN_KEY');
  }
  const expiredTime = Math.floor(Date.now() / 1000) + 60 * 30;

  const key = process.env.FILE_TOKEN_KEY as string;
  const token = jwt.sign(
    {
      ...data,
      exp: expiredTime
    },
    key
  );
  return Promise.resolve(token);
};

export const authFileToken = (token?: string) =>
  new Promise<FileTokenQuery>((resolve, reject) => {
    if (!token) {
      return reject(ERROR_ENUM.unAuthFile);
    }
    const key = process.env.FILE_TOKEN_KEY as string;

    jwt.verify(token, key, function (err, decoded: any) {
      if (err || !decoded.bucketName || !decoded?.teamId || !decoded?.tmbId || !decoded?.fileId) {
        reject(ERROR_ENUM.unAuthFile);
        return;
      }
      resolve({
        bucketName: decoded.bucketName,
        teamId: decoded.teamId,
        tmbId: decoded.tmbId,
        fileId: decoded.fileId
      });
    });
  });
