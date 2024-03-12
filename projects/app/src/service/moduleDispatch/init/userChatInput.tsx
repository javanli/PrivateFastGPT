import { ModuleInputKeyEnum } from '@/packages/global/core/module/constants';
import type { ModuleDispatchProps } from '@/packages/global/core/module/type.d';
export type UserChatInputProps = ModuleDispatchProps<{
  [ModuleInputKeyEnum.userChatInput]: string;
}>;

export const dispatchChatInput = (props: Record<string, any>) => {
  const {
    params: { userChatInput }
  } = props as UserChatInputProps;
  return {
    userChatInput
  };
};
