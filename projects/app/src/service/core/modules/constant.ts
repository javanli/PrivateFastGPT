import { FlowNodeTypeEnum } from '@/packages/global/core/module/node/constant';

export const initRunningModuleType: Record<string, boolean> = {
  [FlowNodeTypeEnum.historyNode]: true,
  [FlowNodeTypeEnum.questionInput]: true,
  [FlowNodeTypeEnum.pluginInput]: true
};
