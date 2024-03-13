import { adaptChat2GptMessages } from '@/packages/global/core/chat/adapt';
import { ChatContextFilter, countMessagesChars } from '@/packages/service/core/chat/utils';
import type { moduleDispatchResType, ChatItemType } from '@/packages/global/core/chat/type.d';
import { ChatRoleEnum } from '@/packages/global/core/chat/constants';
import { getAIApi } from '@/packages/service/core/ai/config';
import type {
  ClassifyQuestionAgentItemType,
  ModuleDispatchResponse
} from '@/packages/global/core/module/type.d';
import { ModuleInputKeyEnum, ModuleOutputKeyEnum } from '@/packages/global/core/module/constants';
import type { ModuleDispatchProps } from '@/packages/global/core/module/type.d';
import { replaceVariable } from '@/packages/global/common/string/tools';
import { Prompt_CQJson } from '@/global/core/prompt/agent';
import { LLMModelItemType } from '@/packages/global/core/ai/model';
import { ModelTypeEnum, getLLMModel } from '@/packages/service/core/ai/model';
import { getHistories } from '../utils';

type Props = ModuleDispatchProps<{
  [ModuleInputKeyEnum.aiModel]: string;
  [ModuleInputKeyEnum.aiSystemPrompt]?: string;
  [ModuleInputKeyEnum.history]?: ChatItemType[] | number;
  [ModuleInputKeyEnum.userChatInput]: string;
  [ModuleInputKeyEnum.agents]: ClassifyQuestionAgentItemType[];
}>;
type CQResponse = ModuleDispatchResponse<{
  [key: string]: any;
}>;

const agentFunName = 'classify_question';

/* request openai chat */
export const dispatchClassifyQuestion = async (props: Props): Promise<CQResponse> => {
  const {
    user,
    module: { name },
    histories,
    params: { model, history = 6, agents, userChatInput }
  } = props as Props;

  if (!userChatInput) {
    return Promise.reject('Input is empty');
  }

  const cqModel = getLLMModel(model);

  const chatHistories = getHistories(history, histories);

  const { arg, charsLength } = await (async () => {
    if (cqModel.toolChoice) {
      return toolChoice({
        ...props,
        histories: chatHistories,
        cqModel
      });
    }
    return completions({
      ...props,
      histories: chatHistories,
      cqModel
    });
  })();

  const result = agents.find((item) => item.key === arg?.type) || agents[agents.length - 1];

  const { totalPoints, modelName } = {
    totalPoints: 99999999,
    modelName: cqModel.name
  };

  return {
    [result.key]: true,
    [ModuleOutputKeyEnum.responseData]: {
      totalPoints: user.openaiAccount?.key ? 0 : totalPoints,
      model: modelName,
      query: userChatInput,
      charsLength,
      cqList: agents,
      cqResult: result.value,
      contextTotalLen: chatHistories.length + 2
    },
    [ModuleOutputKeyEnum.moduleDispatchBills]: [
      {
        moduleName: name,
        totalPoints: user.openaiAccount?.key ? 0 : totalPoints,
        model: modelName,
        charsLength
      }
    ]
  };
};

async function toolChoice({
  user,
  cqModel,
  histories,
  params: { agents, systemPrompt, userChatInput }
}: Props & { cqModel: LLMModelItemType }) {
  const messages: ChatItemType[] = [
    ...histories,
    {
      obj: ChatRoleEnum.Human,
      value: systemPrompt
        ? `<背景知识>
${systemPrompt}
</背景知识>

问题: "${userChatInput}"
      `
        : userChatInput
    }
  ];

  const filterMessages = ChatContextFilter({
    messages,
    maxTokens: cqModel.maxContext
  });
  const adaptMessages = adaptChat2GptMessages({ messages: filterMessages, reserveId: false });

  // function body
  const agentFunction = {
    name: agentFunName,
    description: '根据对话记录及背景知识，对问题进行分类，并返回对应的类型字段',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: `问题类型。下面是几种可选的问题类型: ${agents
            .map((item) => `${item.value}，返回：'${item.key}'`)
            .join('；')}`,
          enum: agents.map((item) => item.key)
        }
      },
      required: ['type']
    }
  };
  const ai = getAIApi({
    userKey: user.openaiAccount,
    timeout: 480000
  });

  const response = await ai.chat.completions.create({
    model: cqModel.model,
    temperature: 0,
    messages: [...adaptMessages],
    tools: [
      {
        type: 'function',
        function: agentFunction
      }
    ],
    tool_choice: { type: 'function', function: { name: agentFunName } }
  });

  try {
    const arg = JSON.parse(
      response?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || ''
    );
    const functionChars =
      agentFunction.description.length +
      agentFunction.parameters.properties.type.description.length;

    return {
      arg,
      charsLength: countMessagesChars(messages) + functionChars
    };
  } catch (error) {
    console.log(agentFunction.parameters);
    console.log(response.choices?.[0]?.message);

    console.log('Your model may not support toll_call', error);

    return {
      arg: {},
      charsLength: 0
    };
  }
}

async function completions({
  cqModel,
  user,
  histories,
  params: { agents, systemPrompt = '', userChatInput }
}: Props & { cqModel: LLMModelItemType }) {
  const messages: ChatItemType[] = [
    {
      obj: ChatRoleEnum.Human,
      value: replaceVariable(cqModel.customCQPrompt || Prompt_CQJson, {
        systemPrompt: systemPrompt || 'null',
        typeList: agents
          .map((item) => `{"questionType": "${item.value}", "typeId": "${item.key}"}`)
          .join('\n'),
        history: histories.map((item) => `${item.obj}:${item.value}`).join('\n'),
        question: userChatInput
      })
    }
  ];

  const ai = getAIApi({
    userKey: user.openaiAccount,
    timeout: 480000
  });

  const data = await ai.chat.completions.create({
    model: cqModel.model,
    temperature: 0.01,
    messages: adaptChat2GptMessages({ messages, reserveId: false }),
    stream: false
  });
  const answer = data.choices?.[0].message?.content || '';

  const id =
    agents.find((item) => answer.includes(item.key) || answer.includes(item.value))?.key || '';

  return {
    charsLength: countMessagesChars(messages),
    arg: { type: id }
  };
}
