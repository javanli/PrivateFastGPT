import { connectionMongo, Model, Schema, model } from '../../common/mongo';

import { ChatItemSchema as ChatItemType } from '@/packages/global/core/chat/type';
import { ChatRoleMap } from '@/packages/global/core/chat/constants';
import { getNanoid } from '@/packages/global/common/string/tools';
import {
  TeamCollectionName,
  TeamMemberCollectionName
} from '@/packages/global/support/user/team/constant';
import { appCollectionName } from '../app/schema';
import { ModuleOutputKeyEnum } from '@/packages/global/core/module/constants';

export const ChatItemCollectionName = 'chatitems';

const ChatItemSchema = new Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  tmbId: {
    type: Schema.Types.ObjectId,
    ref: TeamMemberCollectionName,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId
  },
  chatId: {
    type: String,
    required: true
  },
  dataId: {
    type: String,
    required: true,
    default: () => getNanoid(22)
  },
  appId: {
    type: Schema.Types.ObjectId,
    ref: appCollectionName,
    required: true
  },
  time: {
    type: Date,
    default: () => new Date()
  },
  obj: {
    // chat role
    type: String,
    required: true,
    enum: Object.keys(ChatRoleMap)
  },
  value: {
    // chat content
    type: String,
    default: ''
  },
  userGoodFeedback: {
    type: String
  },
  userBadFeedback: {
    type: String
  },
  customFeedbacks: {
    type: [String]
  },
  adminFeedback: {
    type: {
      datasetId: String,
      collectionId: String,
      dataId: String,
      q: String,
      a: String
    }
  },
  [ModuleOutputKeyEnum.responseData]: {
    type: Array,
    default: []
  }
});

try {
  ChatItemSchema.index({ dataId: 1 }, { background: true });
  /* delete by app; 
     delete by chat id;
     get chat list; 
     get chat logs; 
     close custom feedback; 
  */
  ChatItemSchema.index({ appId: 1, chatId: 1, dataId: 1 }, { background: true });
  // admin charts
  ChatItemSchema.index({ time: -1, obj: 1 }, { background: true });
  // timer, clear history
  ChatItemSchema.index({ teamId: 1, time: -1 }, { background: true });
} catch (error) {
  console.log(error);
}

export const MongoChatItem: Model<ChatItemType> = model(ChatItemCollectionName, ChatItemSchema);

MongoChatItem.syncIndexes();
