import { FlowNodeOutputItemType } from '@/packages/global/core/module/node/type';

export type RenderOutputProps = {
  outputs?: FlowNodeOutputItemType[];
  item: FlowNodeOutputItemType;
  moduleId: string;
};
