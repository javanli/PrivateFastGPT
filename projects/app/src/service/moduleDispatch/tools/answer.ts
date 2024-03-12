import { sseResponseEventEnum } from '@/packages/service/common/response/constant';
import { responseWrite } from '@/packages/service/common/response';
import { textAdaptGptResponse } from '@/utils/adapt';
import type { ModuleDispatchProps } from '@/packages/global/core/module/type.d';
import { ModuleOutputKeyEnum } from '@/packages/global/core/module/constants';
export type AnswerProps = ModuleDispatchProps<{
  text: string;
}>;
export type AnswerResponse = {
  [ModuleOutputKeyEnum.answerText]: string;
};

export const dispatchAnswer = (props: Record<string, any>): AnswerResponse => {
  const {
    res,
    detail,
    stream,
    params: { text = '' }
  } = props as AnswerProps;

  const formatText = typeof text === 'string' ? text : JSON.stringify(text, null, 2);

  if (stream) {
    responseWrite({
      res,
      event: detail ? sseResponseEventEnum.response : undefined,
      data: textAdaptGptResponse({
        text: `\n${formatText}`
      })
    });
  }

  return {
    [ModuleOutputKeyEnum.answerText]: formatText
  };
};
