import { FlowNodeInputItemType } from '@/packages/global/core/module/node/type';

export type RenderInputProps = {
  inputs?: FlowNodeInputItemType[];
  item: FlowNodeInputItemType;
  moduleId: string;
};
