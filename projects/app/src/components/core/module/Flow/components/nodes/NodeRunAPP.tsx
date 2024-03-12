import React from 'react';
import { NodeProps } from 'reactflow';
import NodeCard from '../render/NodeCard';
import { FlowModuleItemType } from '@/packages/global/core/module/type.d';
import Divider from '../modules/Divider';
import Container from '../modules/Container';
import RenderInput from '../render/RenderInput';
import RenderOutput from '../render/RenderOutput';

const NodeRunAPP = ({ data, selected }: NodeProps<FlowModuleItemType>) => {
  const { moduleId, inputs, outputs } = data;

  return (
    <NodeCard minW={'350px'} selected={selected} {...data}>
      <Container borderTop={'2px solid'} borderTopColor={'myGray.200'}>
        <RenderInput moduleId={moduleId} flowInputList={inputs} />
      </Container>
      <Divider text="Output" />
      <Container>
        <RenderOutput moduleId={moduleId} flowOutputList={outputs} />
      </Container>
    </NodeCard>
  );
};
export default React.memo(NodeRunAPP);
