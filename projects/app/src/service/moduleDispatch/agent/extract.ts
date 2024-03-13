import { adaptChat2GptMessages } from '@/packages/global/core/chat/adapt';
import { ChatContextFilter, countMessagesChars } from '@/packages/service/core/chat/utils';
import type { moduleDispatchResType, ChatItemType } from '@/packages/global/core/chat/type.d';
import { ChatRoleEnum } from '@/packages/global/core/chat/constants';
import { getAIApi } from '@/packages/service/core/ai/config';
import type {
  ContextExtractAgentItemType,
  ModuleDispatchResponse
} from '@/packages/global/core/module/type';
import { ModuleInputKeyEnum, ModuleOutputKeyEnum } from '@/packages/global/core/module/constants';
import type { ModuleDispatchProps } from '@/packages/global/core/module/type.d';
import { Prompt_ExtractJson } from '@/global/core/prompt/agent';
import { replaceVariable } from '@/packages/global/common/string/tools';
import { LLMModelItemType } from '@/packages/global/core/ai/model';
import { getHistories } from '../utils';
import { ModelTypeEnum, getLLMModel } from '@/packages/service/core/ai/model';

type Props = ModuleDispatchProps<{
  [ModuleInputKeyEnum.history]?: ChatItemType[];
  [ModuleInputKeyEnum.contextExtractInput]: string;
  [ModuleInputKeyEnum.extractKeys]: ContextExtractAgentItemType[];
  [ModuleInputKeyEnum.description]: string;
  [ModuleInputKeyEnum.aiModel]: string;
}>;
type Response = ModuleDispatchResponse<{
  [ModuleOutputKeyEnum.success]?: boolean;
  [ModuleOutputKeyEnum.failed]?: boolean;
  [ModuleOutputKeyEnum.contextExtractFields]: string;
}>;

const agentFunName = 'extract_json_data';

export async function dispatchContentExtract(props: Props): Promise<Response> {
  const {
    user,
    module: { name },
    histories,
    params: { content, history = 6, model, description, extractKeys }
  } = props;

  if (!content) {
    return Promise.reject('Input is empty');
  }

  const extractModel = getLLMModel(model);
  const chatHistories = getHistories(history, histories);

  const { arg, charsLength } = await (async () => {
    if (extractModel.toolChoice) {
      return toolChoice({
        ...props,
        histories: chatHistories,
        extractModel
      });
    }
    return completions({
      ...props,
      histories: chatHistories,
      extractModel
    });
  })();

  // remove invalid key
  for (let key in arg) {
    if (!extractKeys.find((item) => item.key === key)) {
      delete arg[key];
    }
    if (arg[key] === '') {
      delete arg[key];
    }
  }

  // auth fields
  let success = !extractKeys.find((item) => !(item.key in arg));
  // auth empty value
  if (success) {
    for (const key in arg) {
      if (arg[key] === '') {
        success = false;
        break;
      }
    }
  }

  const { totalPoints, modelName } = {
    totalPoints: 99999999,
    modelName: extractModel.name
  };

  return {
    [ModuleOutputKeyEnum.success]: success ? true : undefined,
    [ModuleOutputKeyEnum.failed]: success ? undefined : true,
    [ModuleOutputKeyEnum.contextExtractFields]: JSON.stringify(arg),
    ...arg,
    [ModuleOutputKeyEnum.responseData]: {
      totalPoints: user.openaiAccount?.key ? 0 : totalPoints,
      model: modelName,
      query: content,
      charsLength,
      extractDescription: description,
      extractResult: arg,
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
}

async function toolChoice({
  extractModel,
  user,
  histories,
  params: { content, extractKeys, description }
}: Props & { extractModel: LLMModelItemType }) {
  const messages: ChatItemType[] = [
    ...histories,
    {
      obj: ChatRoleEnum.Human,
      value: `你的任务：
"""
${description || '根据用户要求获取适当的 JSON 字符串。'}
"""

要求：
"""
- 如果字段为空，你返回空字符串。
- 字符串不要换行。
- 结合上下文和当前问题进行获取。
"""

当前问题: "${content}"`
    }
  ];
  const filterMessages = ChatContextFilter({
    messages,
    maxTokens: extractModel.maxContext
  });
  const adaptMessages = adaptChat2GptMessages({ messages: filterMessages, reserveId: false });

  const properties: Record<
    string,
    {
      type: string;
      description: string;
    }
  > = {};
  extractKeys.forEach((item) => {
    properties[item.key] = {
      type: 'string',
      description: item.desc,
      ...(item.enum ? { enum: item.enum.split('\n') } : {})
    };
  });

  // function body
  const agentFunction = {
    name: agentFunName,
    description,
    parameters: {
      type: 'object',
      properties,
      required: extractKeys.filter((item) => item.required).map((item) => item.key)
    }
  };

  const ai = getAIApi({
    userKey: user.openaiAccount,
    timeout: 480000
  });

  const response = await ai.chat.completions.create({
    model: extractModel.model,
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

  const arg: Record<string, any> = (() => {
    try {
      return JSON.parse(
        response?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || '{}'
      );
    } catch (error) {
      console.log(agentFunction.parameters);
      console.log(response.choices?.[0]?.message?.tool_calls?.[0]?.function);
      console.log('Your model may not support tool_call', error);
      return {};
    }
  })();

  const functionChars =
    description.length + extractKeys.reduce((sum, item) => sum + item.desc.length, 0);

  return {
    rawResponse: response?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || '',
    charsLength: countMessagesChars(messages) + functionChars,
    arg
  };
}

async function completions({
  extractModel,
  user,
  histories,
  params: { content, extractKeys, description }
}: Props & { extractModel: LLMModelItemType }) {
  const messages: ChatItemType[] = [
    {
      obj: ChatRoleEnum.Human,
      value: replaceVariable(extractModel.customExtractPrompt || Prompt_ExtractJson, {
        description,
        json: extractKeys
          .map(
            (item) =>
              `{"key":"${item.key}", "description":"${item.desc}", "required":${item.required}${
                item.enum ? `, "enum":"[${item.enum.split('\n')}]"` : ''
              }}`
          )
          .join('\n'),
        text: `${histories.map((item) => `${item.obj}:${item.value}`).join('\n')}
Human: ${content}`
      })
    }
  ];

  const ai = getAIApi({
    userKey: user.openaiAccount,
    timeout: 480000
  });

  const data = await ai.chat.completions.create({
    model: extractModel.model,
    temperature: 0.01,
    messages: adaptChat2GptMessages({ messages, reserveId: false }),
    stream: false
  });
  const answer = data.choices?.[0].message?.content || '';

  // parse response
  const start = answer.indexOf('{');
  const end = answer.lastIndexOf('}');

  if (start === -1 || end === -1)
    return {
      rawResponse: answer,
      charsLength: countMessagesChars(messages),
      arg: {}
    };

  const jsonStr = answer
    .substring(start, end + 1)
    .replace(/(\\n|\\)/g, '')
    .replace(/  /g, '');

  try {
    return {
      rawResponse: answer,
      charsLength: countMessagesChars(messages),

      arg: JSON.parse(jsonStr) as Record<string, any>
    };
  } catch (error) {
    return {
      rawResponse: answer,
      charsLength: countMessagesChars(messages),
      arg: {}
    };
  }
}
