import type { NextApiResponse } from 'next';
import { ChatContextFilter, countMessagesChars } from '@/packages/service/core/chat/utils';
import type { moduleDispatchResType, ChatItemType } from '@/packages/global/core/chat/type.d';
import { ChatRoleEnum } from '@/packages/global/core/chat/constants';
import { sseResponseEventEnum } from '@/packages/service/common/response/constant';
import { textAdaptGptResponse } from '@/utils/adapt';
import { getAIApi } from '@/packages/service/core/ai/config';
import type { ChatCompletion, StreamChatType } from '@/packages/global/core/ai/type.d';
import type { LLMModelItemType } from '@/packages/global/core/ai/model';
import { postTextCensor } from '@/service/common/censor';
import { ChatCompletionRequestMessageRoleEnum } from '@/packages/global/core/ai/constant';
import type { ModuleDispatchResponse, ModuleItemType } from '@/packages/global/core/module/type.d';
import { countMessagesTokens, sliceMessagesTB } from '@/packages/global/common/string/tiktoken';
import { adaptChat2GptMessages } from '@/packages/global/core/chat/adapt';
import { Prompt_QuotePromptList, Prompt_QuoteTemplateList } from '@/global/core/prompt/AIChat';
import type { AIChatModuleProps } from '@/packages/global/core/module/node/type.d';
import { replaceVariable } from '@/packages/global/common/string/tools';
import type { ModuleDispatchProps } from '@/packages/global/core/module/type.d';
import { responseWrite, responseWriteController } from '@/packages/service/common/response';
import { getLLMModel, ModelTypeEnum } from '@/packages/service/core/ai/model';
import type { SearchDataResponseItemType } from '@/packages/global/core/dataset/type';
import { formatStr2ChatContent } from '@/packages/service/core/chat/utils';
import { ModuleInputKeyEnum, ModuleOutputKeyEnum } from '@/packages/global/core/module/constants';
import { getHistories } from '../utils';
import { filterSearchResultsByMaxChars } from '@/packages/global/core/dataset/search/utils';

export type ChatProps = ModuleDispatchProps<
  AIChatModuleProps & {
    [ModuleInputKeyEnum.userChatInput]: string;
    [ModuleInputKeyEnum.history]?: ChatItemType[] | number;
    [ModuleInputKeyEnum.aiChatDatasetQuote]?: SearchDataResponseItemType[];
  }
>;
export type ChatResponse = ModuleDispatchResponse<{
  [ModuleOutputKeyEnum.answerText]: string;
  [ModuleOutputKeyEnum.history]: ChatItemType[];
}>;

/* request openai chat */
export const dispatchChatCompletion = async (props: ChatProps): Promise<ChatResponse> => {
  let {
    res,
    stream = false,
    detail = false,
    user,
    histories,
    module: { name, outputs },
    params: {
      model,
      temperature = 0,
      maxToken = 4000,
      history = 6,
      quoteQA = [],
      userChatInput,
      isResponseAnswerText = true,
      systemPrompt = '',
      quoteTemplate,
      quotePrompt
    }
  } = props;
  if (!userChatInput) {
    return Promise.reject('Question is empty');
  }

  stream = stream && isResponseAnswerText;

  const chatHistories = getHistories(history, histories);

  // temperature adapt
  const modelConstantsData = getLLMModel(model);

  if (!modelConstantsData) {
    return Promise.reject('The chat model is undefined, you need to select a chat model.');
  }

  const { filterQuoteQA, quoteText } = filterQuote({
    quoteQA,
    model: modelConstantsData,
    quoteTemplate
  });

  // censor model and system key
  if (modelConstantsData.censor && !user.openaiAccount?.key) {
    await postTextCensor({
      text: `${systemPrompt}
      ${quoteText}
      ${userChatInput}
      `
    });
  }

  const { messages, filterMessages } = getChatMessages({
    model: modelConstantsData,
    histories: chatHistories,
    quoteText,
    quotePrompt,
    userChatInput,
    systemPrompt
  });
  const { max_tokens } = getMaxTokens({
    model: modelConstantsData,
    maxToken,
    filterMessages
  });

  // FastGPT temperature range: 1~10
  temperature = +(modelConstantsData.maxTemperature * (temperature / 10)).toFixed(2);
  temperature = Math.max(temperature, 0.01);
  console.log(`use openai account:${JSON.stringify(user.openaiAccount)}`);
  const ai = getAIApi({
    userKey: user.openaiAccount,
    timeout: 480000
  });

  const concatMessages = [
    ...(modelConstantsData.defaultSystemChatPrompt
      ? [
          {
            role: ChatCompletionRequestMessageRoleEnum.System,
            content: modelConstantsData.defaultSystemChatPrompt
          }
        ]
      : []),
    ...(await Promise.all(
      messages.map(async (item) => ({
        ...item,
        content: modelConstantsData.vision
          ? await formatStr2ChatContent(item.content)
          : item.content
      }))
    ))
  ];

  if (concatMessages.length === 0) {
    return Promise.reject('core.chat.error.Messages empty');
  }

  const response = await ai.chat.completions.create(
    {
      presence_penalty: 0,
      frequency_penalty: 0,
      ...modelConstantsData?.defaultConfig,
      model: modelConstantsData.model,
      temperature,
      max_tokens,
      stream,
      messages: concatMessages
    },
    {
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    }
  );

  const { answerText, completeMessages } = await (async () => {
    if (stream) {
      // sse response
      const { answer } = await streamResponse({
        res,
        detail,
        stream: response
      });
      // count tokens
      const completeMessages = filterMessages.concat({
        obj: ChatRoleEnum.AI,
        value: answer
      });

      targetResponse({ res, detail, outputs });

      return {
        answerText: answer,
        completeMessages
      };
    } else {
      const unStreamResponse = response as ChatCompletion;
      const answer = unStreamResponse.choices?.[0]?.message?.content || '';

      const completeMessages = filterMessages.concat({
        obj: ChatRoleEnum.AI,
        value: answer
      });

      return {
        answerText: answer,
        completeMessages
      };
    }
  })();

  const charsLength = countMessagesChars(completeMessages);
  const { totalPoints, modelName } = {
    totalPoints: 99999999,
    modelName: modelConstantsData.name
  };

  return {
    answerText,
    [ModuleOutputKeyEnum.responseData]: {
      totalPoints: user.openaiAccount?.key ? 0 : totalPoints,
      model: modelName,
      charsLength,
      query: `${userChatInput}`,
      maxToken: max_tokens,
      quoteList: filterQuoteQA,
      historyPreview: getHistoryPreview(completeMessages),
      contextTotalLen: completeMessages.length
    },
    [ModuleOutputKeyEnum.moduleDispatchBills]: [
      {
        moduleName: name,
        totalPoints: user.openaiAccount?.key ? 0 : totalPoints,
        model: modelName,
        charsLength
      }
    ],
    history: completeMessages
  };
};

