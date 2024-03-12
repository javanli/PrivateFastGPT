import { ChatSchema } from '@/packages/global/core/chat/type';
import { MongoChat } from '@/packages/service/core/chat/chatSchema';
import { AuthModeType } from '@/packages/service/support/permission/type';
import { authOutLink } from './outLink';
import { ChatErrEnum } from '@/packages/global/common/error/code/chat';
import { authUserRole } from '@/packages/service/support/permission/auth/user';
import { TeamMemberRoleEnum } from '@/packages/global/support/user/team/constant';
import { AuthResponseType } from '@/packages/global/support/permission/type';
/* 
  outLink: Must be the owner
  token: team owner and chat owner have all permissions
*/
export async function autChatCrud({
  appId,
  chatId,
  shareId,
  shareTeamId,
  outLinkUid,
  per = 'owner',
  ...props
}: AuthModeType & {
  appId: string;
  chatId?: string;
  shareTeamId?: string;
  shareId?: string;
  outLinkUid?: string;
}): Promise<{
  chat?: ChatSchema;
  isOutLink: boolean;
  uid?: string;
}> {
  const isOutLink = Boolean((shareId || shareTeamId) && outLinkUid);
  if (!chatId) return { isOutLink, uid: outLinkUid };

  const chat = await MongoChat.findOne({ appId, chatId });

  if (!chat) return { isOutLink, uid: outLinkUid };

  const { uid } = await (async () => {
    // outLink Auth
    if (shareId && outLinkUid) {
      const { uid } = await authOutLink({ shareId, outLinkUid });

      // auth outLinkUid
      if (chat.shareId === shareId && chat.outLinkUid === uid) {
        return { uid };
      }
      return Promise.reject(ChatErrEnum.unAuthChat);
    }
    if (shareTeamId && outLinkUid) {
      if (chat.teamId == shareTeamId && chat.outLinkUid === outLinkUid) {
        return { uid: outLinkUid };
      }
    }

    // req auth
    const { teamId, tmbId, role } = await authUserRole(props);

    if (String(teamId) !== String(chat.teamId)) return Promise.reject(ChatErrEnum.unAuthChat);

    if (role === TeamMemberRoleEnum.owner) return { uid: outLinkUid };
    if (String(tmbId) === String(chat.tmbId)) return { uid: outLinkUid };

    // admin
    if (per === 'r' && role === TeamMemberRoleEnum.admin) return { uid: outLinkUid };

    return Promise.reject(ChatErrEnum.unAuthChat);
  })();

  return {
    chat,
    isOutLink,
    uid
  };
}
