import type { HistoryItemType, ChatSiteItemType } from '../../core/chat/type';
import { OutLinkSchema } from './type';

export type AuthOutLinkInitProps = {
  outLinkUid: string;
  tokenUrl?: string;
};
export type AuthOutLinkChatProps = { ip?: string | null; outLinkUid: string; question: string };
export type AuthOutLinkLimitProps = AuthOutLinkChatProps & { outLink: OutLinkSchema };
export type AuthOutLinkResponse = {
  uid: string;
};