function filterQuote({
  quoteQA = [],
  model,
  quoteTemplate
}: {
  quoteQA: ChatProps['params']['quoteQA'];
  model: LLMModelItemType;
  quoteTemplate?: string;
}) {
  function getValue(item: SearchDataResponseItemType, index: number) {
    return replaceVariable(quoteTemplate || Prompt_QuoteTemplateList[0].value, {
      q: item.q,
      a: item.a,
      source: item.sourceName,
      sourceId: String(item.sourceId || 'UnKnow'),
      index: index + 1
    });
  }

  // slice filterSearch
  const filterQuoteQA = filterSearchResultsByMaxChars(quoteQA, model.quoteMaxToken);

  const quoteText =
    filterQuoteQA.length > 0
      ? `${filterQuoteQA.map((item, index) => getValue(item, index).trim()).join('\n------\n')}`
      : '';

  return {
    filterQuoteQA: filterQuoteQA,
    quoteText
  };
}
function getChatMessages({
  quotePrompt,
  quoteText,
  histories = [],
  systemPrompt,
  userChatInput,
  model
}: {
  quotePrompt?: string;
  quoteText: string;
  histories: ChatItemType[];
  systemPrompt: string;
  userChatInput: string;
  model: LLMModelItemType;
}) {
  const question = quoteText
    ? replaceVariable(quotePrompt || Prompt_QuotePromptList[0].value, {
        quote: quoteText,
        question: userChatInput
      })
    : userChatInput;

  const messages: ChatItemType[] = [
    ...(systemPrompt
      ? [
          {
            obj: ChatRoleEnum.System,
            value: systemPrompt
          }
        ]
      : []),
    ...histories,
    {
      obj: ChatRoleEnum.Human,
      value: question
    }
  ];

  const filterMessages = ChatContextFilter({
    messages,
    maxTokens: Math.ceil(model.maxContext - 300) // filter token. not response maxToken
  });

  const adaptMessages = adaptChat2GptMessages({ messages: filterMessages, reserveId: false });

  return {
    messages: adaptMessages,
    filterMessages
  };
}
function getMaxTokens({
  maxToken,
  model,
  filterMessages = []
}: {
  maxToken: number;
  model: LLMModelItemType;
  filterMessages: ChatItemType[];
}) {
  maxToken = Math.min(maxToken, model.maxResponse);
  const tokensLimit = model.maxContext;

  /* count response max token */
  const promptsToken = countMessagesTokens({
    messages: filterMessages
  });
  maxToken = promptsToken + maxToken > tokensLimit ? tokensLimit - promptsToken : maxToken;

  return {
    max_tokens: maxToken
  };
}

function targetResponse({
  res,
  outputs,
  detail
}: {
  res: NextApiResponse;
  outputs: ModuleItemType['outputs'];
  detail: boolean;
}) {
  const targets =
    outputs.find((output) => output.key === ModuleOutputKeyEnum.answerText)?.targets || [];

  if (targets.length === 0) return;
  responseWrite({
    res,
    event: detail ? sseResponseEventEnum.answer : undefined,
    data: textAdaptGptResponse({
      text: '\n'
    })
  });
}

async function streamResponse({
  res,
  detail,
  stream
}: {
  res: NextApiResponse;
  detail: boolean;
  stream: StreamChatType;
}) {
  const write = responseWriteController({
    res,
    readStream: stream
  });
  let answer = '';
  for await (const part of stream) {
    if (res.closed) {
      stream.controller?.abort();
      break;
    }
    const content = part.choices?.[0]?.delta?.content || '';
    answer += content;

    responseWrite({
      write,
      event: detail ? sseResponseEventEnum.answer : undefined,
      data: textAdaptGptResponse({
        text: content
      })
    });
  }

  if (!answer) {
    return Promise.reject('core.chat.Chat API is error or undefined');
  }

  return { answer };
}

function getHistoryPreview(completeMessages: ChatItemType[]) {
  return completeMessages.map((item, i) => {
    if (item.obj === ChatRoleEnum.System) return item;
    if (i >= completeMessages.length - 2) return item;
    return {
      ...item,
      value: item.value.length > 15 ? `${item.value.slice(0, 15)}...` : item.value
    };
  });
}
