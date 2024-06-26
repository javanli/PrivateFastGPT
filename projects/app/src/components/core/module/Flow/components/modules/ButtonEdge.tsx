import React, { useMemo } from 'react';
import { BezierEdge, getBezierPath, EdgeLabelRenderer, EdgeProps } from 'reactflow';
import { onDelConnect, useFlowProviderStore } from '../../FlowProvider';
import { Flex } from '@chakra-ui/react';
import MyIcon from '@/packages/web/components/common/Icon';

const ButtonEdge = (props: EdgeProps) => {
  const { nodes } = useFlowProviderStore();
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
    style = {}
  } = props;

  const active = (() => {
    const connectNode = nodes.find((node) => {
      return (node.id === props.source || node.id === props.target) && node.selected;
    });
    return !!(connectNode || selected);
  })();

  const [, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  const memoEdgeLabel = useMemo(() => {
    return (
      <EdgeLabelRenderer>
        <Flex
          alignItems={'center'}
          justifyContent={'center'}
          position={'absolute'}
          transform={`translate(-50%, -50%) translate(${labelX}px,${labelY}px)`}
          pointerEvents={'all'}
          w={'20px'}
          h={'20px'}
          bg={'white'}
          borderRadius={'20px'}
          color={'black'}
          cursor={'pointer'}
          borderWidth={'1px'}
          borderColor={'borderColor.low'}
          zIndex={active ? 1000 : 0}
          _hover={{
            boxShadow: '0 0 6px 2px rgba(0, 0, 0, 0.08)'
          }}
          onClick={() => onDelConnect(id)}
        >
          <MyIcon
            name="closeSolid"
            w={'100%'}
            color={active ? 'primary.800' : 'myGray.400'}
          ></MyIcon>
        </Flex>
        <Flex
          alignItems={'center'}
          justifyContent={'center'}
          position={'absolute'}
          transform={`translate(-78%, -50%) translate(${targetX}px,${targetY}px)`}
          pointerEvents={'all'}
          w={'16px'}
          h={'16px'}
          bg={'white'}
          zIndex={active ? 1000 : 0}
        >
          <MyIcon
            name={'common/rightArrowLight'}
            w={'100%'}
            color={active ? 'primary.800' : 'myGray.400'}
          ></MyIcon>
        </Flex>
      </EdgeLabelRenderer>
    );
  }, [id, labelX, labelY, active, targetX, targetY]);

  const memoBezierEdge = useMemo(() => {
    const edgeStyle: React.CSSProperties = {
      ...style,
      ...(active
        ? {
            strokeWidth: 5,
            stroke: '#3370ff'
          }
        : { strokeWidth: 2, zIndex: 2, stroke: 'myGray.300' })
    };

    return <BezierEdge {...props} style={edgeStyle} />;
  }, [props, active, style]);

  return (
    <>
      {memoBezierEdge}
      {memoEdgeLabel}
    </>
  );
};

export default React.memo(ButtonEdge);
