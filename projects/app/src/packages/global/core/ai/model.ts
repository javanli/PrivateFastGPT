export type LLMModelItemType = {
  model: string;
  name: string;
  maxContext: number;
  maxResponse: number;
  quoteMaxToken: number;
  maxTemperature: number;

  charsPointsPrice: number; // 1k chars=n points

  censor?: boolean;
  vision?: boolean;
  datasetProcess?: boolean;

  functionCall: boolean;
  toolChoice: boolean;

  customCQPrompt: string;
  customExtractPrompt: string;

  defaultSystemChatPrompt?: string;
  defaultConfig?: Record<string, any>;
};

export type VectorModelItemType = {
  model: string;
  name: string;
  defaultToken: number;
  charsPointsPrice: number;
  maxToken: number;
  weight: number;
  hidden?: boolean;
  defaultConfig?: Record<string, any>;
};

export type ReRankModelItemType = {
  model: string;
  name: string;
  charsPointsPrice: number;
  requestUrl?: string;
  requestAuth?: string;
};

export type AudioSpeechModelType = {
  model: string;
  name: string;
  charsPointsPrice: number;
  voices: { label: string; value: string; bufferId: string }[];
};

export type WhisperModelType = {
  model: string;
  name: string;
  charsPointsPrice: number; // 60s = n points
};

export const defaultQAModels: LLMModelItemType[] = [
  {
    model: 'gpt-3.5-turbo',
    name: 'gpt-3.5-turbo',
    maxContext: 16000,
    maxResponse: 16000,
    quoteMaxToken: 13000,
    maxTemperature: 1.2,
    charsPointsPrice: 0,
    censor: false,
    vision: false,
    datasetProcess: true,
    toolChoice: true,
    functionCall: false,
    customCQPrompt: '',
    customExtractPrompt: '',
    defaultSystemChatPrompt: '',
    defaultConfig: {}
  }
];

export const defaultVectorModels: VectorModelItemType[] = [
  {
    model: 'text-embedding-ada-002',
    name: 'Embedding-2',
    charsPointsPrice: 0,
    defaultToken: 500,
    maxToken: 3000,
    weight: 100
  }
];
