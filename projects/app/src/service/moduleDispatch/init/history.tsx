import { ModuleInputKeyEnum } from '@/packages/global/core/module/constants';
import type { ChatItemType } from '@/packages/global/core/chat/type.d';
import type { ModuleDispatchProps } from '@/packages/global/core/module/type.d';
import { getHistories } from '../utils';
export type HistoryProps = ModuleDispatchProps<{
  maxContext?: number;
  [ModuleInputKeyEnum.history]: ChatItemType[];
}>;

export const dispatchHistory = (props: Record<string, any>) => {
  const {
    histories,
    params: { maxContext }
  } = props as HistoryProps;

  return {
    history: getHistories(maxContext, histories)
  };
};
