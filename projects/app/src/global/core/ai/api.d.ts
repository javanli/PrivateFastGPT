import { ChatMessageItemType } from '@/packages/global/core/ai/type.d';

export type CreateQuestionGuideParams = {
  messages: ChatMessageItemType[];
  shareId?: string;
};
