import type { UserModelSchema } from '@/packages/global/support/user/type';
import OpenAI from '@/packages/global/core/ai';

export const openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://apic.ohmygpt.com/v1';
export const baseUrl = process.env.ONEAPI_URL || openaiBaseUrl;

export const systemAIChatKey =
  process.env.CHAT_API_KEY || 'sk-H7AGcTCdf4B0148ee666T3BlBkFJ7B2274A961D3450eb8dd';

export const getAIApi = (props?: {
  userKey?: UserModelSchema['openaiAccount'];
  timeout?: number;
}) => {
  const { userKey, timeout } = props || {};

  return new OpenAI({
    apiKey: userKey?.key || systemAIChatKey,
    baseURL: userKey?.baseUrl || baseUrl,
    httpAgent: global.httpsAgent,
    timeout,
    maxRetries: 2
  });
};
