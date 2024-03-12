import {
  AudioSpeechModelType,
  ChatModelItemType,
  FunctionModelItemType,
  LLMModelItemType,
  ReRankModelItemType,
  VectorModelItemType,
  WhisperModelType
} from '@/packages/global/core/ai/model.d';
import { TrackEventName } from '@/constants/common';
import { AppSimpleEditConfigTemplateType } from '@/packages/global/core/app/type';
import { FastGPTFeConfigsType, SystemEnvType } from '@/packages/global/common/system/types';
import { SubPlanType } from '@/packages/global/support/wallet/sub/type';

export type PagingData<T> = {
  pageNum: number;
  pageSize: number;
  data: T[];
  total?: number;
};

export type RequestPaging = { pageNum: number; pageSize: number; [key]: any };

declare global {
  var systemEnv: SystemEnvType;
  var systemInitd: boolean;

  var qaQueueLen: number;
  var vectorQueueLen: number;

  var systemVersion: string;

  var simpleModeTemplates: AppSimpleEditConfigTemplateType[];

  interface Window {
    grecaptcha: any;
    QRCode: any;
    umami?: {
      track: (event: `${TrackEventName}`, data: any) => void;
    };
  }
}
