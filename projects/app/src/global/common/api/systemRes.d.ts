import type {
  LLMModelItemType,
  VectorModelItemType,
  AudioSpeechModels,
  WhisperModelType,
  ReRankModelItemType
} from '@/packages/global/core/ai/model.d';

import type { FastGPTFeConfigsType } from '@/packages/global/common/system/types/index.d';
import { AppSimpleEditConfigTemplateType } from '@/packages/global/core/app/type';
import { SubPlanType } from '@/packages/global/support/wallet/sub/type';

export type InitDateResponse = {
  llmModels: LLMModelItemType[];
  vectorModels: VectorModelItemType[];
  audioSpeechModels: AudioSpeechModels[];
  reRankModels: ReRankModelItemType[];
  whisperModel: WhisperModelType;
  feConfigs: FastGPTFeConfigsType;
  subPlans?: SubPlanType;
  systemVersion: string;
  simpleModeTemplates: AppSimpleEditConfigTemplateType[];
};
