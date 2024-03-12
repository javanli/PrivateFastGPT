import type { ModuleDispatchProps } from '@/packages/global/core/module/type.d';

export type PluginInputProps = ModuleDispatchProps<{
  [key: string]: any;
}>;

export const dispatchPluginInput = (props: PluginInputProps) => {
  const { params } = props;

  return params;
};
