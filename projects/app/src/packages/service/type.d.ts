import { FastGPTFeConfigsType } from '@/packages/global/common/system/types';
import {
  AudioSpeechModelType,
  ReRankModelItemType,
  WhisperModelType,
  VectorModelItemType,
  LLMModelItemType
} from '@/packages/global/core/ai/model.d';
import { SubPlanType } from '@/packages/global/support/wallet/sub/type';

declare global {
  var feConfigs: FastGPTFeConfigsType;
  var subPlans: SubPlanType | undefined;

  var llmModels: LLMModelItemType[];
  var vectorModels: VectorModelItemType[];
  var audioSpeechModels: AudioSpeechModelType[];
  var whisperModel: WhisperModelType;
  var reRankModels: ReRankModelItemType[];
}
